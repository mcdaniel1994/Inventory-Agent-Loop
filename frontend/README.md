# `frontend/` — Brewed Awakening Dashboard

A React + TypeScript + Vite + Tailwind CSS dashboard for the inventory system,
styled with a coffee-roastery identity (espresso sidebar, cream canvas,
milk-foam cards, caramel actions). **Strictly optional**: the required CLI
agent and FastAPI app work without it — deleting this folder breaks nothing.

```bash
npm install
npm run dev      # http://localhost:5173 — the API must be running on :8000
npm run build    # type-check + production build to dist/
```

## Files

| File | What it does |
|---|---|
| `index.html` | Vite entry page; mounts the React app at `#root`. |
| `vite.config.ts` | React + Tailwind plugins, and the dev proxy that forwards `/api/*` to `http://localhost:8000` — so the frontend needs no hardcoded backend URL and no CORS in dev. |
| `tsconfig.json` | Strict TypeScript config for the `src/` tree. |
| `package.json` | Dependencies: `react`, `react-dom`, `lucide-react` (icons); dev: `vite`, `typescript`, `tailwindcss`. |
| `public/product-images/` | Real product photo thumbnails (free-license Wikimedia Commons photos, cropped square — sources in `CREDITS.md` there). Mapped to products by `src/productVisual.tsx`. |
| `src/` | All application code — see `src/README.md`. |

## How it connects to the backend

Every request goes through the Vite proxy: the client calls `/api/inventory`,
Vite forwards it to `http://localhost:8000/inventory`. The agent chat panel
posts to `/api/agent/chat`, which runs the **same hand-written agent loop**
(`agent_core/loop.py`) as the required CLI — the frontend holds the
conversation `history` in component state and echoes it back each turn, so the
backend stays stateless.

## Layout model

- **Desktop (lg+)**: espresso sidebar (view navigation) | header + main
  content | docked right-hand Agent Chat panel (toggleable).
- **Mobile (<lg)**: slim branded header + main content with a fixed bottom tab
  bar (Dashboard / Inventory / Alerts / Chat); Chat is a full-screen tab sized
  above the bottom navigation. The inventory list renders as stacked cards
  instead of a table below `md`.
