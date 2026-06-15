// Note: Desktop-only espresso sidebar (hidden below lg; mobile uses
// BottomNav). Dashboard / Inventory / Alerts switch the main view; Agent
// Chat toggles the right-hand panel.

import {
  Bell,
  Bot,
  Boxes,
  Coffee,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react";
import type { View } from "../types";
import { BRAND } from "../brand";

interface SidebarProps {
  view: View;
  onNavigate: (view: View) => void;
  chatOpen: boolean;
  onToggleChat: () => void;
}

const navItems: { label: string; icon: typeof Boxes; view: View }[] = [
  { label: "Dashboard", icon: LayoutDashboard, view: "dashboard" },
  { label: "Inventory", icon: Boxes, view: "inventory" },
  { label: "Alerts", icon: Bell, view: "alerts" },
];

export default function Sidebar({
  view,
  onNavigate,
  chatOpen,
  onToggleChat,
}: SidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-espresso text-cream shadow-xl shadow-coffee/10 lg:flex">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-caramel text-white shadow-sm shadow-black/15">
          <Coffee className="h-5 w-5" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm leading-tight font-semibold">{BRAND.name}</p>
          <p className="text-xs text-caramel">{BRAND.shortDescriptor}</p>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active = view === item.view;
          return (
            <button
              type="button"
              key={item.label}
              onClick={() => onNavigate(item.view)}
              className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition focus-visible:ring-2 focus-visible:ring-caramel/45 focus-visible:outline-none ${
                active
                  ? "bg-roast font-semibold text-white shadow-sm shadow-black/10"
                  : "text-oat hover:bg-roast/50 hover:text-cream"
              }`}
            >
              <item.icon className="h-4.5 w-4.5" strokeWidth={1.8} />
              {item.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onToggleChat}
          aria-pressed={chatOpen}
          className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition focus-visible:ring-2 focus-visible:ring-caramel/45 focus-visible:outline-none ${
            chatOpen
              ? "bg-roast font-semibold text-white shadow-sm shadow-black/10"
              : "text-oat hover:bg-roast/50 hover:text-cream"
          }`}
        >
          <MessageSquare className="h-4.5 w-4.5" strokeWidth={1.8} />
          Agent Chat
        </button>
      </nav>

      {/* Note: nod to the architecture — the dashboard chat and the CLI run
          the same hand-written agent loop. */}
      <div className="m-3 rounded-lg border border-caramel/15 bg-roast/60 px-4 py-3">
        <p className="flex items-center gap-2 text-xs font-semibold text-cream">
          <Bot className="h-3.5 w-3.5 text-caramel" strokeWidth={1.8} />
          {BRAND.agentLabel}
        </p>
        <p className="mt-0.5 text-[11px] text-caramel">Shared with CLI</p>
      </div>
    </aside>
  );
}
