// Note: App shell with view-based navigation. Desktop (lg+): espresso
// sidebar | header + main | docked chat panel. Mobile: header + main with a
// bottom tab bar, where Chat is its own full-screen tab. One ChatPanel
// instance serves both layouts so the conversation survives resizes.

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { GripVertical } from "lucide-react";
import { getAlerts, getInventory } from "./api/client";
import type { Product, View } from "./types";
import AddProductForm from "./components/AddProductForm";
import AdjustStockForm from "./components/AdjustStockForm";
import AlertsPanel from "./components/AlertsPanel";
import BottomNav from "./components/BottomNav";
import ChatPanel from "./components/ChatPanel";
import Header from "./components/Header";
import InventoryTable from "./components/InventoryTable";
import Sidebar from "./components/Sidebar";
import StatCards from "./components/StatCards";

// Note: desktop chat panel width limits for the drag-resizable divider.
const CHAT_MIN_W = 336;
const CHAT_MAX_W = 520;
const CHAT_DEFAULT_W = 384;
const CHAT_W_KEY = "chatWidth";
const DESKTOP_SIDEBAR_W = 240;
const RESIZE_HANDLE_W = 12;
const MAIN_MIN_W_WHEN_POSSIBLE = 600;

function currentChatMax(): number {
  if (typeof window === "undefined") return CHAT_MAX_W;
  const available =
    window.innerWidth -
    DESKTOP_SIDEBAR_W -
    RESIZE_HANDLE_W -
    MAIN_MIN_W_WHEN_POSSIBLE;
  return Math.max(CHAT_MIN_W, Math.min(CHAT_MAX_W, available));
}

function clampChatWidth(width: number): number {
  return Math.min(currentChatMax(), Math.max(CHAT_MIN_W, width));
}

function loadChatWidth(): number {
  const saved = Number(localStorage.getItem(CHAT_W_KEY));
  const width = Number.isFinite(saved) ? saved : CHAT_DEFAULT_W;
  const clamped = clampChatWidth(width);
  if (clamped !== width) {
    localStorage.setItem(CHAT_W_KEY, String(clamped));
  }
  return clamped;
}

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<Product[]>([]);
  const [threshold, setThreshold] = useState(10);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatWidth, setChatWidth] = useState(loadChatWidth);
  const [isResizingChat, setIsResizingChat] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Note: drag-to-resize for the desktop chat column. Width is clamped to
  // [320, 560] and persisted so it survives a refresh.
  const startChatResize = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = chatWidth;
      setIsResizingChat(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      let next = startWidth;
      const onMove = (ev: globalThis.PointerEvent) => {
        // Note: dragging left widens the chat (it sits on the right edge).
        next = clampChatWidth(startWidth + (startX - ev.clientX));
        setChatWidth(next);
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setIsResizingChat(false);
        localStorage.setItem(CHAT_W_KEY, String(next));
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [chatWidth],
  );

  useEffect(() => {
    const onResize = () => {
      setChatWidth((width) => {
        const clamped = clampChatWidth(width);
        if (clamped !== width) {
          localStorage.setItem(CHAT_W_KEY, String(clamped));
        }
        return clamped;
      });
    };

    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [inventory, alertData] = await Promise.all([
        getInventory(),
        getAlerts(),
      ]);
      setProducts(inventory);
      setAlerts(alertData.products);
      setThreshold(alertData.threshold);
      setLoadError("");
    } catch (err) {
      setLoadError(
        `Could not reach the inventory API: ${(err as Error).message}. ` +
          "Is uvicorn running on port 8000?",
      );
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-cream text-coffee">
      <Sidebar
        view={view}
        onNavigate={setView}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((v) => !v)}
      />

      {/* Note: hidden on mobile while the Chat tab is active — the chat
          panel takes over the whole screen there. */}
      <div
        className={`min-h-0 min-w-0 flex-1 flex-col ${
          view === "chat" ? "hidden lg:flex" : "flex"
        }`}
      >
        <Header
          view={view}
          chatOpen={chatOpen}
          onToggleChat={() => setChatOpen((v) => !v)}
        />

        <main className="flex-1 overflow-y-auto px-4 pt-5 pb-[calc(1.25rem+var(--mobile-bottom-nav-h))] sm:px-8 sm:pt-6 sm:pb-[calc(1.5rem+var(--mobile-bottom-nav-h))] lg:py-6 xl:px-10">
          <div
            className={`mx-auto w-full space-y-6 ${
              chatOpen
                ? "max-w-[980px] 2xl:max-w-[1080px]"
                : "max-w-[1280px] 2xl:max-w-[1440px]"
            }`}
          >
            {loadError && (
              <div className="rounded-lg border border-brick/30 bg-brick/10 px-5 py-4 text-sm leading-6 text-brick">
                {loadError}
              </div>
            )}

            {(view === "dashboard" || view === "chat") && (
              <>
                <StatCards
                  products={products}
                  lowStockCount={alerts.length}
                  threshold={threshold}
                />
                {alerts.length > 0 && (
                  <AlertsPanel alerts={alerts} threshold={threshold} />
                )}
                <InventoryTable
                  products={products}
                  threshold={threshold}
                  compact
                  onViewAll={() => setView("inventory")}
                />
              </>
            )}

            {/* Note: adaptive Inventory layout. With the chat panel docked,
                the table owns the center column and forms drop below it. */}
            {view === "inventory" &&
              (chatOpen ? (
                <>
                  <InventoryTable
                    products={products}
                    threshold={threshold}
                    onChanged={refresh}
                  />
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
                    <AddProductForm onChanged={refresh} />
                    <AdjustStockForm products={products} onChanged={refresh} />
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="min-w-0">
                    <InventoryTable
                      products={products}
                      threshold={threshold}
                      onChanged={refresh}
                    />
                  </div>
                  <div className="space-y-4">
                    <AddProductForm onChanged={refresh} />
                    <AdjustStockForm products={products} onChanged={refresh} />
                  </div>
                </div>
              ))}

            {view === "alerts" && (
              <AlertsPanel alerts={alerts} threshold={threshold} />
            )}
          </div>
        </main>
      </div>

      {/* Note: desktop-only drag handle between the main content and the
          chat panel. Subtle oat divider, caramel on hover/drag. */}
      {chatOpen && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize chat panel"
          title="Drag to resize chat"
          onPointerDown={startChatResize}
          className={`group hidden w-3 shrink-0 cursor-col-resize items-center justify-center border-x border-oat/70 transition-colors lg:flex ${
            isResizingChat ? "bg-caramel/15" : "bg-cream/80 hover:bg-caramel/10"
          }`}
        >
          <GripVertical
            className={`h-5 w-5 transition-colors ${
              isResizingChat ? "text-caramel-dark" : "text-mocha/55 group-hover:text-caramel-dark"
            }`}
            strokeWidth={1.75}
          />
        </div>
      )}

      {/* Note: one chat instance — full-screen tab on mobile (view ===
          "chat"), docked resizable right panel on desktop (chatOpen toggle).
          The width flows in as a CSS variable so it only applies at lg+. */}
      <ChatPanel
        onInventoryChanged={refresh}
        style={{ "--chat-w": `${chatWidth}px` } as CSSProperties}
        className={`${view === "chat" ? "flex w-full" : "hidden"} ${
          chatOpen ? "lg:flex" : "lg:hidden"
        }`}
      />

      <BottomNav view={view} onNavigate={setView} />
    </div>
  );
}
