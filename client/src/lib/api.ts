import type { Analytics, AssistantEvent, Category, CheckoutInput, GeneratedCopy, Order, Product, ProductPage, Quote, ReviewSummary, SearchResult, User } from "./types";

export interface Api {
  demo: boolean;
  categories(): Promise<Category[]>;
  products(params?: Record<string, string>): Promise<Product[]>;
  search(q: string): Promise<SearchResult>;
  product(slug: string): Promise<ProductPage>;
  reviewSummary(slug: string): Promise<ReviewSummary>;
  recommendations(seen: string[]): Promise<Product[]>;
  quote(items: CheckoutInput["items"], code?: string): Promise<Quote>;
  placeOrder(input: CheckoutInput): Promise<Order>;
  track(number: string, email: string): Promise<Order>;
  login(email: string, password: string): Promise<{ token: string; user: User }>;
  analytics(): Promise<Analytics>;
  generateDescription(input: { name: string; category: string; features: string[]; tone: string }): Promise<GeneratedCopy>;
  assistant(message: string, history: { role: string; content: string }[], lastShown: string[], onEvent: (e: AssistantEvent) => void): Promise<void>;
}

const BASE = import.meta.env.VITE_API_URL ?? "";
const TOKEN = "shopsense.token";
export const token = {
  get: () => { try { return localStorage.getItem(TOKEN); } catch { return null; } },
  set: (t: string | null) => { try { if (t) localStorage.setItem(TOKEN, t); else localStorage.removeItem(TOKEN); } catch { /* ignore */ } },
};

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  const t = token.get();
  if (t) headers.set("Authorization", `Bearer ${t}`);
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export const httpApi: Api = {
  demo: false,
  categories: () => req("/api/categories"),
  products: (params = {}) => req(`/api/products?${new URLSearchParams(params)}`),
  search: (q) => req(`/api/search?q=${encodeURIComponent(q)}`),
  product: (slug) => req(`/api/products/${slug}`),
  reviewSummary: (slug) => req(`/api/products/${slug}/review-summary`),
  recommendations: (seen) => req(`/api/recommendations?seen=${seen.join(",")}`),
  quote: (items, discountCode) => req("/api/orders/quote", { method: "POST", body: JSON.stringify({ items, discountCode: discountCode || undefined }) }),
  placeOrder: (input) => req("/api/orders", { method: "POST", body: JSON.stringify(input) }),
  track: (number, email) => req(`/api/orders/track?${new URLSearchParams({ number, email })}`),
  login: (email, password) => req("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  analytics: () => req("/api/admin/analytics"),
  generateDescription: (input) => req("/api/admin/ai/description", { method: "POST", body: JSON.stringify(input) }),
  async assistant(message, history, lastShown, onEvent) {
    const res = await fetch(`${BASE}/api/assistant/stream`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, history, lastShown }) });
    if (!res.ok || !res.body) throw new Error("Assistant unavailable");
    const reader = res.body.getReader(), decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";
      for (const b of blocks) {
        const type = b.match(/^event: (.+)$/m)?.[1], data = b.match(/^data: (.*)$/m)?.[1];
        if (type && data) onEvent({ ...JSON.parse(data), type } as AssistantEvent);
      }
    }
  },
};
