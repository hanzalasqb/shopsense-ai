// Hybrid recommendations: content similarity (tags/category/name) + co-purchase signals.
import type { Searchable } from "./search";

const bag = (p: Searchable) => {
  const v = new Map<string, number>();
  const add = (t: string, w: number) => v.set(t, (v.get(t) ?? 0) + w);
  p.tags.forEach((t) => add(`tag:${t}`, 2));
  add(`cat:${p.category}`, 3);
  p.name.toLowerCase().split(/\W+/).filter((w) => w.length > 3).forEach((w) => add(`w:${w}`, 1));
  return v;
};
const cosine = (a: Map<string, number>, b: Map<string, number>) => {
  let dot = 0, na = 0, nb = 0;
  a.forEach((x, k) => { na += x * x; dot += x * (b.get(k) ?? 0); });
  b.forEach((x) => { nb += x * x; });
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
};

export function similarProducts<T extends Searchable>(target: T, all: T[], limit = 4): T[] {
  const tv = bag(target);
  return all.filter((p) => p.slug !== target.slug)
    .map((p) => ({ p, s: cosine(tv, bag(p)) + (Math.abs(p.price - target.price) / Math.max(p.price, target.price) < 0.5 ? 0.05 : 0) }))
    .sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.p);
}

/** orders: list of baskets (product slugs). Returns slugs most often bought with `slug`. */
export function boughtTogether(slug: string, orders: string[][], limit = 3): { slug: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const basket of orders) {
    if (!basket.includes(slug)) continue;
    for (const other of new Set(basket)) if (other !== slug) counts.set(other, (counts.get(other) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([s, count]) => ({ slug: s, count }));
}
