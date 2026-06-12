// Note: Form for POST /inventory. API error messages (e.g. duplicate name)
// are shown inline.

import { useState, type FormEvent } from "react";
import { PackagePlus } from "lucide-react";
import { addProduct } from "../api/client";

interface AddProductFormProps {
  onChanged: () => void;
}

const inputClass =
  "h-11 w-full rounded-lg border border-oat bg-cream px-3 text-sm text-coffee outline-none placeholder:text-mocha/70 focus-visible:border-caramel focus-visible:ring-2 focus-visible:ring-caramel/25";
const labelClass = "text-xs font-semibold text-mocha";

export default function AddProductForm({ onChanged }: AddProductFormProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await addProduct(name.trim(), Number(quantity), unit.trim());
      setName("");
      setQuantity("");
      setUnit("");
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
      className="rounded-lg border border-oat bg-foam p-4 shadow-sm sm:p-5"
    >
      <h3 className="text-sm font-bold text-coffee">Add Product</h3>
      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="add-product-name" className={labelClass}>
            Product name
          </label>
          <input
            id="add-product-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Espresso Beans (1kg)"
            required
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="add-product-quantity" className={labelClass}>
              Quantity
            </label>
            <input
              id="add-product-quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              type="number"
              min={0}
              required
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="add-product-unit" className={labelClass}>
              Unit
            </label>
            <input
              id="add-product-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="bag, box, carton"
              required
              className={inputClass}
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
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-caramel px-4 text-sm font-semibold text-white transition hover:bg-caramel-dark focus-visible:ring-2 focus-visible:ring-caramel/35 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55"
      >
        <PackagePlus className="h-4 w-4" strokeWidth={1.9} />
        {busy ? "Adding…" : "Add Product"}
      </button>
    </form>
  );
}
