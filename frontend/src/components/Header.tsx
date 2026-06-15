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
import { BRAND } from "../brand";

interface HeaderProps {
  view: View;
  chatOpen: boolean;
  onToggleChat: () => void;
}

const titles: Record<View, string> = {
  dashboard: BRAND.name,
  inventory: "Inventory",
  alerts: "Alerts",
  chat: "Agent Chat",
};

const subtitles: Record<View, string> = {
  dashboard: BRAND.descriptor,
  inventory: "Stock levels, search, and adjustments",
  alerts: "Items that need purchasing attention",
  chat: "Ask the agent to read or update stock",
};

export default function Header({ view, chatOpen, onToggleChat }: HeaderProps) {
  const PanelIcon = chatOpen ? PanelRightClose : PanelRightOpen;

  return (
    <header className="shrink-0 border-b border-oat bg-foam px-4 py-3 shadow-sm shadow-coffee/5 sm:px-8 sm:py-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Note: mobile brand mark — sidebar is hidden below lg */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-caramel text-white shadow-sm shadow-caramel/20 lg:hidden">
            <Coffee className="h-4.5 w-4.5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg leading-tight font-bold text-coffee sm:text-xl">
              {titles[view]}
            </h1>
            <p className="truncate text-xs leading-5 text-mocha">
              {subtitles[view]}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span
            aria-label="AI Powered"
            title="AI Powered"
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-caramel/15 text-caramel-dark sm:flex 2xl:w-auto 2xl:px-3"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden pl-1 text-xs font-semibold 2xl:inline">
              AI Powered
            </span>
          </span>

          <div className="hidden items-center gap-2 text-sm text-mocha lg:flex">
            <PanelIcon className="h-4 w-4 text-caramel-dark" strokeWidth={1.8} />
            <span className="hidden whitespace-nowrap 2xl:inline">
              Chat Panel
            </span>
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
            <div className="hidden xl:block">
              <p className="text-sm leading-tight font-semibold text-coffee">
                Carla
              </p>
              <p className="max-w-28 truncate text-xs text-mocha 2xl:max-w-none">
                Operations Manager
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
