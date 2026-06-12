// Note: Maps products to real photo thumbnails (local assets in
// public/product-images/, sourced from free-license Wikimedia Commons photos
// — see CREDITS.md there). Photos are used ONLY for inventory items; UI
// chrome (nav, buttons, stat cards, …) keeps lucide icons.

import { useState, type SyntheticEvent } from "react";
import type { Product } from "./types";

const IMAGE_DIR = "/product-images";
const IMAGE_EXT = "jpg";
const DEFAULT_IMAGE = `${IMAGE_DIR}/default-product.${IMAGE_EXT}`;

// Note: first match wins; "lid" must be tested before "cup" so
// "Cup Lids 12oz" gets the lid photo, not the cups photo.
const NAME_RULES: [RegExp, string][] = [
  [/milk/i, "oat-milk"],
  [/bean|coffee|espresso|decaf|roast/i, "coffee-beans"],
  [/lid/i, "cup-lids"],
  [/cup/i, "paper-cups"],
  [/syrup/i, "syrup"],
  [/powder|chocolate|cocoa/i, "chocolate-powder"],
  [/clean|tablet/i, "cleaning-tablets"],
];

// Note: unit is only a weak hint, used when the name matches nothing.
const UNIT_RULES: [RegExp, string][] = [
  [/carton/i, "oat-milk"],
  [/bottle/i, "syrup"],
  [/bag/i, "coffee-beans"],
];

export function productImage(product: Product): string {
  for (const [pattern, slug] of NAME_RULES) {
    if (pattern.test(product.name)) return `${IMAGE_DIR}/${slug}.${IMAGE_EXT}`;
  }
  for (const [pattern, slug] of UNIT_RULES) {
    if (pattern.test(product.unit)) return `${IMAGE_DIR}/${slug}.${IMAGE_EXT}`;
  }
  return DEFAULT_IMAGE;
}

// Note: The rounded photo tile used in inventory rows, mobile cards, and
// alert cards. If the mapped image fails to load it falls back to the
// default photo exactly once; if even that fails, the image hides and the
// foam/oat tile remains — so a broken-image glyph can never appear.
type ProductThumbSize = "sm" | "md";

interface ProductThumbProps {
  product: Product;
  size?: ProductThumbSize;
  className?: string;
}

export function ProductThumb({
  product,
  size = "sm",
  className = "",
}: ProductThumbProps) {
  const [failed, setFailed] = useState(false);
  const sizeClass = size === "md" ? "h-11 w-11" : "h-10 w-10";

  function handleError(e: SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (img.src.endsWith(DEFAULT_IMAGE)) {
      setFailed(true); // default itself is missing — give up quietly
    } else {
      img.src = DEFAULT_IMAGE;
    }
  }

  return (
    <div
      className={`${sizeClass} ${className} shrink-0 overflow-hidden rounded-lg border border-oat bg-foam shadow-sm`}
    >
      {!failed && (
        <img
          src={productImage(product)}
          alt={product.name}
          loading="lazy"
          onError={handleError}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
