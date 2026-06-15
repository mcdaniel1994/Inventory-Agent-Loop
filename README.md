# Brewed Awakening Inventory Platform

Live demo: https://inventory-agent-loop.vercel.app/

In the AI era, supply chain and operations managers benefit from AI agents embedded directly inside the systems they already use. Instead of checking spreadsheets, waiting on reports, or manually hunting for low-stock items, teams can work with an always-available assistant that understands the business context, reads live operational data, and takes approved action through real tools.

**Brewed Awakening Inventory Platform** is an AI-driven inventory system built around that goal. It pairs a polished operations dashboard with an inventory agent that can answer stock questions, surface low-inventory risks, and update product quantities through API-backed tool calls. The project is modeled for a two-location coffee supply business, but the architecture applies broadly to small-business operations, supply chain workflows, and internal AI automation.

The agent loop is hand-written in plain Python using **Observe -> Think -> Act -> Update -> Repeat**. No agent frameworks are used; the AI dependency is the `openai` client SDK pointed at DeepSeek's OpenAI-compatible API.

## Product Overview

Brewed Awakening gives an operations manager a single place to:

- Review current inventory and low-stock alerts.
- Search, add, adjust, and delete products.
- Ask an AI agent natural-language questions about stock.
- Let the agent execute inventory actions through controlled API tools.
- Review transparent tool traces after agent responses.
- Keep inventory data and conversation logs in simple shareable CSV files.

The dashboard is built as a professional portfolio extension, while the CLI agent and FastAPI backend remain fully functional on their own.

## Key Features

- **AI inventory agent**: shared by the CLI and dashboard chat route.
- **Real tool use**: the agent reads and writes inventory by calling FastAPI endpoints through `httpx`.
- **Transparent reasoning loop**: each turn follows a manual Observe -> Think -> Act -> Update loop.
- **Operations dashboard**: responsive React interface with stat cards, inventory table/cards, alert panel, and agent chat.
- **Mobile-ready chat**: bottom navigation and chat composer are designed for small screens and mobile keyboards.
- **CSV persistence**: inventory and logs live in `data/products.csv` and `data/conversation_log.csv`.
- **Assignment-safe architecture**: the frontend is optional; deleting `frontend/` does not break the required CLI/API project.

## Architecture

```txt
 Terminal (agent.py)──┐
                      ├──► agent_core/loop.py ──► DeepSeek LLM (openai SDK)
 Dashboard chat ──────┘          │    (manual Observe -> Think -> Act -> Update loop)
 (POST /agent/chat)              │ tool calls (httpx)
                                 ▼
 React dashboard ─────────► FastAPI (api/app.py) ──► data/products.csv
 (Vite, port 5173)          (port 8000)
                                 │
                                 ▼
                        data/conversation_log.csv (append-only)
```

- `agent_core/loop.py` is the single source of truth for the agent loop.
- `agent_core/tools.py` defines four LLM tools and dispatches them to API endpoints.
- `agent_core/logger.py` appends every loop event to `data/conversation_log.csv`.
- `api/storage.py` owns all reads and writes for `data/products.csv`.
- `frontend/` provides the optional React dashboard and mobile chat experience.

## Tech Stack

| Layer | Tools |
|---|---|
| Backend API | FastAPI, Pydantic, Uvicorn |
| Agent runtime | Python, `openai` SDK, DeepSeek-compatible endpoint, `httpx` |
| Persistence | CSV files under `data/` |
| Frontend | React, TypeScript, Vite, Tailwind CSS, lucide-react |
| Architecture style | Manual tool-calling agent loop, no agent frameworks |

## Project Structure

```txt
Inventory-Agent-Loop/
├── agent.py
├── api/
├── agent_core/
├── data/
│   ├── products.csv
│   └── conversation_log.csv
├── frontend/
├── README.md
├── SPEC.md
└── requirements.txt
```

Directory guides:

| Directory | Covers |
|---|---|
| [`api/README.md`](api/README.md) | Endpoints, validation, CSV persistence strategy |
| [`agent_core/README.md`](agent_core/README.md) | Agent loop, tools, logging, configuration |
| [`frontend/README.md`](frontend/README.md) | Dashboard build/run, proxy, responsive layout |
| [`frontend/src/README.md`](frontend/src/README.md) | Source files, design tokens, data flow |
| [`frontend/src/components/README.md`](frontend/src/components/README.md) | UI component responsibilities |

## Setup

```bash
# 1. Python environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 2. API key
cp .env.example .env
# edit .env and set API_KEY to your DeepSeek key
```

`.env.example` documents the required variables. By default, the agent uses DeepSeek's OpenAI-compatible endpoint.

## Run The API And CLI Agent

Terminal 1:

```bash
source .venv/bin/activate
uvicorn api.app:app --reload
```

Terminal 2:

```bash
source .venv/bin/activate
python agent.py
```

On first API startup, `data/products.csv` is created with seed inventory if it does not exist. Every agent loop event is appended to `data/conversation_log.csv` with `actor`, `message`, `tool_call`, and `timestamp`.

## Run The Dashboard

Terminal 3:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The API must be running on port `8000` for live inventory and chat features.

The dashboard includes:

- **Dashboard**: branded business overview with stock metrics and lowest-stock summary.
- **Inventory**: searchable product list with add, adjust, and delete workflows.
- **Alerts**: low-stock cards based on the configured threshold.
- **Agent Chat**: live chat powered by the same agent loop as the CLI, with tool traces visible after responses.

## Example Agent Session

```txt
You: What's running low?
  [tool] get_low_stock({})
Agent: Two items are below the threshold of 10: Vanilla Syrup (5 bottles)
       and Oat Milk (8 cartons).

You: Bring every low-stock item up to exactly 20 units.
  [tool] get_inventory({})
  [tool] get_low_stock({})
  [tool] adjust_stock({'product_id': 5, 'delta': 15})
  [tool] adjust_stock({'product_id': 2, 'delta': 12})
Agent: Done. Vanilla Syrup: 5 -> 20 (+15), Oat Milk: 8 -> 20 (+12).
```

The second request demonstrates multi-step tool use: the agent reads inventory, identifies low-stock items, performs multiple updates, and returns a concise operational summary.

## API Reference

Interactive docs: http://localhost:8000/docs

| Method | Path | Body / Params | Result |
|---|---|---|---|
| GET | `/inventory` | None | `200` all products |
| POST | `/inventory` | `{name, quantity, unit}` | `201` created, `409` duplicate name, `422` invalid body |
| PATCH | `/inventory/{id}` | `{delta}` | `200` updated, `404` unknown id, `400` would go negative |
| DELETE | `/inventory/{id}` | None | `200` deleted product, `404` unknown id |
| GET | `/inventory/alerts` | `?threshold=` | `200` `{threshold, products}` |
| POST | `/agent/chat` | `{message, history?}` | `200` `{reply, tool_trace, history}` |

```bash
curl localhost:8000/inventory

curl -X POST localhost:8000/inventory \
  -H 'Content-Type: application/json' \
  -d '{"name":"Decaf Beans (1kg)","quantity":15,"unit":"bag"}'

curl -X PATCH localhost:8000/inventory/2 \
  -H 'Content-Type: application/json' \
  -d '{"delta":12}'

curl -X DELETE localhost:8000/inventory/11

curl "localhost:8000/inventory/alerts?threshold=20"
```

## How The Agent Works

The loop lives in `agent_core/loop.py`:

1. **Observe**: append the user's message to in-memory history and log it.
2. **Think**: send history and tool schemas to the LLM.
3. **Act**: execute selected tools as real HTTP calls against FastAPI.
4. **Update**: inject tool results back into the conversation and log them.
5. **Repeat**: continue until the model returns a final answer with no pending tool calls.

`max_iterations=8` prevents runaway loops. API errors are returned to the model as text so the agent can recover conversationally.

## Data Files

| File | Purpose |
|---|---|
| `data/products.csv` | Inventory store, auto-seeded on first API startup if missing |
| `data/conversation_log.csv` | Append-only agent event log |

The storage layer is intentionally simple and transparent for a small-business inventory use case. Product updates read the CSV into memory, apply the change, and rewrite the file.

## About This Project

This portfolio project was built during the AI Engineering program at 4Geeks Academy.

[![4Geeks Academy](https://img.shields.io/badge/AI%20Engineering-4Geeks%20Academy-orange)](https://4geeksacademy.com/)

## About Me

**Cory McDaniel**  
AI Engineer — Dallas-Fort Worth, TX

Former controls engineer. Now building AI systems that help small businesses save time through automation.

- [LinkedIn](https://www.linkedin.com/in/corymcdanielai/)
- Email: corymcdaniel01@gmail.com
- Location: Dallas-Fort Worth, TX

## Availability

Open to AI engineering, automation, and applied AI roles: remote, contract, or sub-contract.

## Assignment Compliance

- FastAPI exposes `GET/POST /inventory`, `PATCH/DELETE /inventory/{id}`, and `GET /inventory/alerts` with proper status codes and descriptive errors.
- Products persist in `data/products.csv` across server restarts.
- Manual Observe -> Think -> Act -> Update -> Repeat loop is implemented in plain Python (`agent_core/loop.py`).
- No agent frameworks are used.
- Tools are defined with names, descriptions, and typed JSON-schema parameters (`agent_core/tools.py`).
- Tool results are injected back into conversation history before the next iteration.
- `data/conversation_log.csv` is append-only with `actor`, `message`, `tool_call`, and `timestamp`.
- CLI reads from the terminal and exits cleanly.
- Multi-step interactions are supported.
- `.env` is gitignored and `.env.example` documents the required `API_KEY`.
