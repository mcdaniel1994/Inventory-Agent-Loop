# SPEC.md — AI Basic Inventory Agent Loop

An AI inventory assistant for a two-location coffee shop supply store. The owner (Carla) talks to an agent in natural language ("Do we have enough oat milk to cover the week?") instead of maintaining a spreadsheet. The system is an educational assignment (FastAPI + hand-coded agent loop, no frameworks) extended with a portfolio-grade React dashboard.

**Hard constraints (assignment):**
- REST API in FastAPI at `api/app.py`, persisting to `products.csv`.
- Agent in plain Python at `agent.py` implementing the loop **Observe → Think → Act → Update → Repeat** manually.
- **No agent frameworks** (no LangChain, LlamaIndex, AutoGen, CrewAI, etc.). The `openai` package is an LLM *client SDK*, not a framework — it is allowed and required.
- Append-only `conversation_log.csv` with `actor, message, tool_call, timestamp`.
- Launch: `uvicorn api.app:app --reload` (terminal 1) + `python agent.py` (terminal 2).

**Portfolio extension (must never compromise the above):** React + TypeScript + Vite + Tailwind dashboard, plus an optional `POST /agent/chat` route that reuses the same agent core as the CLI.

---

## 1. Project Folder Structure

```
Inventory-Agent-Loop/
├── SPEC.md
├── README.md
├── UI_Frontend.png           # frontend design mock (source of truth for the dashboard)
├── .env                      # API_KEY=... (gitignored)
├── .env.example              # API_KEY=your_key_here
├── .gitignore
├── requirements.txt          # fastapi, uvicorn, openai, python-dotenv, httpx
├── products.csv              # data store (auto-created/seeded if missing)
├── conversation_log.csv      # append-only log (auto-created if missing)
│
├── api/
│   ├── __init__.py
│   ├── app.py                # FastAPI app: all routes, CORS, /agent/chat
│   ├── models.py             # Pydantic request/response models
│   └── storage.py            # CSV read/write layer for products.csv
│
├── agent_core/
│   ├── __init__.py
│   ├── loop.py               # run_agent_turn(): the manual agent loop
│   ├── tools.py              # tool schemas + dispatcher (HTTP calls via httpx)
│   └── logger.py             # append-only conversation_log.csv writer
│
├── agent.py                  # REQUIRED CLI entrypoint (thin wrapper over agent_core)
│
└── frontend/                 # optional portfolio dashboard
    ├── index.html
    ├── package.json
    ├── vite.config.ts        # dev proxy /api -> http://localhost:8000
    ├── tailwind.config.js
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx           # layout: sidebar + header + main + right chat panel
        ├── api/client.ts     # typed fetch wrappers for all endpoints
        ├── types.ts          # Product, Alert, ChatMessage, ToolTraceEvent
        └── components/
            ├── Sidebar.tsx
            ├── Header.tsx
            ├── StatCards.tsx       # total products / low stock / total units
            ├── InventoryTable.tsx
            ├── AlertsPanel.tsx
            ├── AddProductForm.tsx
            ├── AdjustStockForm.tsx
            ├── ChatPanel.tsx       # talks to POST /agent/chat
            └── ToolTrace.tsx       # shows tool calls from the last agent turn
```

Notes:
- `agent_core/` keeps the loop importable by both `agent.py` and the API route — this is the single source of truth for the loop. `agent.py` stays a ~40-line readable CLI so graders see the required entrypoint immediately.
- `uvicorn api.app:app --reload` must be run from the project root so `products.csv` and `conversation_log.csv` resolve to the root. Both file paths are defined as absolute-from-project-root constants (derived from `Path(__file__).resolve().parents[1]`) so cwd never matters.

## 2. Data Models

### products.csv
```csv
id,name,quantity,unit
1,Espresso Beans (1kg),24,bag
2,Oat Milk (1L),8,carton
3,Paper Cups 12oz,300,unit
4,Cup Lids 12oz,180,unit
5,Vanilla Syrup,5,bottle
6,Cleaning Tablets,12,box
```
- `id`: int, auto-increment (`max(id) + 1`), never reused.
- `name`: non-empty string, unique case-insensitively.
- `quantity`: int ≥ 0.
- `unit`: non-empty string (bag, carton, bottle, unit, box…).
- If the file is missing on API startup, `storage.py` creates it **with the seed rows above** (low-stock items included on purpose so `/inventory/alerts` demos well).
- Write strategy: read all → modify in memory → rewrite whole file (atomic enough at this scale; documented as a known simplification).

### conversation_log.csv
```csv
actor,message,tool_call,timestamp
user,Do we have enough oat milk for the week?,,2026-06-12T14:01:03+00:00
agent,Checking current inventory…,get_inventory,2026-06-12T14:01:05+00:00
tool,"[{""id"":2,""name"":""Oat Milk (1L)"",""quantity"":8,…}]",get_inventory,2026-06-12T14:01:05+00:00
agent,"You have 8 cartons of oat milk — below the alert threshold of 10…",,2026-06-12T14:01:08+00:00
```
- `actor` ∈ {`user`, `agent`, `tool`}.
- `agent` rows: either the assistant's text, or a "decided to call X" row when the LLM picks a tool (with `tool_call` set).
- `tool` rows: JSON-serialized API result in `message`, tool name in `tool_call`.
- `timestamp`: ISO 8601 UTC.
- **Append-only**: open with mode `"a"`, `csv.writer` handles quoting/newlines. Header written only when the file is created. Never truncated.

## 3. API (api/app.py)

CORS middleware allows `http://localhost:5173` (Vite dev). Threshold configurable via `LOW_STOCK_THRESHOLD` env var, default **10**, and overridable per-request with `?threshold=`.

| Endpoint | Behavior | Success | Errors |
|---|---|---|---|
| `GET /inventory` | Full product list | `200` list of products | — |
| `POST /inventory` | Add product (`name`, `quantity`, `unit`) | `201` created product with `id` | `422` invalid body (Pydantic); `409` duplicate name |
| `PATCH /inventory/{product_id}` | Apply `delta` (+incoming / −outgoing) | `200` updated product | `404` unknown id; `400` if result would go below 0 (message states current qty) |
| `GET /inventory/alerts` | Products with `quantity < threshold` | `200` `{threshold, products: [...]}` | `422` bad threshold param |
| `POST /agent/chat` *(extension)* | `{message, history?}` → runs one agent turn via `agent_core.loop` | `200` `{reply, tool_trace: [{tool, arguments, result}], history}` | `502` LLM/upstream failure with descriptive message |

Pydantic models in `api/models.py`: `ProductCreate` (name: constrained non-empty str, quantity: int ≥ 0, unit: non-empty str), `StockAdjust` (delta: int ≠ 0), `Product`, `ChatRequest`, `ChatResponse`. All error responses use `HTTPException(status, detail="human-readable explanation")`.

`/agent/chat` is stateless per request: the frontend sends prior `history` back each time, so the API holds no session state and the CLI's in-memory history model is untouched.

## 4. Agent Design

### LLM configuration
- SDK: `openai`. Client: `OpenAI(api_key=os.environ["API_KEY"], base_url="https://api.deepseek.com")`.
- Model: `deepseek-chat` (supports OpenAI-style `tools` / `tool_calls`). Model and base URL read from env with these defaults (`MODEL`, `BASE_URL`) so it stays portable.
- `.env`: `API_KEY=your_key_here` (DeepSeek key). Loaded with `python-dotenv`.

### Tool definitions (agent_core/tools.py)
Four tools, mirroring the four endpoints, in OpenAI function-calling format — each with name, description, and typed JSON-schema parameters:

1. `get_inventory` — "List all products with id, name, quantity, and unit." No params.
2. `add_product(name: string, quantity: integer, unit: string)` — "Add a new product to inventory."
3. `adjust_stock(product_id: integer, delta: integer)` — "Adjust stock. Positive delta = stock received, negative = stock sold/used."
4. `get_low_stock(threshold?: integer)` — "List products below the low-stock threshold (default 10)."

A `TOOL_REGISTRY: dict[str, Callable]` maps names to small functions that call the API with **httpx** (`http://localhost:8000`, base URL via `INVENTORY_API_URL` env). On HTTP errors, return the API's error detail as the tool result string (the LLM sees it and can recover, e.g. "name already exists"). On connection failure, return a clear "API is not running — start uvicorn first" message.

### The loop (agent_core/loop.py) — Observe → Think → Act → Update → Repeat
```
run_agent_turn(user_message, history, max_iterations=8) -> (reply, history, tool_trace)

# OBSERVE: append {"role":"user", ...} to history; log actor=user
# loop up to max_iterations:
#   THINK: client.chat.completions.create(messages=history, tools=TOOL_SCHEMAS)
#   if no tool_calls:  -> final answer; log actor=agent; STOP
#   ACT: for each tool_call: log agent decision; dispatch via TOOL_REGISTRY
#   UPDATE: append assistant msg (with tool_calls) + one {"role":"tool"} message
#           per call (matching tool_call_id) to history; log actor=tool
#   REPEAT
# if max_iterations exhausted: return a graceful "I hit my step limit" reply (logged)
```
The phases are labeled with `# Note:` comments in code matching the assignment vocabulary. System prompt establishes the persona ("inventory assistant for Carla's coffee shop supply store, two locations"), instructs the model to check inventory before answering quantity questions, and to confirm what it changed after writes — this naturally produces the required multi-step interactions (e.g. "restock everything that's low" → `get_low_stock` → several `adjust_stock` calls → summary).

### CLI (agent.py)
- Loads `.env`, builds `history = [system_prompt]`, prints a short banner with example questions.
- REPL: `input("You: ")` → `run_agent_turn(...)` → print `Agent: <reply>` (and a dim one-line trace per tool call, e.g. `  ⚙ adjust_stock({"product_id": 2, "delta": 12})`).
- History lives in memory for the session (the assignment's "Update" persistence).
- Exit on `quit` / `exit` / Ctrl-D / Ctrl-C, all clean. Each turn ends naturally when the LLM returns no tool calls — that *is* the stop condition; `max_iterations=8` is the infinite-loop guard.

### Logging strategy (agent_core/logger.py)
- `log_event(actor, message, tool_call="")` appends one row with a UTC ISO-8601 timestamp; creates file + header if missing; never overwrites.
- Called at: user input, each agent tool decision, each tool result, each final agent reply, and the max-iteration bailout. Both the CLI and `/agent/chat` log through this same module.

## 5. Frontend (frontend/)

Stack: React 18 + TypeScript + Vite + Tailwind CSS. Dev proxy in `vite.config.ts`: `/api → http://localhost:8000` (client calls `/api/inventory` etc.).

**Visual reference: `UI_Frontend.png` in the project root.** The executing agent must open and reference this mock (read the image file) before building any frontend component; match its layout, structure, and feel — not pixel-for-pixel. From the mock:
- Dark-green **left sidebar**: brand block ("Brewed Awakening — Coffee Supply"), nav items Dashboard / Inventory / Alerts / Agent Chat / Conversation Logs / Settings, footer badge "Agent Core — Shared with CLI".
- **Header**: "Inventory Agent Dashboard" title with an "AI Powered" pill, a Chat Panel toggle, and a user avatar block.
- **Four stat cards**: Total Products, Low Stock Items, Total Units, Recent Updates — each with icon, big number, small trend/subtext.
- **Inventory Overview table**: search box + filter dropdowns; columns Product (with thumbnail/initial), Quantity, Unit, Status chip (green "In Stock" / red "Low Stock"), Last Updated. (The mock shows a Category column and forecasting hints — those are out of the CSV data-model scope; omit or stub them rather than expanding the data model.)
- **Low Stock Alerts** row of small product cards beneath the table.
- **Right-side Agent Chat panel**: chat bubbles, inline tool-result cards (e.g. "Checked Inventory"), and a **Tool Trace** section listing the tool calls from the last turn (rendered from `tool_trace` in the `/agent/chat` response).

Style per the mock: warm neutral background (Tailwind `stone-50/100`), deep-green sidebar with emerald accent (`emerald-600/700`), rounded-2xl white cards, generous spacing, professional SaaS feel — an operations dashboard, not a school project.

Features: inventory table (auto-refetch after mutations), AlertsPanel, AddProductForm, AdjustStockForm (+incoming/−outgoing), StatCards (total products, low-stock count, total units), ChatPanel (keeps `history` in component state, sends it with each request), ToolTrace. Form errors surface the API's `detail` string.

The frontend is **strictly optional**: nothing in `api/` or `agent.py` imports from or depends on `frontend/`; deleting the folder leaves the assignment fully functional. README presents it in a clearly separated "Bonus: Dashboard" section.

## 6. README.md Outline

1. Project title, one-paragraph pitch, screenshot/GIF placeholder.
2. Architecture diagram (ASCII): CLI ⇄ agent_core ⇄ DeepSeek; agent_core → FastAPI → products.csv; frontend → FastAPI.
3. Setup: `python -m venv .venv && source .venv/bin/activate`, `pip install -r requirements.txt` (mirroring `pip install fastapi uvicorn openai python-dotenv` + httpx), copy `.env.example` → `.env`, add DeepSeek key.
4. Run (assignment): Terminal 1 `uvicorn api.app:app --reload`; Terminal 2 `python agent.py`.
5. Example conversation transcript incl. a multi-step interaction.
6. API reference table + curl examples.
7. How the agent loop works (Observe→Think→Act→Update→Repeat, pointer to `agent_core/loop.py`).
8. Bonus dashboard: `cd frontend && npm install && npm run dev` → http://localhost:5173.
9. Design decisions & assignment compliance checklist (incl. "no agent frameworks — loop is hand-written in `agent_core/loop.py`").

`.gitignore`: `.env`, `.venv/`, `__pycache__/`, `frontend/node_modules/`, `frontend/dist/`, `.DS_Store`. (Note: `conversation_log.csv` is committed-or-not per preference, but `products.csv` ships with seeds.)

## 7. Implementation Phases & Acceptance Criteria

**Phase 1 — Scaffold & API.** Create structure, `.env.example`, `.gitignore`, `requirements.txt`; implement `storage.py`, `models.py`, `app.py` (4 required endpoints + CORS).
✅ Accept: server starts from project root; `products.csv` auto-seeds when missing; all endpoints behave per the table above (verified with curl); restart server → data persists; duplicate name → 409; over-draw stock → 400; unknown id → 404.

**Phase 2 — Agent core + CLI.** Implement `logger.py`, `tools.py`, `loop.py`, `agent.py`.
✅ Accept: with API running, `python agent.py` answers "what's in stock?" via `get_inventory`; "we received 12 oat milks" calls `adjust_stock` correctly; a multi-step prompt ("restock all low items to 20") chains tools across iterations; `conversation_log.csv` gains correctly-shaped rows and survives multiple sessions without truncation; loop exits cleanly on final answer; max-iterations guard works (testable by setting it to 1).

**Phase 3 — /agent/chat route.** Wire `agent_core` into FastAPI.
✅ Accept: `curl -X POST /agent/chat -d '{"message":"what is low on stock?"}'` returns `reply` + `tool_trace`; passing returned `history` back continues the conversation; CLI behavior unchanged.

**Phase 4 — Frontend.** First, **read `UI_Frontend.png` (project root)** and use it as the design reference. Then scaffold the Vite app and build components per §5.
✅ Accept: dashboard renders live data; add/adjust forms mutate and refresh; stat cards correct; chat panel holds a multi-turn conversation and shows tool traces; layout and styling visibly follow `UI_Frontend.png` per §5 (sidebar, stat cards, table with status chips, alerts row, right chat panel with tool trace); deleting `frontend/` breaks nothing in the assignment.

**Phase 5 — README + polish.** Write README per §6; add `# Note:` comments to all major code sections; final pass against the testing checklist.
✅ Accept: a fresh clone + README steps alone reproduce a working system; every assignment evaluation criterion is demonstrably satisfied.

## 8. Testing Checklist (manual, run before calling it done)

- [ ] `uvicorn api.app:app --reload` from root; delete `products.csv` first → recreated with seeds.
- [ ] curl all 4 endpoints: happy path + 404 (PATCH bad id) + 409 (duplicate POST) + 400 (delta below zero) + 422 (missing field).
- [ ] Restart uvicorn → `GET /inventory` shows prior mutations (persistence).
- [ ] `python agent.py`: single-tool question; write operation; **multi-step** request chaining ≥2 tools; question needing no tool (direct answer, loop exits in one iteration).
- [ ] Agent with API stopped → friendly error, no crash.
- [ ] Inspect `conversation_log.csv`: 4 columns, all actor types present, ISO timestamps; run a second session → rows appended, none lost.
- [ ] `POST /agent/chat` with and without `history`.
- [ ] Frontend: full CRUD flows, alert panel reflects threshold, chat + tool trace, error toasts on 409/400.
- [ ] Grep the repo: no `langchain`, `llama_index`, `autogen`, `crewai` anywhere.
- [ ] `git status` confirms `.env` untracked.

## 9. Framework & Scope Guardrails (for the executing coding agent)

- The loop in `agent_core/loop.py` must stay a plain, readable `while` loop a beginner can trace — no abstraction layers, decorators, or generic "agent" classes. The `openai` SDK is the only AI dependency.
- `agent.py` must remain a working standalone CLI satisfying every assignment requirement even if `frontend/` and `/agent/chat` were deleted.
- Keep `# Note:` comments at the top of each major section (storage, each endpoint group, each loop phase, tool dispatch, logging) explaining intent, not restating code.
- Prefer boring, explicit Python over cleverness; this is graded for clarity and shown to employers for judgment.
- **Frontend design source of truth is `UI_Frontend.png`** in the project root — read the image before frontend work and check finished UI against it. Do not invent a different layout.
