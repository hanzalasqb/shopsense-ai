import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { products, users } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth";
import { fakeLLM, makeApp } from "./setup";

let ctx: Awaited<ReturnType<typeof makeApp>>;
beforeAll(async () => { ctx = await makeApp(); });
afterAll(async () => { await ctx.close(); });

const sse = (text: string) => text.trim().split("\n\n").map((b) => ({ event: b.split("\n")[0].slice(7), data: JSON.parse(b.split("\n")[1].slice(6)) }));

describe("catalog & AI search", () => {
  it("lists and filters products", async () => {
    const all = await request(ctx.app).get("/api/products").expect(200);
    expect(all.body).toHaveLength(20);
    const cheap = await request(ctx.app).get("/api/products?category=fashion&maxPrice=100&sort=price_asc").expect(200);
    expect(cheap.body.every((p: { category: string; price: number }) => p.category === "fashion" && p.price <= 100)).toBe(true);
  });
  it("understands natural-language search (rules engine without an API key)", async () => {
    const res = await request(ctx.app).get("/api/search").query({ q: "running shoes under $150" }).expect(200);
    expect(res.body.engine).toBe("rules");
    expect(res.body.interpretation.maxPrice).toBe(150);
    expect(res.body.results[0].slug).toBe("cloudstride-running-shoes");
  });
  it("returns product details with recommendations and review summary", async () => {
    const res = await request(ctx.app).get("/api/products/pro-grip-yoga-mat").expect(200);
    expect(res.body.similar).toHaveLength(4);
    expect(res.body.boughtTogether.map((p: { slug: string }) => p.slug)).toContain("insulated-steel-bottle");
    const summary = await request(ctx.app).get("/api/products/pro-grip-yoga-mat/review-summary").expect(200);
    expect(summary.body.engine).toBe("extractive");
    expect(summary.body.summary).toMatch(/reviews average/);
    await request(ctx.app).get("/api/products/nope").expect(404);
  });
});

describe("checkout", () => {
  it("prices server-side, applies codes and decrements stock", async () => {
    const quote = await request(ctx.app).post("/api/orders/quote").send({ items: [{ slug: "classic-leather-jacket", quantity: 1 }], discountCode: "WELCOME10" }).expect(200);
    expect(quote.body.totals).toMatchObject({ subtotal: 249, discount: 24.9, shipping: 0 });
    const order = await request(ctx.app).post("/api/orders").send({
      email: "Buyer@Example.com", name: "Test Buyer", address: "1 Test Street, City", paymentMethod: "card",
      discountCode: "WELCOME10", items: [{ slug: "classic-leather-jacket", quantity: 2, price: 1 }],
    }).expect(201);
    expect(order.body.total).toBeCloseTo((498 - 49.8) * 1.08, 2);
    const [jacket] = await ctx.db.select().from(products).where(eq(products.slug, "classic-leather-jacket"));
    expect(jacket.stock).toBe(13);
    const tracked = await request(ctx.app).get("/api/orders/track").query({ number: order.body.number, email: "buyer@example.com" }).expect(200);
    expect(tracked.body.items[0].quantity).toBe(2);
  });
  it("prevents overselling", async () => {
    const res = await request(ctx.app).post("/api/orders").send({ email: "a@b.co", name: "Buyer", address: "Somewhere 1", items: [{ slug: "trailhead-2-person-tent", quantity: 9 }] }).expect(409);
    expect(res.body.error).toMatch(/left in stock/);
  });
  it("validates input", async () => {
    await request(ctx.app).post("/api/orders").send({ email: "bad", items: [] }).expect(400);
  });
});

describe("auth & admin", () => {
  it("protects admin routes and serves analytics to admins", async () => {
    await request(ctx.app).get("/api/admin/analytics").expect(401);
    const customer = await request(ctx.app).post("/api/auth/register").send({ email: "c@example.com", name: "Cust", password: "password123" }).expect(201);
    await request(ctx.app).get("/api/admin/analytics").set("Authorization", `Bearer ${customer.body.token}`).expect(403);
    await ctx.db.update(users).set({ passwordHash: await hashPassword("admin-pass-123") }).where(eq(users.role, "admin"));
    const admin = await request(ctx.app).post("/api/auth/login").send({ email: "admin@shopsense.local", password: "admin-pass-123" }).expect(200);
    const res = await request(ctx.app).get("/api/admin/analytics").set("Authorization", `Bearer ${admin.body.token}`).expect(200);
    expect(res.body.kpis.orders).toBeGreaterThan(50);
    expect(res.body.daily.length).toBeGreaterThan(20);
    expect(res.body.insights.length).toBeGreaterThan(1);
    const desc = await request(ctx.app).post("/api/admin/ai/description").set("Authorization", `Bearer ${admin.body.token}`)
      .send({ name: "Bamboo Desk Organizer", category: "home", features: ["Sustainable bamboo", "5 compartments"] }).expect(200);
    expect(desc.body.description).toMatch(/Bamboo Desk Organizer/);
  });
});

describe("AI shopping assistant", () => {
  it("falls back to the rule engine without an LLM key", async () => {
    const res = await request(ctx.app).post("/api/assistant/stream").send({ message: "add the yoga mat to my cart" }).expect(200);
    const events = sse(res.text);
    expect(events.find((e) => e.event === "cart_action")?.data).toEqual({ slug: "pro-grip-yoga-mat", quantity: 1 });
  });
  it("runs the tool-calling loop with an LLM", async () => {
    const llm = fakeLLM();
    const withLLM = await makeApp(llm);
    const res = await request(withLLM.app).post("/api/assistant/stream").send({ message: "I need noise cancelling headphones, add two" }).expect(200);
    const events = sse(res.text);
    expect(events.filter((e) => e.event === "tool_call").map((e) => e.data.name)).toEqual(["search_products", "add_to_cart"]);
    expect(events.find((e) => e.event === "products")?.data.products[0].slug).toBe("aurasound-pro-headphones");
    expect(events.find((e) => e.event === "cart_action")?.data).toEqual({ slug: "aurasound-pro-headphones", quantity: 2 });
    expect(events.at(-1)?.event).toBe("done");
    const search = await request(withLLM.app).get("/api/search").query({ q: "something to listen to music" }).expect(200);
    expect(search.body.engine).toBe("llm");
    await withLLM.close();
  });
});
