// Natural-language query understanding + TF-IDF ranking. Shared by server and browser demo.
export interface SearchFilters { keywords: string[]; category?: string; minPrice?: number; maxPrice?: number; sort?: "relevance" | "price_asc" | "price_desc" | "rating"; tags?: string[] }
export interface Searchable { slug: string; name: string; category: string; price: number; rating: number; tags: string[]; description: string }

const CATEGORY_WORDS: Record<string, string[]> = {
  electronics: ["electronic", "electronics", "tech", "gadget", "gadgets", "headphone", "headphones", "speaker", "keyboard", "camera", "smartwatch", "audio"],
  fashion: ["fashion", "clothes", "clothing", "jacket", "sneaker", "sneakers", "watch", "backpack", "sunglasses", "accessories", "outfit", "wear"],
  home: ["home", "decor", "kitchen", "lamp", "vase", "pillow", "plant", "coffee", "living", "furniture", "cozy"],
  sports: ["sport", "sports", "fitness", "gym", "yoga", "running", "camping", "hiking", "outdoor", "workout", "training"],
};
const STOP = new Set("a an the for me my i to and or of with in on under below less than over above more cheap cheapest best show find need want looking some something anything that is are good great nice top rated new budget gear stuff item items thing things product products idea ideas option options".split(" "));
// generic words that only select a category (they should not also be required as keywords)
const CATEGORY_TRIGGERS = new Set(["electronics", "fashion", "home", "sports", "tech", "fitness", "decor", "clothing", "outdoor", "gadget", "gadgets", "accessories"]);
const SYNONYMS: Record<string, string> = { earphones: "headphones", earbuds: "headphones", trainers: "sneakers", bag: "backpack", rucksack: "backpack", mug: "coffee", present: "gift", cosy: "cozy", warm: "winter", jog: "running", jogging: "running" };

export function parseQuery(raw: string): SearchFilters {
  let q = ` ${raw.toLowerCase()} `;
  const f: SearchFilters = { keywords: [] };
  const num = "\\$?(\\d+(?:\\.\\d+)?)";
  let m: RegExpMatchArray | null;
  if ((m = q.match(new RegExp(`between ${num} and ${num}`)))) { f.minPrice = +m[1]; f.maxPrice = +m[2]; q = q.replace(m[0], " "); }
  if ((m = q.match(new RegExp(`(?:under|below|less than|cheaper than|max|up to|<)\\s*${num}`)))) { f.maxPrice = +m[1]; q = q.replace(m[0], " "); }
  if ((m = q.match(new RegExp(`(?:over|above|more than|at least|>)\\s*${num}`)))) { f.minPrice = +m[1]; q = q.replace(m[0], " "); }
  if (/cheapest|lowest price|budget|affordable/.test(q)) f.sort = "price_asc";
  else if (/most expensive|premium|luxury/.test(q)) f.sort = "price_desc";
  else if (/best rated|top rated|highest rated|best reviewed/.test(q)) f.sort = "rating";
  const words = q.replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean).flatMap((w) => (SYNONYMS[w] ? [w, SYNONYMS[w]] : [w]));
  for (const [cat, list] of Object.entries(CATEGORY_WORDS)) {
    if (words.some((w) => w === cat || (list.includes(w) && ["fashion", "electronics", "home", "sports", "tech", "fitness", "decor", "clothing", "outdoor"].includes(w)))) f.category = cat;
  }
  f.keywords = [...new Set(words.filter((w) => !STOP.has(w) && w.length > 1 && !/^\d+$/.test(w) && !(f.category && CATEGORY_TRIGGERS.has(w))))];
  return f;
}

const tokenize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 1);
const stem = (w: string) => w.replace(/(ing|es|s)$/, "");

/** Weighted TF-IDF scoring over name (x3), tags (x2), category and description. */
export function rank<T extends Searchable>(products: T[], filters: SearchFilters): { product: T; score: number }[] {
  const docs = products.map((p) => [
    ...tokenize(p.name).flatMap((t) => [t, t, t]), ...p.tags.flatMap((t) => tokenize(t)).flatMap((t) => [t, t]),
    ...tokenize(p.category), ...tokenize(p.description),
  ].map(stem));
  const df = new Map<string, number>();
  docs.forEach((d) => new Set(d).forEach((t) => df.set(t, (df.get(t) ?? 0) + 1)));
  const terms = filters.keywords.flatMap(tokenize).map(stem).filter((t) => !Object.keys(CATEGORY_WORDS).includes(t) || df.has(t));
  const results = products.map((product, i) => {
    let score = 0;
    for (const t of terms) {
      const tf = docs[i].filter((x) => x === t || (t.length > 3 && x.startsWith(t))).length;
      if (tf) score += (1 + Math.log(tf)) * Math.log(1 + products.length / (df.get(t) ?? 1));
    }
    return { product, score };
  }).filter(({ product, score }) =>
    (!filters.category || product.category === filters.category) &&
    (filters.minPrice === undefined || product.price >= filters.minPrice) &&
    (filters.maxPrice === undefined || product.price <= filters.maxPrice) &&
    (terms.length === 0 || score > 0 || (filters.category !== undefined && terms.every((t) => (CATEGORY_WORDS[filters.category!] ?? []).includes(t)))));
  const sort = filters.sort ?? "relevance";
  return results.sort((a, b) =>
    sort === "price_asc" ? a.product.price - b.product.price
      : sort === "price_desc" ? b.product.price - a.product.price
        : sort === "rating" ? b.product.rating - a.product.rating
          : b.score - a.score || b.product.rating - a.product.rating);
}
