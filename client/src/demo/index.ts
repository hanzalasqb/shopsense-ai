// Browser-only store used by the GitHub Pages demo: same shared search/pricing/recommendation code as the server.
import { ruleAssistant, type AssistantProduct } from "../../../shared/assistant";
import { CATEGORIES, PRODUCTS, REVIEW_TEMPLATES } from "../../../shared/catalog";
import { computeTotals } from "../../../shared/pricing";
import { boughtTogether, similarProducts } from "../../../shared/recommend";
import { parseQuery, rank } from "../../../shared/search";
import type { Api } from "../lib/api";
import type { Order, Product, Review } from "../lib/types";

function prng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rand = prng(42);
const catName = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));
const reviews = new Map<string, Review[]>();
let reviewId = 1;
const products: Product[] = PRODUCTS.map((p, i) => {
  const list = Array.from({ length: 3 + Math.floor(rand() * 4) }, (_, k) => {
    const t = REVIEW_TEMPLATES[Math.floor(rand() * REVIEW_TEMPLATES.length * (p.rating >= 4.5 ? 0.6 : 1))];
    return { id: reviewId++, author: `Demo customer ${k + 1}`, ...t, createdAt: new Date(Date.now() - rand() * 60 * 86_400_000).toISOString() };
  });
  reviews.set(p.slug, list);
  return { id: i + 1, slug: p.slug, name: p.name, category: p.category, categoryName: catName[p.category], price: p.price, compareAt: p.compareAt ?? null, stock: p.stock, rating: p.rating, reviewCount: list.length, tags: p.tags, description: p.description, features: p.features, image: p.image };
});
const BUNDLES = [["aurasound-pro-headphones", "nimbus-portable-speaker"], ["pro-grip-yoga-mat", "insulated-steel-bottle"], ["pour-over-coffee-kit", "terracotta-vase-trio"], ["classic-leather-jacket", "urban-white-sneakers"], ["cloudstride-running-shoes", "insulated-steel-bottle"], ["vertex-mechanical-keyboard", "arc-desk-lamp"], ["trailhead-2-person-tent", "insulated-steel-bottle"], ["minimalist-analog-watch", "gold-round-sunglasses"], ["monstera-deliciosa-plant", "linen-throw-pillow"]];
const orders: (Order & { slugs: string[] })[] = [];
for (let day = 30; day >= 0; day--) {
  for (let k = 0, n = 2 + Math.floor(rand() * 5); k < n; k++) {
    const basket = rand() < 0.45 ? [...BUNDLES[Math.floor(rand() * BUNDLES.length)]] : [products[Math.floor(rand() * products.length)].slug];
    if (rand() < 0.2) basket.push(products[Math.floor(rand() * products.length)].slug);
    const lines = [...new Set(basket)].map((s) => ({ p: products.find((x) => x.slug === s)!, quantity: 1 + (rand() < 0.15 ? 1 : 0) }));
    const t = computeTotals(lines.map((l) => ({ price: l.p.price, quantity: l.quantity })));
    orders.push({ number: `SS-${(100000 + Math.floor(rand() * 899999)).toString(36).toUpperCase()}`, email: "customer@example.com", name: "Demo Customer", status: day > 3 ? "delivered" : "shipped", paymentMethod: "card", ...t, createdAt: new Date(Date.now() - day * 86_400_000 - rand() * 80_000_000).toISOString(), items: lines.map((l) => ({ name: l.p.name, unitPrice: l.p.price, quantity: l.quantity })), slugs: lines.map((l) => l.p.slug) });
  }
}
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const bySlug = (slug: string) => { const p = products.find((x) => x.slug === slug); if (!p) throw new Error("Product not found"); return p; };

export const demoApi: Api = {
  demo: true,
  categories: async () => CATEGORIES,
  products: async (params = {}) => rank(products, { keywords: params.q ? params.q.split(/\s+/) : [], category: params.category, maxPrice: params.maxPrice ? +params.maxPrice : undefined, minPrice: params.minPrice ? +params.minPrice : undefined, sort: params.sort as never }).map((r) => r.product),
  search: async (q) => { await wait(300); const f = parseQuery(q); return { query: q, engine: "rules", interpretation: f, results: rank(products, f).map((r) => r.product) }; },
  product: async (slug) => {
    const product = bySlug(slug);
    const together = boughtTogether(slug, orders.map((o) => o.slugs)).map((b) => bySlug(b.slug));
    return { product, reviews: reviews.get(slug) ?? [], similar: similarProducts(product, products), boughtTogether: together };
  },
  reviewSummary: async (slug) => {
    await wait(600);
    const rows = reviews.get(slug) ?? [], avg = rows.reduce((n, r) => n + r.rating, 0) / (rows.length || 1);
    const first = (s: string) => s.split(/[.!]/)[0].trim();
    const pros = [...new Set(rows.filter((r) => r.rating >= 4).map((r) => first(r.body)))].slice(0, 3), cons = [...new Set(rows.filter((r) => r.rating <= 3).map((r) => first(r.body)))].slice(0, 3);
    return { summary: `${rows.length} reviews average ${avg.toFixed(1)}/5. Customers mostly mention ${pros[0]?.toLowerCase() ?? "the overall quality"}${cons.length ? `, while some note: ${cons[0].toLowerCase()}` : ""}.`, pros, cons, sentiment: avg >= 4 ? "positive" : "mixed", engine: "extractive" };
  },
  recommendations: async (seen) => {
    if (!seen.length) return [...products].sort((a, b) => b.rating * Math.log(b.reviewCount + 2) - a.rating * Math.log(a.reviewCount + 2)).slice(0, 8);
    const scores = new Map<string, number>();
    seen.slice(-5).forEach((s) => similarProducts(bySlug(s), products, 6).forEach((p, i) => scores.set(p.slug, (scores.get(p.slug) ?? 0) + 6 - i)));
    seen.forEach((s) => scores.delete(s));
    return [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([s]) => bySlug(s));
  },
  quote: async (items, code) => {
    const lines = items.map((i) => { const p = bySlug(i.slug); return { slug: p.slug, name: p.name, price: p.price, quantity: i.quantity, stock: p.stock }; });
    return { lines, totals: computeTotals(lines, code) };
  },
  placeOrder: async (input) => {
    await wait(700);
    const { lines, totals } = await demoApi.quote(input.items, input.discountCode);
    if (totals.codeError) throw new Error(totals.codeError);
    for (const l of lines) if (bySlug(l.slug).stock < l.quantity) throw new Error(`Only ${bySlug(l.slug).stock} × ${l.name} left in stock`);
    lines.forEach((l) => { bySlug(l.slug).stock -= l.quantity; });
    const order = { number: `SS-${Math.random().toString(16).slice(2, 10).toUpperCase()}`, email: input.email.toLowerCase(), name: input.name, status: input.paymentMethod === "cod" ? "pending" : "paid", paymentMethod: input.paymentMethod, ...totals, createdAt: new Date().toISOString(), items: lines.map((l) => ({ name: l.name, unitPrice: l.price, quantity: l.quantity })), slugs: lines.map((l) => l.slug) };
    orders.push(order);
    return order;
  },
  track: async (number, email) => {
    const o = orders.find((x) => x.number === number.trim().toUpperCase() && x.email === email.trim().toLowerCase());
    if (!o) throw new Error("No order found with that number and email");
    return o;
  },
  login: async () => ({ token: "demo", user: { id: 1, email: "admin@demo.local", name: "Demo Admin", role: "admin" } }),
  analytics: async () => {
    const since = Date.now() - 30 * 86_400_000, recentOrders = orders.filter((o) => +new Date(o.createdAt) >= since);
    const daily = new Map<string, { revenue: number; orders: number }>();
    recentOrders.forEach((o) => { const d = o.createdAt.slice(0, 10), v = daily.get(d) ?? { revenue: 0, orders: 0 }; v.revenue += o.total; v.orders++; daily.set(d, v); });
    const top = new Map<string, { units: number; revenue: number }>(), cats = new Map<string, number>();
    recentOrders.forEach((o) => o.items.forEach((i) => { const t = top.get(i.name) ?? { units: 0, revenue: 0 }; t.units += i.quantity; t.revenue += i.quantity * i.unitPrice; top.set(i.name, t); const c = products.find((p) => p.name === i.name)!.categoryName; cats.set(c, (cats.get(c) ?? 0) + i.quantity * i.unitPrice); }));
    const days = [...daily.entries()].sort().map(([day, v]) => ({ day, revenue: Math.round(v.revenue * 100) / 100, orders: v.orders }));
    const revenue = days.reduce((n, d) => n + d.revenue, 0), count = days.reduce((n, d) => n + d.orders, 0), half = Math.floor(days.length / 2);
    const growth = (days.slice(half).reduce((n, d) => n + d.revenue, 0) / Math.max(1, days.slice(0, half).reduce((n, d) => n + d.revenue, 0)) - 1) * 100;
    const topList = [...top.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 6).map(([name, v]) => ({ name, ...v }));
    const lowStock = products.filter((p) => p.stock < 15).sort((a, b) => a.stock - b.stock).map((p) => ({ slug: p.slug, name: p.name, stock: p.stock }));
    return {
      kpis: { revenue: Math.round(revenue), orders: count, aov: Math.round((revenue / count) * 100) / 100, growth: Math.round(growth * 10) / 10, products: products.length },
      daily: days, top: topList, byCategory: [...cats.entries()].map(([name, value]) => ({ name, value: Math.round(value) })), lowStock, recent: [...orders].reverse().slice(0, 8),
      insights: [`${topList[0].name} is your best seller this month (${topList[0].units} units, $${Math.round(topList[0].revenue)}).`, `${lowStock.length} products are running low — restock ${lowStock[0].name} first (${lowStock[0].stock} left).`, `Revenue is ${growth >= 0 ? "up" : "down"} ${Math.abs(Math.round(growth))}% in the second half of the period vs the first half.`],
    };
  },
  generateDescription: async (input) => {
    await wait(800);
    const opener = ({ premium: "Crafted for those who expect more,", friendly: "Meet your new favourite:", technical: "Engineered for performance," } as Record<string, string>)[input.tone] ?? "Meet";
    return { engine: "template", description: `${opener} the ${input.name} brings ${input.features.slice(0, 2).join(" and ").toLowerCase() || "thoughtful design"} to your everyday ${input.category}. Built to last and designed to delight.`, bullets: input.features.slice(0, 4).map((f) => `${f} — so you get more out of every day`), seoKeywords: [...new Set([input.name.toLowerCase(), input.category, ...input.features.flatMap((f) => f.toLowerCase().split(/\W+/).filter((w) => w.length > 4))])].slice(0, 6) };
  },
  async assistant(message, _history, lastShown, onEvent) {
    const reply = ruleAssistant(message, products as AssistantProduct[], lastShown);
    onEvent({ type: "tool_call", name: reply.tool.name, args: reply.tool.args });
    await wait(500);
    onEvent({ type: "tool_result", name: reply.tool.name, summary: reply.tool.summary });
    if (reply.products.length) onEvent({ type: "products", products: reply.products as Product[] });
    if (reply.cartAction) onEvent({ type: "cart_action", ...reply.cartAction });
    for (const chunk of reply.text.match(/\S+\s*|\s+/g) ?? []) { onEvent({ type: "token", text: chunk }); await wait(12); }
    onEvent({ type: "done" });
  },
};
