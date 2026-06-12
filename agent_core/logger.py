# Note: Append-only conversation logger. Every event in the agent loop
# (user input, agent decisions, tool results, final replies) becomes one row
# in conversation_log.csv. The file is opened in append mode and is never
# truncated, so each session adds to the history of all previous sessions.

import csv
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
LOG_FILE = PROJECT_ROOT / "conversation_log.csv"
HEADER = ["actor", "message", "tool_call", "timestamp"]


def log_event(actor: str, message: str, tool_call: str = "") -> None:
    """Append one event row. actor is 'user', 'agent', or 'tool'."""
    # Note: Write the header only when the file is first created.
    write_header = not LOG_FILE.exists()
    with open(LOG_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if write_header:
            writer.writerow(HEADER)
        timestamp = datetime.now(timezone.utc).isoformat()
        writer.writerow([actor, message, tool_call, timestamp])
