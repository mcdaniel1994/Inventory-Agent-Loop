// Note: Typed wrappers around the FastAPI endpoints. All calls go through
// the Vite dev proxy (/api -> http://localhost:8000).

import type { AlertsResponse, ChatResponse, Product } from "../types";

const BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "/api";

// Note: FastAPI puts human-readable error messages in `detail` — surface
// that string so forms can show it directly.
async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      detail =
        typeof body.detail === "string"
          ? body.detail
          : JSON.stringify(body.detail);
    } catch {
      /* keep default message */
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export function getInventory(): Promise<Product[]> {
  return fetch(`${BASE}/inventory`).then((r) => handle<Product[]>(r));
}

export function getAlerts(): Promise<AlertsResponse> {
  return fetch(`${BASE}/inventory/alerts`).then((r) =>
    handle<AlertsResponse>(r),
  );
}

export function addProduct(
  name: string,
  quantity: number,
  unit: string,
): Promise<Product> {
  return fetch(`${BASE}/inventory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, quantity, unit }),
  }).then((r) => handle<Product>(r));
}

export function adjustStock(productId: number, delta: number): Promise<Product> {
  return fetch(`${BASE}/inventory/${productId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delta }),
  }).then((r) => handle<Product>(r));
}

export function deleteProduct(productId: number): Promise<Product> {
  return fetch(`${BASE}/inventory/${productId}`, {
    method: "DELETE",
  }).then((r) => handle<Product>(r));
}

export function sendChat(
  message: string,
  history: unknown[] | null,
): Promise<ChatResponse> {
  return fetch(`${BASE}/agent/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  }).then((r) => handle<ChatResponse>(r));
}
