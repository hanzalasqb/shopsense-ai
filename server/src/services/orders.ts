import { randomBytes } from "node:crypto";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { computeTotals } from "../../../shared/pricing";
import type { DB } from "../db/client";
import { orderItems, orders, products } from "../db/schema";
import { HttpError } from "../lib/errors";

export const CheckoutInput = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(120),
  address: z.string().min(5).max(400),
  paymentMethod: z.enum(["card", "cod"]).default("card"),
  discountCode: z.string().max(30).optional(),
  items: z.array(z.object({ slug: z.string(), quantity: z.number().int().min(1).max(10) })).min(1).max(30),
});
export type CheckoutInput = z.infer<typeof CheckoutInput>;

/** Prices and stock are always taken from the database, never from the client. */
export async function quote(db: DB, items: CheckoutInput["items"], code?: string) {
  const rows = await db.select().from(products).where(inArray(products.slug, items.map((i) => i.slug)));
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const lines = items.map((i) => {
    const p = bySlug.get(i.slug);
    if (!p || !p.active) throw new HttpError(404, `Product ${i.slug} is not available`);
    return { product: p, quantity: i.quantity, price: p.price };
  });
  return { lines, totals: computeTotals(lines, code) };
}

export async function placeOrder(db: DB, input: CheckoutInput, userId?: number) {
  return db.transaction(async (tx) => {
    const { lines, totals } = await quote(tx as unknown as DB, input.items, input.discountCode);
    if (totals.codeError) throw new HttpError(400, totals.codeError);
    for (const line of lines) {
      // atomic decrement: fails instead of overselling under concurrency
      const updated = await tx.update(products).set({ stock: sql`${products.stock} - ${line.quantity}` })
        .where(and(eq(products.id, line.product.id), gte(products.stock, line.quantity))).returning({ id: products.id });
      if (!updated.length) throw new HttpError(409, `Only ${line.product.stock} × ${line.product.name} left in stock`);
    }
    const [order] = await tx.insert(orders).values({
      number: `SS-${randomBytes(4).toString("hex").toUpperCase()}`, userId, email: input.email.toLowerCase(), name: input.name, address: input.address,
      status: input.paymentMethod === "cod" ? "pending" : "paid", paymentMethod: input.paymentMethod, discountCode: totals.code,
      subtotal: totals.subtotal, discount: totals.discount, shipping: totals.shipping, tax: totals.tax, total: totals.total,
    }).returning();
    const items = await tx.insert(orderItems).values(lines.map((l) => ({
      orderId: order.id, productId: l.product.id, name: l.product.name, unitPrice: l.price, quantity: l.quantity,
    }))).returning();
    return { ...order, items };
  });
}

export async function findOrder(db: DB, number: string, email: string) {
  const [order] = await db.select().from(orders).where(and(eq(orders.number, number.toUpperCase()), eq(orders.email, email.toLowerCase())));
  if (!order) return undefined;
  return { ...order, items: await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)) };
}

export async function purchaseBaskets(db: DB): Promise<string[][]> {
  const rows = await db.select({ orderId: orderItems.orderId, slug: products.slug }).from(orderItems).innerJoin(products, eq(orderItems.productId, products.id));
  const baskets = new Map<number, string[]>();
  rows.forEach((r) => baskets.set(r.orderId, [...(baskets.get(r.orderId) ?? []), r.slug]));
  return [...baskets.values()];
}
