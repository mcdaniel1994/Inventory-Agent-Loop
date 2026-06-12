// Note: Low-stock alert cards in amber-roast tones (warning, not error).

import { AlertTriangle, CircleCheck } from "lucide-react";
import type { Product } from "../types";
import { ProductThumb } from "../productVisual";

interface AlertsPanelProps {
  alerts: Product[];
  threshold: number;
}

export default function AlertsPanel({ alerts, threshold }: AlertsPanelProps) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-coffee">
        <AlertTriangle className="h-4.5 w-4.5 text-amber-roast" strokeWidth={1.8} />
        <span>Low Stock Alerts</span>
        <span className="text-sm font-normal text-mocha">
          (below {threshold} units)
        </span>
      </h2>
      {alerts.length === 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-sage/30 bg-sage/10 px-5 py-4 text-sm leading-6 text-sage">
          <CircleCheck className="mt-0.5 h-4.5 w-4.5 shrink-0" strokeWidth={1.8} />
          <span>All products are above the threshold. Nothing needs restocking.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(230px,1fr))]">
          {alerts.map((p) => (
            <div
              key={p.id}
              className="flex min-h-18 items-center justify-between gap-3 rounded-lg border border-amber-roast/30 bg-amber-roast/10 px-4 py-3.5 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ProductThumb product={p} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-coffee">
                    {p.name}
                  </p>
                  <p className="text-xs text-mocha">
                    {p.quantity} {p.unit}(s) left
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-amber-roast px-2.5 py-1 text-xs font-semibold text-white">
                Low
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
