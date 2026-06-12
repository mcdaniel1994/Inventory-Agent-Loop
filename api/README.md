# `api/` — FastAPI Backend

The REST API for the inventory system. It owns all persistence: products live
in `products.csv` at the project root and survive server restarts.

Run it **from the project root** (so the CSV files resolve correctly):

```bash
uvicorn api.app:app --reload
```

## Files

| File | What it does |
|---|---|
| `app.py` | The FastAPI application. Declares every route, CORS for the dev frontend (port 5173), and the startup hook that seeds `products.csv` if it is missing. |
| `models.py` | Pydantic models that validate request bodies *before* route code runs. Bad input (missing fields, negative quantity, zero delta, blank names) is rejected with a 422 and a descriptive message. |
| `storage.py` | The only module that reads/writes `products.csv`. Loads rows into plain dicts (converting numeric columns back to ints), rewrites the whole file on change, auto-creates it with coffee-shop seed data, and hands out auto-incremented ids. |

## Endpoints

| Method | Path | Purpose | Errors |
|---|---|---|---|
| GET | `/inventory` | Full product list | — |
| POST | `/inventory` | Add a product (`name`, `quantity`, `unit`) | 409 duplicate name, 422 invalid body |
| PATCH | `/inventory/{id}` | Adjust stock by `delta` (+incoming / −outgoing) | 404 unknown id, 400 would go below zero |
| GET | `/inventory/alerts` | Products below the threshold (`?threshold=`, default 10, env `LOW_STOCK_THRESHOLD`) | 422 bad param |
| POST | `/agent/chat` | *Bonus*: run one agent turn over HTTP for the dashboard | 502 LLM/upstream failure |

## How it works

1. On startup, `storage.ensure_products_file()` creates `products.csv` with
   seed rows if it doesn't exist — first run "just works".
2. Each route loads all products into memory, applies the change, and rewrites
   the file. At a small store's scale that read-modify-rewrite strategy is a
   deliberate simplification.
3. Every error path raises `HTTPException` with a human-readable `detail`
   string. The agent feeds those strings back to the LLM so it can recover
   (e.g. "that name already exists → adjust stock instead").
4. `/agent/chat` imports the agent loop lazily from `agent_core/` and is
   stateless: the caller sends the conversation `history` back each turn.
   Deleting this route (and the frontend) leaves the assignment fully intact.
