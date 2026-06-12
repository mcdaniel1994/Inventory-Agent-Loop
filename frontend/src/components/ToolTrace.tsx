// Note: Collapsible list of the API tools the agent called during a turn —
// makes the agent loop transparent.

import { useState } from "react";
import { ChevronDown, ChevronRight, Wrench } from "lucide-react";
import type { ToolTraceEvent } from "../types";

export default function ToolTrace({ trace }: { trace: ToolTraceEvent[] }) {
  const [open, setOpen] = useState(false);
  if (trace.length === 0) return null;

  return (
    <div className="mt-2 max-w-[92%] rounded-lg border border-oat bg-cream/80 text-xs shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 font-semibold text-mocha transition hover:text-coffee focus-visible:ring-2 focus-visible:ring-caramel/30 focus-visible:outline-none"
      >
        <span className="flex items-center gap-1.5">
          <Wrench className="h-3.5 w-3.5 text-caramel-dark" strokeWidth={1.8} />
          Tool Trace ({trace.length})
        </span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
      {open && (
        <ul className="max-h-48 space-y-2 overflow-y-auto border-t border-oat px-3 py-2.5">
          {trace.map((event, i) => (
            <li key={i} className="min-w-0 rounded-md bg-foam px-2.5 py-2">
              <p className="font-mono text-[11px] font-semibold break-words text-caramel-dark">
                {event.tool}
              </p>
              <p className="mt-1 font-mono text-[11px] break-words text-mocha">
                args: {JSON.stringify(event.arguments)}
              </p>
              {event.result && (
                <p className="mt-1 font-mono text-[11px] break-words text-mocha">
                  result: {event.result}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
