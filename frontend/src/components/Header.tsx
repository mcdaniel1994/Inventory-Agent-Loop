// Note: Top header. Desktop: view title + AI pill + chat toggle + avatar.
// Mobile: brand block replaces the avatar/toggle (nav lives in BottomNav).

import {
  Coffee,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { View } from "../types";

interface HeaderProps {
  view: View;
  chatOpen: boolean;
  onToggleChat: () => void;
}

const titles: Record<View, string> = {
  dashboard: "Dashboard",
  inventory: "Inventory",
  alerts: "Alerts",
  chat: "Agent Chat",
};

export default function Header({ view, chatOpen, onToggleChat }: HeaderProps) {
  const PanelIcon = chatOpen ? PanelRightClose : PanelRightOpen;

  return (
    <header className="flex items-center justify-between gap-3 border-b border-oat bg-foam px-4 py-3 sm:px-8 sm:py-4">
      <div className="flex min-w-0 items-center gap-3">
        {/* Note: mobile brand mark — sidebar is hidden below lg */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-caramel text-white shadow-sm shadow-caramel/20 lg:hidden">
          <Coffee className="h-4.5 w-4.5" strokeWidth={2} />
        </div>
        <h1 className="truncate text-lg font-bold text-coffee sm:text-xl">
          {titles[view]}
        </h1>
        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-caramel/15 px-3 py-1 text-xs font-semibold text-caramel-dark sm:flex">
          <Sparkles className="h-3 w-3" />
          AI Powered
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <div className="hidden items-center gap-2 text-sm text-mocha lg:flex">
          <PanelIcon className="h-4 w-4 text-caramel-dark" strokeWidth={1.8} />
          <span>Chat Panel</span>
          <button
            type="button"
            onClick={onToggleChat}
            aria-pressed={chatOpen}
            className={`relative h-6 w-11 rounded-full border transition focus-visible:ring-2 focus-visible:ring-caramel/35 focus-visible:outline-none ${
              chatOpen ? "border-caramel bg-caramel" : "border-oat bg-oat"
            }`}
            aria-label="Toggle chat panel"
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                chatOpen ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-roast text-cream shadow-sm shadow-black/10">
            <UserRound className="h-4.5 w-4.5" strokeWidth={1.8} />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-coffee">Carla</p>
            <p className="text-xs text-mocha">Operations Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
}
