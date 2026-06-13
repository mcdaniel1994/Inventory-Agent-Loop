# AI Basic Inventory Agent Loop ☕

Live demo: https://inventory-agent-loop.vercel.app/

An AI inventory assistant for **Brewed Awakening**, a coffee shop supply store with two locations. Instead of maintaining a shared spreadsheet, the owner (Carla) talks to an agent in plain English — *"Do we have enough oat milk to cover the week?"* — and the agent reads and updates real inventory through a REST API.

The agent loop (**Observe → Think → Act → Update → Repeat**) is hand-written in plain Python. **No agent frameworks** (no LangChain, LlamaIndex, AutoGen, CrewAI) — the only AI dependency is the `openai` client SDK, pointed at DeepSeek's OpenAI-compatible API.

> Bonus: a React + TypeScript dashboard with a live agent chat panel. It is strictly optional — the required CLI agent and FastAPI app work without it.

## Architecture

```
 Terminal (agent.py)──┐
                      ├──► agent_core/loop.py ──► DeepSeek LLM (openai SDK)
 Dashboard chat ──────┘          │    (manual Observe→Think→Act→Update loop)
 (POST /agent/chat)              │ tool calls (httpx)
                                 ▼
 React dashboard ─────────► FastAPI (api/app.py) ──► products.csv
 (Vite, port 5173)          (port 8000)
                                 │
                                 ▼
                        conversation_log.csv (append-only)
```

- `agent_core/loop.py` — the agent loop, shared by the CLI and the dashboard chat route.
- `agent_core/tools.py` — the five LLM tools (name + description + typed parameters), each mapped to one API endpoint.
- `agent_core/logger.py` — appends every loop event to `conversation_log.csv`.
- `api/app.py` — FastAPI app; `api/storage.py` persists products to `products.csv` (auto-seeded if missing).

### Directory guides

Each code directory has its own README explaining every file and how it works:

| Directory | Covers |
|---|---|
| [`api/README.md`](api/README.md) | Endpoints, validation, CSV persistence strategy |
| [`agent_core/README.md`](agent_core/README.md) | The loop step-by-step, the tool set, logging, configuration |
| [`frontend/README.md`](frontend/README.md) | Build/run, dev proxy, responsive layout model |
| [`frontend/src/README.md`](frontend/src/README.md) | Source files, design tokens, data flow |
| [`frontend/src/components/README.md`](frontend/src/components/README.md) | Every UI component |

## Setup

```bash
# 1. Python environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt   # fastapi uvicorn openai python-dotenv httpx

# 2. API key
cp .env.example .env
# edit .env and set API_KEY to your DeepSeek key (https://platform.deepseek.com)
```

## Run (assignment)

```bash
# Terminal 1 — the API (from the project root)
uvicorn api.app:app --reload

# Terminal 2 — the agent
python agent.py
```

`products.csv` is created with seed data on first start and persists across restarts. Every loop event is appended to `conversation_log.csv` (`actor, message, tool_call, timestamp`) — the file is never overwritten, so sessions accumulate.

### Example session

```
You: What's running low?
  [tool] get_low_stock({})
Agent: Two items are below the threshold of 10: Vanilla Syrup (5 bottles)
       and Oat Milk (8 cartons).

You: Bring every low-stock item up to exactly 20 units.
  [tool] get_inventory({})
  [tool] get_low_stock({})
  [tool] adjust_stock({'product_id': 5, 'delta': 15})
  [tool] adjust_stock({'product_id': 2, 'delta': 12})
Agent: Done! Vanilla Syrup: 5 → 20 (+15), Oat Milk: 8 → 20 (+12).
```

The second request is a **multi-step interaction**: the model chains reads and writes across several loop iterations before producing its final answer.

## API Reference

| Method | Path | Body / Params | Result |
|---|---|---|---|
| GET | `/inventory` | — | `200` all products |
| POST | `/inventory` | `{name, quantity, unit}` | `201` created · `409` duplicate name · `422` invalid |
| PATCH | `/inventory/{id}` | `{delta}` (+in / −out) | `200` updated · `404` unknown id · `400` would go negative |
| DELETE | `/inventory/{id}` | — | `200` deleted product · `404` unknown id |
| GET | `/inventory/alerts` | `?threshold=` (default 10, env `LOW_STOCK_THRESHOLD`) | `200` `{threshold, products}` |
| POST | `/agent/chat` *(bonus)* | `{message, history?}` | `200` `{reply, tool_trace, history}` |

```bash
curl localhost:8000/inventory
curl -X POST localhost:8000/inventory -H 'Content-Type: application/json' \
     -d '{"name":"Decaf Beans (1kg)","quantity":15,"unit":"bag"}'
curl -X PATCH localhost:8000/inventory/2 -H 'Content-Type: application/json' -d '{"delta":12}'
curl -X DELETE localhost:8000/inventory/11
curl "localhost:8000/inventory/alerts?threshold=20"
```

Interactive docs: http://localhost:8000/docs

## How the agent loop works

See `agent_core/loop.py` — each phase is labeled in the code:

1. **Observe** — the user's message is appended to the in-memory conversation history and logged.
2. **Think** — the history plus the tool schemas are sent to the LLM, which chooses a tool call or a final answer.
3. **Act** — the selected tool runs as a real HTTP call against the FastAPI endpoints; API errors are returned to the model as text so it can recover.
4. **Update** — the tool result is injected back into the history (`role: "tool"`) and logged.
5. **Repeat** — back to Think. The loop **stops when the model answers with no pending tool calls**; `max_iterations=8` guards against runaway loops.

## Bonus: Dashboard

A portfolio extension — the assignment is complete without it.

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173 (API must be running on :8000)
```

A coffee-roastery-styled operations dashboard (espresso sidebar, cream canvas, caramel actions) with view-based navigation: **Dashboard** (stat cards + lowest-stock-first summary), **Inventory** (full table with search + add/adjust forms), **Alerts** (low-stock cards), and an **Agent Chat** panel with a collapsible **tool trace** showing exactly which API tools the agent called. Fully responsive — on phones the nav becomes a bottom tab bar and chat is a full-screen tab. The chat route (`POST /agent/chat`) reuses the same `agent_core` loop as the CLI; the frontend echoes the conversation history back each turn so the API stays stateless.

## 📌 About This Project

A portfolio project built during the AI Engineering program at 4Geeks Academy.

[![4Geeks Academy](https://img.shields.io/badge/AI%20Engineering-4Geeks%20Academy-orange)](https://4geeksacademy.com/)

---

## 👋 About Me

**Cory McDaniel**  
AI Engineer — Dallas-Fort Worth, TX

Former controls engineer. Now building AI systems that help small businesses save time through automation.

- [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/corymcdanielai/)
- 📧 corymcdaniel01@gmail.com
- 📍 Dallas-Fort Worth, TX

---

## 🎯 Availability

Open to AI engineering, automation, and applied AI roles — remote, contract, or sub-contract.

## Assignment compliance

- ✅ FastAPI exposes `GET/POST /inventory`, `PATCH/DELETE /inventory/{id}`, `GET /inventory/alerts` with proper status codes and descriptive errors.
- ✅ Products persist in `products.csv` across server restarts (auto-created with seed data).
- ✅ Manual **Observe → Think → Act → Update → Repeat** loop in plain Python (`agent_core/loop.py`), no agent frameworks.
- ✅ Tools defined with names, descriptions, and typed JSON-schema parameters (`agent_core/tools.py`).
- ✅ Tool results are injected back into the conversation history before the next iteration.
- ✅ `conversation_log.csv` is append-only with `actor, message, tool_call, timestamp` (ISO 8601).
- ✅ In-memory conversation history per session; CLI reads from the terminal and exits cleanly.
- ✅ Handles multi-step interactions (read → multiple writes → summary in one request).
- ✅ `.env` is gitignored; `.env.example` documents the required `API_KEY`.
