// Rule-based shopping assistant. Used by the server when no LLM key is configured and by the browser demo.
import { parseQuery, rank, type Searchable } from "./search";

export interface AssistantProduct extends Searchable { image: string; compareAt?: number | null; stock: number; features?: string[] }
export interface RuleReply {
  text: string;
  products: AssistantProduct[];
  cartAction?: { slug: string; quantity: number };
  tool: { name: string; args: Record<string, unknown>; summary: string };
}

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);

export function findProduct(text: string, catalog: AssistantProduct[]): AssistantProduct | undefined {
  const q = new Set(words(text));
  let best: AssistantProduct | undefined, bestScore = 0;
  for (const p of catalog) {
    const score = words(p.name).filter((w) => q.has(w) || q.has(w.replace(/s$/, ""))).length + p.tags.filter((t) => q.has(t)).length * 0.3;
    if (score > bestScore) { best = p; bestScore = score; }
  }
  return bestScore >= 1 ? best : undefined;
}

const money = (n: number) => `$${n.toFixed(0)}`;
const line = (p: AssistantProduct) => `- **${p.name}** — ${money(p.price)}${p.compareAt ? ` ~~${money(p.compareAt)}~~` : ""} · ★ ${p.rating}${p.features?.[0] ? ` · ${p.features[0]}` : ""}`;

export function ruleAssistant(message: string, catalog: AssistantProduct[], lastShown: string[] = []): RuleReply {
  const text = message.toLowerCase();

  if (/\b(add|put|buy|order)\b/.test(text) && /\b(cart|bag|basket|it|this|that|one|buy)\b/.test(text)) {
    const qty = Number(text.match(/\b(\d+)\s*(x|pcs|pieces|units)?\b/)?.[1] ?? 1);
    const product = findProduct(text, catalog) ?? catalog.find((p) => p.slug === lastShown[0]);
    if (product) {
      return {
        text: `Added **${qty} × ${product.name}** (${money(product.price)} each) to your cart. ${product.stock < 10 ? `Only ${product.stock} left in stock. ` : ""}Anything else I can help you find?`,
        products: [product], cartAction: { slug: product.slug, quantity: Math.min(Math.max(qty, 1), 10) },
        tool: { name: "add_to_cart", args: { slug: product.slug, quantity: qty }, summary: `added ${product.slug}` },
      };
    }
  }

  if (/\b(compare|vs|versus|difference between)\b/.test(text)) {
    const parts = text.split(/\bvs\.?\b|\bversus\b|\band\b|,/);
    const picks = [...new Map(parts.map((part) => findProduct(part, catalog)).filter(Boolean).map((p) => [p!.slug, p!])).values()].slice(0, 3);
    if (picks.length >= 2) {
      const rows = picks.map((p) => `| ${p.name} | ${money(p.price)} | ★ ${p.rating} | ${p.features?.slice(0, 2).join("; ") ?? ""} |`).join("\n");
      const cheapest = [...picks].sort((a, b) => a.price - b.price)[0], best = [...picks].sort((a, b) => b.rating - a.rating)[0];
      return {
        text: `| Product | Price | Rating | Highlights |\n|---|---|---|---|\n${rows}\n\n**${best.name}** has the best rating, while **${cheapest.name}** is the better value.`,
        products: picks, tool: { name: "compare_products", args: { slugs: picks.map((p) => p.slug) }, summary: `compared ${picks.length} products` },
      };
    }
  }

  const filters = parseQuery(message);
  if (/\bgift|present\b/.test(text)) filters.keywords = [...filters.keywords.filter((k) => !["gift", "present"].includes(k)), "gift"];
  let results = rank(catalog, filters).slice(0, 4).map((r) => r.product);
  if (!results.length) results = rank(catalog, { ...filters, keywords: [] }).slice(0, 4).map((r) => r.product);
  const constraints = [filters.category && `in ${filters.category}`, filters.maxPrice !== undefined && `under $${filters.maxPrice}`, filters.minPrice !== undefined && `over $${filters.minPrice}`].filter(Boolean).join(", ");
  return {
    text: results.length
      ? `Here ${results.length === 1 ? "is my top pick" : `are ${results.length} picks`}${constraints ? ` ${constraints}` : ""}:\n\n${results.map(line).join("\n")}\n\nWant me to add one to your cart or compare them?`
      : "I couldn't find a match. Try describing what you need, e.g. *wireless headphones under $200* or *a gift for a coffee lover*.",
    products: results,
    tool: { name: "search_products", args: { query: message.slice(0, 80) }, summary: `${results.length} products` },
  };
}
