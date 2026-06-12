// Note: Inventory list. Renders as a table from md up and as stacked cards
// below md (phones). `compact` mode shows the lowest-stock products with a
// "View all" link — used on the Dashboard view.

import { useState } from "react";
import { ArrowRight, Search, Trash2 } from "lucide-react";
import type { Product } from "../types";
import { deleteProduct } from "../api/client";
import { ProductThumb } from "../productVisual";

interface InventoryTableProps {
  products: Product[];
  threshold: number;
  compact?: boolean;
  onViewAll?: () => void;
  onChanged?: () => void;
}

function StatusChip({ low }: { low: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${
        low
          ? "bg-amber-roast/15 text-amber-roast ring-amber-roast/20"
          : "bg-sage/10 text-sage ring-sage/15"
      }`}
    >
      {low ? "Low Stock" : "In Stock"}
    </span>
  );
}

export default function InventoryTable({
  products,
  threshold,
  compact = false,
  onViewAll,
  onChanged,
}: InventoryTableProps) {
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  // Note: compact mode surfaces what matters on the dashboard — the five
  // products closest to running out.
  const visible = compact
    ? [...products].sort((a, b) => a.quantity - b.quantity).slice(0, 5)
    : products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      );

  const canDelete = !compact && Boolean(onChanged);

  async function handleDelete(product: Product) {
    if (deletingId !== null) return;
    const confirmed = window.confirm(
      `Delete ${product.name}? This removes the product from inventory.`,
    );
    if (!confirmed) return;

    setActionError("");
    setDeletingId(product.id);
    try {
      await deleteProduct(product.id);
      onChanged?.();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-oat bg-foam shadow-sm">
      <div className="flex flex-col gap-3 border-b border-oat/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h2 className="text-base font-bold text-coffee">
          {compact ? "Lowest Stock First" : "Inventory Overview"}
        </h2>
        {compact ? (
          <button
            type="button"
            onClick={onViewAll}
            className="flex min-h-11 w-fit items-center gap-1 rounded-md px-2 text-sm font-semibold text-caramel transition hover:text-caramel-dark focus-visible:ring-2 focus-visible:ring-caramel/35 focus-visible:outline-none"
          >
            View all <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mocha" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="h-11 w-full rounded-lg border border-oat bg-cream pr-3 pl-9 text-sm text-coffee outline-none placeholder:text-mocha/70 focus-visible:border-caramel focus-visible:ring-2 focus-visible:ring-caramel/25"
            />
          </div>
        )}
      </div>

      {actionError && (
        <p role="alert" className="border-b border-brick/20 bg-brick/10 px-4 py-3 text-sm text-brick sm:px-6">
          {actionError}
        </p>
      )}

      {/* Note: card list on phones */}
      <ul className="space-y-2 p-3 md:hidden">
        {visible.map((p) => {
          const low = p.quantity < threshold;
          return (
            <li
              key={p.id}
              className="flex min-h-16 items-center gap-3 rounded-lg border border-oat/70 bg-cream/60 p-3"
            >
              <ProductThumb product={p} size="md" />
              <div className="min-w-0 flex-1 pr-1">
                <p className="overflow-hidden text-sm leading-snug font-semibold text-coffee [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {p.name}
                </p>
                <p className="mt-0.5 text-xs text-mocha">
                  {p.quantity} {p.unit}(s)
                </p>
              </div>
              <StatusChip low={low} />
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(p)}
                  disabled={deletingId === p.id}
                  aria-label={`Delete ${p.name}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brick/25 bg-brick/5 text-brick transition hover:bg-brick/10 focus-visible:ring-2 focus-visible:ring-brick/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.9} />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Note: full table from md up */}
      <table className="hidden w-full table-fixed text-left text-sm md:table">
        <colgroup>
          {canDelete ? (
            <>
              <col className="w-[40%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[22%]" />
              <col className="w-[72px]" />
            </>
          ) : (
            <>
              <col className="w-[46%]" />
              <col className="w-[18%]" />
              <col className="w-[16%]" />
              <col className="w-[20%]" />
            </>
          )}
        </colgroup>
        <thead>
          <tr className="text-xs tracking-wide text-mocha uppercase">
            <th className="px-4 py-3 font-semibold sm:px-5">Product</th>
            <th className="px-3 py-3 font-semibold">Quantity</th>
            <th className="px-3 py-3 font-semibold">Unit</th>
            <th className="px-3 py-3 font-semibold">Status</th>
            {canDelete && (
              <th className="px-3 py-3 text-right font-semibold">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {visible.map((p) => {
            const low = p.quantity < threshold;
            return (
              <tr
                key={p.id}
                className="border-t border-oat/60 transition hover:bg-cream/50"
              >
                <td className="px-4 py-3.5 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <ProductThumb product={p} />
                    <span className="min-w-0 break-words font-medium text-coffee">
                      {p.name}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3.5 font-semibold break-words text-coffee">
                  {p.quantity}
                </td>
                <td className="px-3 py-3.5 break-words text-mocha">{p.unit}</td>
                <td className="px-3 py-3.5">
                  <StatusChip low={low} />
                </td>
                {canDelete && (
                  <td className="px-3 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      disabled={deletingId === p.id}
                      aria-label={`Delete ${p.name}`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-brick/25 bg-brick/5 text-brick transition hover:bg-brick/10 focus-visible:ring-2 focus-visible:ring-brick/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.9} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {visible.length === 0 && (
        <p className="px-6 py-8 text-center text-sm text-mocha">
          No products match “{search}”.
        </p>
      )}
    </section>
  );
}
