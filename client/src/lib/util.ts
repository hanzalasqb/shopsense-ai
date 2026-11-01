export const money = (n: number) => `$${n.toFixed(2).replace(/\.00$/, "")}`;
export const imageUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
export const discountPct = (price: number, compareAt: number | null) => (compareAt ? Math.round((1 - price / compareAt) * 100) : 0);
