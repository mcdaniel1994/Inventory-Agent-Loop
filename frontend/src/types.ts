// Note: Shared types mirroring the FastAPI response models.

// Note: Top-level navigation. "chat" is a view only on mobile — on desktop
// the chat is a persistent right-hand panel.
export type View = "dashboard" | "inventory" | "alerts" | "chat";

export interface Product {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

export interface AlertsResponse {
  threshold: number;
  products: Product[];
}

export interface ToolTraceEvent {
  tool: string;
  arguments: Record<string, unknown>;
  result: string;
}

// Note: history is the raw OpenAI-style message list; the frontend just
// echoes it back to keep the API stateless.
export interface ChatResponse {
  reply: string;
  tool_trace: ToolTraceEvent[];
  history: unknown[];
}

export interface ChatMessage {
  role: "user" | "agent";
  text: string;
  trace?: ToolTraceEvent[];
}
