import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { boughtTogether, similarProducts } from "../../../shared/recommend";
import { rank } from "../../../shared/search";
import { CATEGORIES } from "../../../shared/catalog";
import type { DB } from "../db/client";
import { reviews } from "../db/schema";
import { HttpError } from "../lib/errors";
import type { LLM } from "../lib/llm";
import { reviewSummary, understandQuery } from "../services/ai";
import { loadCatalog } from "../services/catalog";
import { purchaseBaskets } from "../services/orders";

const ListQuery = z.object({
  category: z.string().optional(), minPrice: z.coerce.number().optional(), maxPrice: z.coerce.number().optional(),
  sort: z.enum(["relevance", "price_asc", "price_desc", "rating"]).optional(), q: z.string().max(200).optional(),
});

export function catalogRoutes(db: DB, llm: LLM) {
  const r = Router();
  r.get("/categories", (_req, res) => { res.json(CATEGORIES); });

  r.get("/products", async (req, res) => {
    const q = ListQuery.parse(req.query);
    const catalog = await loadCatalog(db);
    const ranked = rank(catalog, { keywords: q.q ? q.q.split(/\s+/) : [], category: q.category, minPrice: q.minPrice, maxPrice: q.maxPrice, sort: q.sort });
    res.json(ranked.map((x) => x.product));
  });

  // AI search: natural language -> structured filters (LLM or rules) -> TF-IDF ranking
  r.get("/search", async (req, res) => {
    const q = z.string().min(1).max(200).parse(req.query.q);
    const { filters, engine } = await understandQuery(llm, q);
    const results = rank(await loadCatalog(db), filters).map((x) => x.product);
    res.json({ query: q, engine, interpretation: filters, results });
  });

  r.get("/products/:slug", async (req, res) => {
    const catalog = await loadCatalog(db);
    const product = catalog.find((p) => p.slug === req.params.slug);
    if (!product) throw new HttpError(404, "Product not found");
    const rows = await db.select().from(reviews).where(eq(reviews.productId, product.id)).orderBy(desc(reviews.createdAt));
    const together = boughtTogether(product.slug, await purchaseBaskets(db)).map((b) => catalog.find((p) => p.slug === b.slug)).filter(Boolean);
    res.json({ product, reviews: rows, similar: similarProducts(product, catalog), boughtTogether: together });
  });

  r.get("/products/:slug/review-summary", async (req, res) => {
    const product = (await loadCatalog(db)).find((p) => p.slug === req.params.slug);
    if (!product) throw new HttpError(404, "Product not found");
    res.json(await reviewSummary(db, llm, product));
  });

  r.get("/recommendations", async (req, res) => {
    const seen = z.string().optional().parse(req.query.seen)?.split(",").filter(Boolean) ?? [];
    const catalog = await loadCatalog(db);
    if (!seen.length) return res.json([...catalog].sort((a, b) => b.rating * Math.log(b.reviewCount + 2) - a.rating * Math.log(a.reviewCount + 2)).slice(0, 8));
    const scores = new Map<string, number>();
    for (const slug of seen.slice(-5)) {
      const base = catalog.find((p) => p.slug === slug);
      if (!base) continue;
      similarProducts(base, catalog, 6).forEach((p, i) => scores.set(p.slug, (scores.get(p.slug) ?? 0) + (6 - i)));
    }
    seen.forEach((s) => scores.delete(s));
    res.json([...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([s]) => catalog.find((p) => p.slug === s)));
  });
  return r;
}
