// Note: Chat composer with modern messaging ergonomics:
//   Enter        = send
//   Shift+Enter  = new line
// The textarea auto-grows from one line up to ~6 lines (then scrolls
// internally), and clears back to one line after sending.

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface ChatComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

// Note: ~6 lines of text with the padding below.
const MAX_HEIGHT_PX = 144;

export default function ChatComposer({ disabled, onSend }: ChatComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    // Note: reset first so shrinking (deleting lines) works too.
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }

  function send() {
    const text = value.trim();
    if (!text || disabled) return;
    setValue("");
    const el = textareaRef.current;
    if (el) el.style.height = "auto";
    onSend(text);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-t border-oat/60 bg-foam p-3 sm:p-4"
    >
      <div className="flex min-w-0 items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            autoGrow();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask the agent..."
          aria-label="Chat message"
          className="min-h-12 max-h-36 min-w-0 flex-1 resize-none overflow-y-auto rounded-lg border border-oat bg-cream px-3 py-3 text-base leading-6 text-coffee outline-none placeholder:text-mocha/70 focus-visible:border-caramel focus-visible:ring-2 focus-visible:ring-caramel/25 sm:min-h-11 sm:py-2.5 sm:text-sm sm:leading-5"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send"
          className="flex h-12 w-12 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-caramel px-0 text-sm font-semibold text-white transition hover:bg-caramel-dark focus-visible:ring-2 focus-visible:ring-caramel/35 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55 sm:h-11 sm:w-auto sm:min-w-11 sm:px-4"
        >
          <Send className="h-4 w-4" strokeWidth={1.9} />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
      <p className="mt-1.5 hidden text-[11px] text-mocha/80 lg:block">
        Enter to send · Shift+Enter for a new line
      </p>
    </form>
  );
}
