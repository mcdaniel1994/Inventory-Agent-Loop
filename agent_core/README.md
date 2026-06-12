# `agent_core/` — The Hand-Written Agent Loop

This package **is the agent**. No agent frameworks (LangChain, LlamaIndex,
AutoGen, CrewAI, …) are used anywhere — the loop is plain Python, and the only
AI dependency is the `openai` client SDK pointed at DeepSeek's
OpenAI-compatible API.

It is shared by two entrypoints, which run the exact same logic:

- `agent.py` (project root) — the required CLI.
- `POST /agent/chat` in `api/app.py` — the optional dashboard chat.

## Files

| File | What it does |
|---|---|
| `loop.py` | `run_agent_turn()` — the manual **Observe → Think → Act → Update → Repeat** loop, plus the system prompt (persona: inventory assistant for Carla's two-location coffee shop supply store) and the lazily-created DeepSeek client. |
| `tools.py` | The four tool definitions the LLM can call (OpenAI function-calling format: name, description, typed JSON-schema parameters) and the dispatcher that executes them as real HTTP calls against the FastAPI endpoints using `httpx`. |
| `logger.py` | `log_event()` — appends one row per loop event to `conversation_log.csv` (`actor, message, tool_call, timestamp`). Append-only: the header is written once on creation and the file is never truncated, so sessions accumulate. |

## How one turn works (`loop.py`)

```
run_agent_turn(user_message, history, max_iterations=8)
```

1. **Observe** — the user's message is appended to `history` and logged
   (`actor=user`).
2. **Think** — `history` + the tool schemas go to the LLM. The model chooses:
   call a tool, or answer.
3. **Stop condition** — if the reply has **no pending tool calls**, that's the
   final answer: log it (`actor=agent`) and return.
4. **Act** — each requested tool is executed via `tools.run_tool()`. API
   errors are *returned as strings*, not raised, so the model sees what went
   wrong and can recover on the next iteration.
5. **Update** — the assistant message (with its `tool_calls`) and one
   `role: "tool"` message per result (matched by `tool_call_id`) are appended
   to `history` and logged (`actor=tool`).
6. **Repeat** — back to Think with the updated history. `max_iterations=8`
   guards against runaway tool loops; hitting it returns a graceful
   "step limit" reply.

The function returns `(reply, history, tool_trace)` — `tool_trace` is what the
dashboard renders in its collapsible "Tool Trace" panel.

## The four tools (`tools.py`)

| Tool | Maps to | Notes |
|---|---|---|
| `get_inventory` | `GET /inventory` | No parameters |
| `add_product(name, quantity, unit)` | `POST /inventory` | New products only |
| `adjust_stock(product_id, delta)` | `PATCH /inventory/{id}` | +delta = received, −delta = sold/used |
| `get_low_stock(threshold?)` | `GET /inventory/alerts` | Threshold optional |

If the API isn't running, the dispatcher returns a clear "start uvicorn first"
message instead of crashing — the agent relays it conversationally.

## Configuration (env / `.env`)

| Variable | Default | Purpose |
|---|---|---|
| `API_KEY` | — (required) | DeepSeek API key |
| `BASE_URL` | `https://api.deepseek.com` | OpenAI-compatible endpoint |
| `MODEL` | `deepseek-chat` | Model name |
| `INVENTORY_API_URL` | `http://localhost:8000` | Where the tools call the API |
