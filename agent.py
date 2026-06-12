# Note: REQUIRED CLI entrypoint for the inventory agent.
# The agent loop itself lives in agent_core/loop.py (shared with the optional
# dashboard); this file is the terminal interface around it.
#
# Start the API first:   uvicorn api.app:app --reload
# Then run the agent:    python agent.py

from dotenv import load_dotenv

from agent_core.loop import build_initial_history, run_agent_turn

load_dotenv()

BANNER = """
=========================================================
  Inventory Agent — Carla's Coffee Shop Supply Store
=========================================================
Ask me things like:
  - What do we have in stock?
  - Do we have enough oat milk to cover the week?
  - We received 12 cartons of oat milk.
  - Add a new product: Decaf Beans, 15 bags.
  - What's running low?
Type 'quit' or 'exit' to leave.
"""


def main() -> None:
    print(BANNER)

    # Note: Conversation history lives in memory for the whole session, so
    # the agent remembers earlier turns ("it", "that product", etc.).
    history = build_initial_history()

    while True:
        try:
            user_message = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            # Note: Ctrl-D / Ctrl-C exit cleanly.
            print("\nGoodbye!")
            break

        if not user_message:
            continue
        if user_message.lower() in {"quit", "exit"}:
            print("Goodbye!")
            break

        reply, history, tool_trace = run_agent_turn(user_message, history)

        # Note: Show which API tools the agent used this turn (transparency).
        for event in tool_trace:
            print(f"  [tool] {event['tool']}({event['arguments']})")

        print(f"Agent: {reply}\n")


if __name__ == "__main__":
    main()
