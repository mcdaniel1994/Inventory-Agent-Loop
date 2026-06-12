// Note: Mobile-only bottom tab bar (hidden on lg+ where the sidebar takes
// over). Chat is a full-screen view on mobile, so it gets its own tab.

import { Bell, Boxes, LayoutDashboard, MessageSquare } from "lucide-react";
import type { View } from "../types";

interface BottomNavProps {
  view: View;
  onNavigate: (view: View) => void;
}

const tabs: { label: string; icon: typeof Boxes; view: View }[] = [
  { label: "Dashboard", icon: LayoutDashboard, view: "dashboard" },
  { label: "Inventory", icon: Boxes, view: "inventory" },
  { label: "Alerts", icon: Bell, view: "alerts" },
  { label: "Chat", icon: MessageSquare, view: "chat" },
];

export default function BottomNav({ view, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-oat bg-foam pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="grid grid-cols-4 px-1 py-1">
        {tabs.map((tab) => {
          const active = view === tab.view;
          return (
            <button
              type="button"
              key={tab.label}
              onClick={() => onNavigate(tab.view)}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-medium transition focus-visible:ring-2 focus-visible:ring-caramel/35 focus-visible:outline-none ${
                active
                  ? "bg-caramel/10 text-caramel-dark"
                  : "text-mocha hover:bg-cream"
              }`}
            >
              <tab.icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
