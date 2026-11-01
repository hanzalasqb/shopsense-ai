import { count, eq } from "drizzle-orm";
import type { DB } from "../db/client";
import { categories, products, reviews } from "../db/schema";

export interface ProductDTO {
  id: number; slug: string; name: string; category: string; categoryName: string; price: number; compareAt: number | null;
  stock: number; rating: number; reviewCount: number; tags: string[]; description: string; features: string[]; image: string;
}

/** The demo catalog is small, so it's loaded in one query and ranked in memory (swap for Postgres FTS / pgvector at scale). */
export async function loadCatalog(db: DB): Promise<ProductDTO[]> {
  const reviewCounts = new Map(
    (await db.select({ productId: reviews.productId, n: count() }).from(reviews).groupBy(reviews.productId)).map((r) => [r.productId, r.n]),
  );
  const rows = await db.select({ p: products, c: categories }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).where(eq(products.active, true)).orderBy(products.id);
  return rows.map(({ p, c }) => ({
    id: p.id, slug: p.slug, name: p.name, category: c.slug, categoryName: c.name, price: p.price, compareAt: p.compareAt,
    stock: p.stock, rating: p.rating, reviewCount: reviewCounts.get(p.id) ?? 0, tags: p.tags, description: p.description, features: p.features, image: p.image,
  }));
}
