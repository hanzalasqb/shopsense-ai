import { describe, expect, it } from "vitest";
import { ruleAssistant } from "../../shared/assistant";
import { PRODUCTS } from "../../shared/catalog";
import { computeTotals } from "../../shared/pricing";
import { boughtTogether, similarProducts } from "../../shared/recommend";
import { parseQuery, rank } from "../../shared/search";

const catalog = PRODUCTS.map((p) => ({ ...p, compareAt: p.compareAt ?? null }));

describe("query understanding", () => {
  it("extracts price, category and sort", () => {
    expect(parseQuery("cheapest fitness gear under $80")).toMatchObject({ maxPrice: 80, category: "sports", sort: "price_asc" });
    expect(parseQuery("gift between $50 and $150")).toMatchObject({ minPrice: 50, maxPrice: 150 });
  });
  it("ranks relevant products first and respects filters", () => {
    const results = rank(catalog, parseQuery("wireless noise cancelling headphones")).map((r) => r.product.slug);
    expect(results[0]).toBe("aurasound-pro-headphones");
    const cheap = rank(catalog, parseQuery("shoes under $100"));
    expect(cheap.every((r) => r.product.price <= 100)).toBe(true);
    expect(cheap.map((r) => r.product.slug)).toContain("urban-white-sneakers");
  });
});

describe("pricing", () => {
  it("applies discount, free shipping threshold and tax", () => {
    expect(computeTotals([{ price: 50, quantity: 1 }])).toMatchObject({ subtotal: 50, shipping: 7.99, tax: 4, total: 61.99 });
    expect(computeTotals([{ price: 120, quantity: 1 }], "welcome10")).toMatchObject({ discount: 12, shipping: 0, total: 116.64, code: "WELCOME10" });
    expect(computeTotals([{ price: 60, quantity: 1 }], "AI20").codeError).toMatch(/subtotal/);
  });
});

describe("recommendations", () => {
  it("finds similar items and co-purchases", () => {
    const yoga = catalog.find((p) => p.slug === "pro-grip-yoga-mat")!;
    expect(similarProducts(yoga, catalog).map((p) => p.category)).toContain("sports");
    expect(boughtTogether("a", [["a", "b"], ["a", "b"], ["a", "c"], ["d"]])[0]).toEqual({ slug: "b", count: 2 });
  });
});

describe("rule-based assistant", () => {
  it("searches, adds to cart and compares", () => {
    expect(ruleAssistant("a gift for a coffee lover under $60", catalog).products[0].slug).toBe("pour-over-coffee-kit");
    expect(ruleAssistant("add 2 of the leather jacket to my cart", catalog).cartAction).toEqual({ slug: "classic-leather-jacket", quantity: 2 });
    const cmp = ruleAssistant("compare the smartwatch vs the analog watch", catalog);
    expect(cmp.tool.name).toBe("compare_products");
    expect(cmp.products).toHaveLength(2);
  });
});
