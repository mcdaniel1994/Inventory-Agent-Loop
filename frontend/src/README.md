# `frontend/src/` — Application Source

## Files

| File | What it does |
|---|---|
| `main.tsx` | React entry point: mounts `<App />` into `#root` and imports the global stylesheet. |
| `App.tsx` | The app shell and single source of state: current `view` (dashboard / inventory / alerts / chat), products, alerts, threshold, chat-panel toggle, and the `refresh()` function every mutation calls. Composes the responsive layout (sidebar on desktop, bottom tabs on mobile) and renders the content for the active view. |
| `index.css` | Tailwind import **plus the coffee-roastery design tokens** (`@theme`): `cream`, `foam`, `espresso`, `roast`, `caramel`, `coffee`, `mocha`, `oat`, `amber-roast`, `sage`, `brick`. Components only use these semantic names — retune the palette here and the whole app follows. |
| `types.ts` | Shared TypeScript types mirroring the FastAPI models (`Product`, `AlertsResponse`, `ChatResponse`, `ToolTraceEvent`, `ChatMessage`) plus the `View` union for navigation. |
| `productVisual.tsx` | `productImage()` + `ProductThumb` — keyword-matches a product's name/unit to a real photo thumbnail from `public/product-images/` (beans, milk carton, cups, lids, syrup, cocoa, tablets; unmatched → default). Falls back to the default photo once on load error, then hides the image so a broken-image glyph can never appear. Photos are for inventory items only — UI chrome keeps lucide icons. |
| `api/client.ts` | Typed fetch wrappers for every endpoint (`getInventory`, `getAlerts`, `addProduct`, `adjustStock`, `sendChat`). All calls go through the Vite `/api` proxy; FastAPI's human-readable `detail` error strings are thrown as `Error.message` so forms can show them directly. |
| `components/` | All UI components — see `components/README.md`. |

## Data flow

```
App.tsx ──refresh()──► api/client.ts ──/api proxy──► FastAPI ──► products.csv
   │                                                       ▲
   └── ChatPanel ──sendChat()──► POST /agent/chat ──► agent_core loop ──tools──┘
```

- `App` fetches products + alerts on mount and after every mutation.
- Forms call the API directly, then `onChanged()` → `refresh()`.
- The chat panel triggers `refresh()` too whenever the agent used a *write*
  tool, so agent-made changes appear in the tables immediately.
