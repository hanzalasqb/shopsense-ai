import { Router } from "express";
import { desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "../db/client";
import { orderItems, orders, products } from "../db/schema";
import { requireAdmin } from "../lib/auth";
import { HttpError } from "../lib/errors";
import type { LLM } from "../lib/llm";
import { DescriptionInput, generateDescription } from "../services/ai";
import { loadCatalog } from "../services/catalog";

export function adminRoutes(db: DB, llm: LLM) {
  const r = Router();
  r.use(requireAdmin);

  r.get("/analytics", async (_req, res) => {
    const since = new Date(Date.now() - 30 * 86_400_000);
    const daily = await db.select({
      day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`, revenue: sql<number>`sum(${orders.total})::float`, orders: sql<number>`count(*)::int`,
    }).from(orders).where(gte(orders.createdAt, since)).groupBy(sql`1`).orderBy(sql`1`);
    const top = await db.select({ name: orderItems.name, units: sql<number>`sum(${orderItems.quantity})::int`, revenue: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitPrice})::float` })
      .from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(gte(orders.createdAt, since)).groupBy(orderItems.name).orderBy(desc(sql`3`)).limit(6);
    const catalog = await loadCatalog(db);
    const byCategory = new Map<string, number>();
    const items = await db.select({ productId: orderItems.productId, revenue: sql<number>`(${orderItems.quantity} * ${orderItems.unitPrice})::float` }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(gte(orders.createdAt, since));
    for (const it of items) {
      const cat = catalog.find((p) => p.id === it.productId)?.categoryName ?? "Other";
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + it.revenue);
    }
    const revenue = daily.reduce((n, d) => n + d.revenue, 0), count = daily.reduce((n, d) => n + d.orders, 0);
    const lowStock = catalog.filter((p) => p.stock < 15).sort((a, b) => a.stock - b.stock).map((p) => ({ slug: p.slug, name: p.name, stock: p.stock }));
    const recent = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8);
    const half = Math.floor(daily.length / 2);
    const growth = half ? (daily.slice(half).reduce((n, d) => n + d.revenue, 0) / Math.max(1, daily.slice(0, half).reduce((n, d) => n + d.revenue, 0)) - 1) * 100 : 0;
    res.json({
      kpis: { revenue: Math.round(revenue * 100) / 100, orders: count, aov: count ? Math.round((revenue / count) * 100) / 100 : 0, growth: Math.round(growth * 10) / 10, products: catalog.length },
      daily, top, byCategory: [...byCategory.entries()].map(([name, value]) => ({ name, value: Math.round(value) })), lowStock, recent,
      insights: [
        top[0] && `${top[0].name} is your best seller this month (${top[0].units} units, $${Math.round(top[0].revenue)}).`,
        lowStock[0] && `${lowStock.length} products are running low — restock ${lowStock[0].name} first (${lowStock[0].stock} left).`,
        `Revenue is ${growth >= 0 ? "up" : "down"} ${Math.abs(Math.round(growth))}% in the second half of the period vs the first half.`,
      ].filter(Boolean),
    });
  });

  r.post("/ai/description", async (req, res) => { res.json(await generateDescription(llm, DescriptionInput.parse(req.body))); });

  r.patch("/products/:slug", async (req, res) => {
    const body = z.object({ price: z.number().positive().optional(), stock: z.number().int().min(0).optional(), description: z.string().min(10).max(2000).optional() }).parse(req.body);
    const updated = await db.update(products).set(body).where(eq(products.slug, req.params.slug)).returning();
    if (!updated.length) throw new HttpError(404, "Product not found");
    res.json(updated[0]);
  });
  return r;
}
