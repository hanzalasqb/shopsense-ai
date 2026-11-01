import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { CATEGORIES, PRODUCTS, REVIEW_TEMPLATES } from "../../../shared/catalog";
import { computeTotals } from "../../../shared/pricing";
import { config } from "../config";
import type { DB } from "../db/client";
import { categories, orderItems, orders, products, reviews, users } from "../db/schema";
import { hashPassword } from "../lib/auth";

// deterministic PRNG so demo analytics look the same on every fresh install
function mulberry32(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const BUNDLES = [
  ["aurasound-pro-headphones", "nimbus-portable-speaker"], ["pro-grip-yoga-mat", "insulated-steel-bottle"], ["pour-over-coffee-kit", "terracotta-vase-trio"],
  ["classic-leather-jacket", "urban-white-sneakers"], ["cloudstride-running-shoes", "insulated-steel-bottle"], ["vertex-mechanical-keyboard", "arc-desk-lamp"],
  ["trailhead-2-person-tent", "insulated-steel-bottle"], ["minimalist-analog-watch", "gold-round-sunglasses"], ["monstera-deliciosa-plant", "linen-throw-pillow"],
];

export async function seed(db: DB) {
  const existing = await db.select({ id: categories.id }).from(categories).limit(1);
  if (existing.length) return;
  const cats = await db.insert(categories).values(CATEGORIES).returning();
  const catId = new Map(cats.map((c) => [c.slug, c.id]));
  const inserted = await db.insert(products).values(PRODUCTS.map((p) => ({
    slug: p.slug, name: p.name, categoryId: catId.get(p.category)!, price: p.price, compareAt: p.compareAt ?? null, stock: p.stock,
    rating: p.rating, tags: p.tags, description: p.description, features: p.features, image: p.image,
  }))).returning();
  const bySlug = new Map(inserted.map((p) => [p.slug, p]));

  const rand = mulberry32(42);
  const reviewRows = inserted.flatMap((p) => Array.from({ length: 3 + Math.floor(rand() * 4) }, (_, i) => {
    const t = REVIEW_TEMPLATES[Math.floor(rand() * REVIEW_TEMPLATES.length * (p.rating >= 4.5 ? 0.6 : 1))];
    return { productId: p.id, author: `Demo customer ${i + 1}`, rating: t.rating, title: t.title, body: t.body };
  }));
  await db.insert(reviews).values(reviewRows);

  const adminPassword = config.ADMIN_PASSWORD || randomBytes(9).toString("base64url");
  await db.insert(users).values({ email: config.ADMIN_EMAIL, name: "Store Admin", role: "admin", passwordHash: await hashPassword(adminPassword) });
  if (!config.ADMIN_PASSWORD) console.log(`[seed] Admin account ${config.ADMIN_EMAIL} created with generated password: ${adminPassword}`);

  // ~30 days of historical orders with realistic "bought together" patterns
  const slugs = [...bySlug.keys()];
  for (let day = 30; day >= 0; day--) {
    const ordersToday = 2 + Math.floor(rand() * 5);
    for (let k = 0; k < ordersToday; k++) {
      const basket = rand() < 0.45 ? [...BUNDLES[Math.floor(rand() * BUNDLES.length)]] : [slugs[Math.floor(rand() * slugs.length)]];
      if (rand() < 0.2) basket.push(slugs[Math.floor(rand() * slugs.length)]);
      const lines = [...new Set(basket)].map((s) => ({ product: bySlug.get(s)!, quantity: 1 + (rand() < 0.15 ? 1 : 0) }));
      const totals = computeTotals(lines.map((l) => ({ price: l.product.price, quantity: l.quantity })));
      const createdAt = new Date(Date.now() - day * 86_400_000 - Math.floor(rand() * 86_400_000 * 0.9));
      const [order] = await db.insert(orders).values({
        number: `SS-${(100000 + Math.floor(rand() * 899999)).toString(36).toUpperCase()}`, email: `customer${k}@example.com`, name: "Demo Customer",
        address: "1 Demo Street, Sample City", status: day > 3 ? "delivered" : "shipped", paymentMethod: rand() < 0.7 ? "card" : "cod",
        subtotal: totals.subtotal, discount: totals.discount, shipping: totals.shipping, tax: totals.tax, total: totals.total, createdAt,
      }).returning();
      await db.insert(orderItems).values(lines.map((l) => ({ orderId: order.id, productId: l.product.id, name: l.product.name, unitPrice: l.product.price, quantity: l.quantity })));
    }
  }
  console.log(`[seed] ${inserted.length} products, ${reviewRows.length} reviews and demo orders created`);
}

export async function ensureAdmin(db: DB) {
  return (await db.select().from(users).where(eq(users.role, "admin")).limit(1))[0];
}
