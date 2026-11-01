import type { SearchFilters } from "../../../shared/search";
import type { Totals } from "../../../shared/pricing";

export interface Product {
  id: number; slug: string; name: string; category: string; categoryName: string; price: number; compareAt: number | null;
  stock: number; rating: number; reviewCount: number; tags: string[]; description: string; features: string[]; image: string;
}
export interface Category { slug: string; name: string; tagline: string }
export interface Review { id: number; author: string; rating: number; title: string; body: string; createdAt: string }
export interface ProductPage { product: Product; reviews: Review[]; similar: Product[]; boughtTogether: Product[] }
export interface ReviewSummary { summary: string; pros: string[]; cons: string[]; sentiment: string; engine: string }
export interface SearchResult { query: string; engine: string; interpretation: SearchFilters; results: Product[] }
export interface OrderItem { name: string; unitPrice: number; quantity: number }
export interface Order { number: string; email: string; name: string; status: string; paymentMethod: string; subtotal: number; discount: number; shipping: number; tax: number; total: number; createdAt: string; items: OrderItem[] }
export interface CheckoutInput { email: string; name: string; address: string; paymentMethod: "card" | "cod"; discountCode?: string; items: { slug: string; quantity: number }[] }
export interface Quote { totals: Totals; lines: { slug: string; name: string; price: number; quantity: number; stock: number }[] }
export interface User { id: number; email: string; name: string; role: "customer" | "admin" }
export interface Analytics {
  kpis: { revenue: number; orders: number; aov: number; growth: number; products: number };
  daily: { day: string; revenue: number; orders: number }[];
  top: { name: string; units: number; revenue: number }[];
  byCategory: { name: string; value: number }[];
  lowStock: { slug: string; name: string; stock: number }[];
  recent: Order[];
  insights: string[];
}
export interface GeneratedCopy { description: string; bullets: string[]; seoKeywords: string[]; engine: string }
export type AssistantEvent =
  | { type: "token"; text: string } | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; summary: string } | { type: "products"; products: Product[] }
  | { type: "cart_action"; slug: string; quantity: number } | { type: "error"; message: string } | { type: "done" };
