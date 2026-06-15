// Note: Agent Chat panel. On desktop it docks as the right-hand column; on
// mobile it fills the screen as the "Chat" tab (App controls visibility via
// the className prop — one instance, so the conversation survives breakpoint
// changes). Talks to POST /agent/chat, which runs the same hand-written loop
// as the CLI. The OpenAI-style `history` is kept in component state and
// echoed back on every request, so the backend stays stateless.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Bot, CircleAlert, MessageSquareText } from "lucide-react";
import { sendChat } from "../api/client";
import type { ChatMessage } from "../types";
import ChatComposer from "./ChatComposer";
import ToolTrace from "./ToolTrace";

interface ChatPanelProps {
  onInventoryChanged: () => void;
  className?: string;
  // Note: App sets --chat-w here so the desktop width follows the drag-
  // resizable divider; on mobile the panel is w-full and the var is ignored.
  style?: CSSProperties;
}

// Note: The model often replies with light markdown. Rather than pull in a
// markdown library, render just **bold** spans and leave the rest as text.
function renderBold(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
  );
}

const SUGGESTED_PROMPTS = [
  "What needs restocking before the weekend?",
  "Show me the lowest stock items.",
  "We received 12 bags of espresso beans.",
];

function isErrorMessage(msg: ChatMessage) {
  return msg.role === "agent" && msg.text.startsWith("Agent error:");
}

export default function ChatPanel({
  onInventoryChanged,
  className = "",
  style,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<unknown[] | null>(null);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    if (busy) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const res = await sendChat(text, history);
      setHistory(res.history);
      setMessages((m) => [
        ...m,
        { role: "agent", text: res.reply, trace: res.tool_trace },
      ]);
      // Note: If the agent used a write tool, the tables/cards need a refresh.
      if (
        res.tool_trace.some(
          (t) => t.tool !== "get_inventory" && t.tool !== "get_low_stock",
        )
      ) {
        onInventoryChanged();
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "agent", text: `Agent error: ${(err as Error).message}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside
      style={style}
      className={`h-[calc(100dvh-var(--mobile-bottom-nav-h))] min-h-0 max-h-[calc(100dvh-var(--mobile-bottom-nav-h))] flex-col border-oat bg-foam lg:h-auto lg:max-h-none lg:w-[var(--chat-w,384px)] lg:shrink-0 lg:border-l lg:shadow-sm ${className}`}
    >
      <div className="shrink-0 border-b border-oat/60 px-4 py-3 sm:px-5 sm:py-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-coffee">
          <MessageSquareText className="h-4 w-4 text-caramel" strokeWidth={1.9} />
          Agent Chat
        </h2>
        <p className="mt-0.5 text-xs leading-5 text-mocha">
          Same agent loop as the CLI. Ask about stock in plain English.
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5">
        {messages.length === 0 && (
          <div className="rounded-lg border border-oat bg-cream/70 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-oat bg-foam text-caramel-dark">
                <Bot className="h-4.5 w-4.5" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-coffee">
                  Ask the inventory agent
                </p>
                <p className="mt-1 text-xs leading-5 text-mocha">
                  Start with a restock question, a stock update, or a quick
                  read on low inventory.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={busy}
                  onClick={() => send(prompt)}
                  className="rounded-lg border border-oat bg-foam px-3 py-2 text-left text-xs leading-5 font-medium text-coffee transition hover:border-caramel/50 hover:bg-caramel/10 focus-visible:ring-2 focus-visible:ring-caramel/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => {
          const error = isErrorMessage(msg);
          return (
            <div key={i}>
              <div
                className={`flex max-w-[92%] gap-2 rounded-lg px-4 py-3 text-sm leading-6 whitespace-pre-wrap shadow-sm ${
                  msg.role === "user"
                    ? "ml-auto bg-caramel text-white"
                    : error
                      ? "border border-brick/25 bg-brick/10 text-brick"
                      : "border border-oat bg-cream text-coffee"
                }`}
              >
                {error && (
                  <CircleAlert
                    className="mt-0.5 h-4 w-4 shrink-0"
                    strokeWidth={1.8}
                  />
                )}
                <div className="min-w-0">{renderBold(msg.text)}</div>
              </div>
              {msg.trace && <ToolTrace trace={msg.trace} />}
            </div>
          );
        })}
        {busy && (
          <div className="w-fit rounded-lg border border-oat bg-cream px-4 py-2.5 text-sm text-mocha shadow-sm">
            Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Note: the composer is a sibling of the scrolling message list, so
          it stays pinned at the bottom while messages scroll above it. */}
      <ChatComposer disabled={busy} onSend={send} />
    </aside>
  );
}
