# Note: The manual agent loop — the core of this assignment. No agent
# frameworks are used: this file IS the agent. The loop follows the pattern
#
#     Observe -> Think -> Act -> Update -> Repeat
#
# and is shared by the required CLI (agent.py) and the optional dashboard
# route (POST /agent/chat), so both run the exact same logic.

import json
import os

from dotenv import load_dotenv
from openai import OpenAI

from agent_core.logger import log_event
from agent_core.tools import TOOL_SCHEMAS, run_tool

load_dotenv()

# Note: DeepSeek exposes an OpenAI-compatible API, so the official `openai`
# SDK works as the client — we just point it at DeepSeek's base URL.
BASE_URL = os.getenv("BASE_URL", "https://api.deepseek.com")
MODEL = os.getenv("MODEL", "deepseek-chat")

SYSTEM_PROMPT = (
    "You are the inventory assistant for Carla's coffee shop supply store, "
    "which serves two physical locations. You manage stock through the tools "
    "provided.\n"
    "Guidelines:\n"
    "- Always check the actual inventory with a tool before answering "
    "questions about stock levels; never guess quantities.\n"
    "- When asked whether stock will 'cover the week', look at the current "
    "quantity and reason out loud about it; if usage data is not available, "
    "say what assumption you are making.\n"
    "- Use positive deltas for stock received and negative deltas for stock "
    "sold or used.\n"
    "- Only delete a product record when the user clearly asks to remove or "
    "delete that product; check inventory first if the product id is unclear.\n"
    "- After changing inventory, confirm exactly what changed (product, "
    "old/new quantity).\n"
    "- Be concise and practical, like a helpful store operations assistant."
)

_client: OpenAI | None = None


def get_client() -> OpenAI:
    # Note: Created lazily so importing this module never fails just because
    # the API key is missing (e.g. when only the REST API is being used).
    global _client
    if _client is None:
        api_key = os.environ.get("API_KEY")
        if not api_key:
            raise RuntimeError("API_KEY is not set. Copy .env.example to .env "
                               "and add your DeepSeek key.")
        _client = OpenAI(api_key=api_key, base_url=BASE_URL)
    return _client


def build_initial_history() -> list[dict]:
    return [{"role": "system", "content": SYSTEM_PROMPT}]


def run_agent_turn(
    user_message: str,
    history: list[dict],
    max_iterations: int = 8,
) -> tuple[str, list[dict], list[dict]]:
    """Run one full agent turn and return (reply, history, tool_trace)."""

    # --- OBSERVE -----------------------------------------------------------
    # Note: Take in the user's message: add it to the conversation history
    # and record it in the log.
    history.append({"role": "user", "content": user_message})
    log_event("user", user_message)

    tool_trace: list[dict] = []
    client = get_client()

    # Note: max_iterations is a safety guard against infinite tool-calling
    # loops. Normally the loop ends much earlier, when the model answers
    # without requesting a tool.
    for _ in range(max_iterations):

        # --- THINK ---------------------------------------------------------
        # Note: Ask the LLM what to do next, given the conversation so far
        # and the available tools. The model chooses: call a tool, or answer.
        response = client.chat.completions.create(
            model=MODEL,
            messages=history,
            tools=TOOL_SCHEMAS,
        )
        message = response.choices[0].message

        # Note: STOP CONDITION — no pending tool calls means the model has
        # produced its final answer for this turn.
        if not message.tool_calls:
            reply = message.content or ""
            history.append({"role": "assistant", "content": reply})
            log_event("agent", reply)
            return reply, history, tool_trace

        # --- ACT + UPDATE ----------------------------------------------------
        # Note: The assistant message that requested the tool calls must be
        # added to history first, so the tool results that follow have
        # something to attach to (via tool_call_id).
        history.append({
            "role": "assistant",
            "content": message.content or "",
            "tool_calls": [
                {
                    "id": call.id,
                    "type": "function",
                    "function": {
                        "name": call.function.name,
                        "arguments": call.function.arguments,
                    },
                }
                for call in message.tool_calls
            ],
        })

        for call in message.tool_calls:
            tool_name = call.function.name
            try:
                arguments = json.loads(call.function.arguments or "{}")
            except json.JSONDecodeError:
                arguments = {}

            # ACT: execute the API tool the model selected.
            log_event("agent", f"Calling {tool_name} with {arguments}", tool_name)
            result = run_tool(tool_name, arguments)
            tool_trace.append({
                "tool": tool_name,
                "arguments": arguments,
                "result": result,
            })

            # UPDATE: inject the tool result back into the conversation so
            # the next THINK step can see it.
            history.append({
                "role": "tool",
                "tool_call_id": call.id,
                "content": result,
            })
            log_event("tool", result, tool_name)

        # --- REPEAT: back to THINK with the updated history. ----------------

    # Note: Safety exit — the model kept calling tools past the limit.
    reply = ("I reached my step limit for this request. Here is what I did so "
             "far: " + ", ".join(t["tool"] for t in tool_trace) +
             ". Please ask again to continue.")
    history.append({"role": "assistant", "content": reply})
    log_event("agent", reply)
    return reply, history, tool_trace
