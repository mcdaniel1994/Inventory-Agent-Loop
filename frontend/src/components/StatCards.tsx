// Note: Summary metric cards: total products, low-stock count, total units,
// and the active alert threshold.

import { AlertTriangle, Bell, Boxes, Package } from "lucide-react";
import type { Product } from "../types";

interface StatCardsProps {
  products: Product[];
  lowStockCount: number;
  threshold: number;
}

export default function StatCards({
  products,
  lowStockCount,
  threshold,
}: StatCardsProps) {
  const totalUnits = products.reduce((sum, p) => sum + p.quantity, 0);

  const cards = [
    {
      label: "Total Products",
      value: String(products.length),
      sub: "Active SKUs",
      icon: Package,
      tone: "text-caramel",
    },
    {
      label: "Low Stock Items",
      value: String(lowStockCount),
      sub: lowStockCount > 0 ? "Need attention" : "All healthy",
      icon: AlertTriangle,
      tone: lowStockCount > 0 ? "text-amber-roast" : "text-sage",
    },
    {
      label: "Total Units",
      value: totalUnits.toLocaleString(),
      sub: "Across all locations",
      icon: Boxes,
      tone: "text-caramel",
    },
    {
      label: "Alert Threshold",
      value: String(threshold),
      sub: "Units before alert",
      icon: Bell,
      tone: "text-amber-roast",
    },
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-3 md:gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-oat bg-foam p-4 shadow-sm shadow-coffee/5 md:p-5"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-oat bg-cream md:h-10 md:w-10">
              <card.icon className={`h-5 w-5 ${card.tone}`} strokeWidth={1.75} />
            </div>
            <p className="text-sm leading-snug font-medium text-mocha">
              {card.label}
            </p>
          </div>
          <p className="mt-3 text-2xl font-bold text-coffee md:text-3xl">
            {card.value}
          </p>
          <p className="mt-1 text-xs text-mocha">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
