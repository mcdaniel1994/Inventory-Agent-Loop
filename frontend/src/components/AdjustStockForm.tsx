// Note: Form for PATCH /inventory/{id}. The incoming/outgoing toggle maps to
// the sign of `delta` (positive = received stock, negative = sold/used).

import { useState, type FormEvent } from "react";
import { ArrowDownToLine, ArrowUpDown, ArrowUpFromLine } from "lucide-react";
import { adjustStock } from "../api/client";
import type { Product } from "../types";

interface AdjustStockFormProps {
  products: Product[];
  onChanged: () => void;
}

const inputClass =
  "h-11 rounded-lg border border-oat bg-cream px-3 text-base text-coffee outline-none placeholder:text-mocha/70 focus-visible:border-caramel focus-visible:ring-2 focus-visible:ring-caramel/25 sm:text-sm";
const labelClass = "text-xs font-semibold text-mocha";

export default function AdjustStockForm({
  products,
  onChanged,
}: AdjustStockFormProps) {
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const delta = direction === "in" ? Number(amount) : -Number(amount);
      await adjustStock(Number(productId), delta);
      setAmount("");
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-oat bg-foam p-4 shadow-sm shadow-coffee/5 sm:p-5"
    >
      <h3 className="text-sm font-bold text-coffee">Adjust Stock</h3>
      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="adjust-product" className={labelClass}>
            Product
          </label>
          <select
            id="adjust-product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className={`${inputClass} w-full`}
          >
            <option value="" disabled>
              Select product...
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.quantity} {p.unit})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
          <div className="space-y-1.5">
            <p className={labelClass}>Movement</p>
            <div
              role="group"
              aria-label="Stock movement direction"
              className="flex h-12 overflow-hidden rounded-lg border border-oat bg-cream"
            >
              <button
                type="button"
                onClick={() => setDirection("in")}
                aria-pressed={direction === "in"}
                className={`flex w-1/2 items-center justify-center gap-1.5 text-xs font-semibold transition focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-caramel/35 focus-visible:outline-none ${
                  direction === "in"
                    ? "bg-sage text-white"
                    : "text-mocha hover:bg-foam"
                }`}
              >
                <ArrowDownToLine className="h-3.5 w-3.5" strokeWidth={1.9} />
                In
              </button>
              <button
                type="button"
                onClick={() => setDirection("out")}
                aria-pressed={direction === "out"}
                className={`flex w-1/2 items-center justify-center gap-1.5 border-l border-oat text-xs font-semibold transition focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-caramel/35 focus-visible:outline-none ${
                  direction === "out"
                    ? "bg-amber-roast text-white"
                    : "text-mocha hover:bg-foam"
                }`}
              >
                <ArrowUpFromLine className="h-3.5 w-3.5" strokeWidth={1.9} />
                Out
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="adjust-amount" className={labelClass}>
              Amount
            </label>
            <input
              id="adjust-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              type="number"
              min={1}
              required
              className={`${inputClass} w-full`}
            />
          </div>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-xs leading-5 text-brick">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-coffee px-4 text-sm font-semibold text-cream transition hover:bg-roast focus-visible:ring-2 focus-visible:ring-caramel/35 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55"
      >
        <ArrowUpDown className="h-4 w-4" strokeWidth={1.9} />
        {busy ? "Saving…" : "Apply Adjustment"}
      </button>
    </form>
  );
}
