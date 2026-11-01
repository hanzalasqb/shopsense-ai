import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "../db/client";
import { orders } from "../db/schema";
import { optionalAuth, requireAuth } from "../lib/auth";
import { HttpError } from "../lib/errors";
import { CheckoutInput, findOrder, placeOrder, quote } from "../services/orders";

export function orderRoutes(db: DB) {
  const r = Router();
  r.post("/quote", async (req, res) => {
    const body = CheckoutInput.pick({ items: true, discountCode: true }).parse(req.body);
    const { lines, totals } = await quote(db, body.items, body.discountCode);
    res.json({ totals, lines: lines.map((l) => ({ slug: l.product.slug, name: l.product.name, price: l.price, quantity: l.quantity, stock: l.product.stock })) });
  });
  r.post("/", optionalAuth, async (req, res) => {
    const order = await placeOrder(db, CheckoutInput.parse(req.body), req.user?.id);
    res.status(201).json(order);
  });
  r.get("/track", async (req, res) => {
    const q = z.object({ number: z.string().min(4), email: z.string().email() }).parse(req.query);
    const order = await findOrder(db, q.number, q.email);
    if (!order) throw new HttpError(404, "No order found with that number and email");
    res.json(order);
  });
  r.get("/mine", requireAuth, async (req, res) => {
    res.json(await db.select().from(orders).where(eq(orders.userId, req.user!.id)).orderBy(desc(orders.createdAt)));
  });
  return r;
}
