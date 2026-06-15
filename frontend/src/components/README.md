# `frontend/src/components/` — UI Components

All presentational/interactive pieces composed by `App.tsx`. Everything uses
the semantic color tokens from `src/index.css` (never raw hex) and lucide
icons.

## Navigation & chrome

| Component | What it does |
|---|---|
| `Sidebar.tsx` | Desktop-only (`hidden lg:flex`) espresso-dark sidebar: brand block, view navigation (Dashboard / Inventory / Alerts) with roast-brown active state, Agent Chat toggle, and the "Inventory Agent — shared with CLI" footer badge. |
| `BottomNav.tsx` | Mobile-only (`lg:hidden`) fixed bottom tab bar with four tabs — Dashboard, Inventory, Alerts, Chat. Active tab is caramel. Chat is a full-screen view sized above the bottom nav on mobile. |
| `Header.tsx` | Top bar: current view title/subtitle + "AI Powered" pill; on desktop also the chat-panel toggle switch and the user block; on mobile a compact brand mark replaces them. |

## Dashboard widgets

| Component | What it does |
|---|---|
| `StatCards.tsx` | Four summary cards computed from props: total products, low-stock count (amber when > 0), total units, and the active alert threshold. |
| `InventoryTable.tsx` | The product list. Renders a `<table>` from `md` up and stacked cards on phones. Has a search box, real product photo thumbnails (`ProductThumb`), and sage/amber status chips. `compact` mode shows the five lowest-stock products with a "View all →" link — used on the Dashboard view. |
| `AlertsPanel.tsx` | Low-stock alert cards in amber (warning, not error) with product photo thumbnails; shows a sage all-clear banner when nothing is below the threshold. |

## Forms (write operations)

| Component | What it does |
|---|---|
| `AddProductForm.tsx` | `POST /inventory` — name / quantity / unit. API errors (e.g. duplicate name → 409) are shown inline in brick red. Calls `onChanged()` to refresh the app after success. |
| `AdjustStockForm.tsx` | `PATCH /inventory/{id}` — product select + In/Out toggle + amount. The toggle maps to the sign of `delta` (+ incoming, − outgoing). Surfaces API errors (404/400) inline. |

## Agent chat

| Component | What it does |
|---|---|
| `ChatPanel.tsx` | The Agent Chat. One instance serves both layouts (docked right column on desktop, full-screen tab above the mobile bottom nav) so the conversation survives breakpoint changes. Keeps the OpenAI-style `history` in state and echoes it back on each `POST /agent/chat`; renders light `**bold**` markdown; triggers an app refresh when the agent used a write tool. |
| `ToolTrace.tsx` | Collapsible "Tool Trace (n)" panel under an agent reply listing each API tool call with its arguments — makes the agent loop transparent in the UI. |
