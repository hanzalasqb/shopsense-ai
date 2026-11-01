import { Router, type Response } from "express";
import { z } from "zod";
import { ruleAssistant, type AssistantProduct } from "../../../shared/assistant";
import { rank } from "../../../shared/search";
import type { DB } from "../db/client";
import type { LLM } from "../lib/llm";
import { understandQuery } from "../services/ai";
import { loadCatalog, type ProductDTO } from "../services/catalog";
import { findOrder } from "../services/orders";

const Body = z.object({ message: z.string().min(1).max(2000), history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(16).default([]), lastShown: z.array(z.string()).max(8).default([]) });

const TOOLS = [
  { type: "function", function: { name: "search_products", description: "Search the catalog with a natural-language query (price limits and categories are understood).", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
  { type: "function", function: { name: "get_product", description: "Full details, stock and features of one product.", parameters: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } } },
  { type: "function", function: { name: "add_to_cart", description: "Add a product to the shopper's cart.", parameters: { type: "object", properties: { slug: { type: "string" }, quantity: { type: "integer", minimum: 1, maximum: 10 } }, required: ["slug"] } } },
  { type: "function", function: { name: "track_order", description: "Look up an order by number and email.", parameters: { type: "object", properties: { number: { type: "string" }, email: { type: "string" } }, required: ["number", "email"] } } },
];
const SYSTEM = `You are ShopSense, a friendly shopping assistant for an online store.
- Use search_products to find items; never invent products, prices or stock.
- Recommend at most 4 products, explain briefly why each fits, use markdown.
- Only call add_to_cart when the shopper explicitly asks to add/buy something.
- Stay on the topic of shopping in this store.`;

const brief = (p: ProductDTO) => ({ slug: p.slug, name: p.name, price: p.price, compareAt: p.compareAt, rating: p.rating, stock: p.stock, category: p.category, image: p.image });
const send = (res: Response, event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

export function assistantRoutes(db: DB, llm: LLM) {
  const r = Router();
  r.post("/stream", async (req, res) => {
    const body = Body.parse(req.body);
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" });
    const catalog = await loadCatalog(db);
    try {
      if (!llm.enabled) {
        // deterministic fallback so the store works without an API key
        const reply = ruleAssistant(body.message, catalog as AssistantProduct[], body.lastShown);
        send(res, "tool_call", { name: reply.tool.name, args: reply.tool.args });
        send(res, "tool_result", { name: reply.tool.name, summary: reply.tool.summary });
        if (reply.products.length) send(res, "products", { products: reply.products.map((p) => brief(p as ProductDTO)) });
        if (reply.cartAction) send(res, "cart_action", reply.cartAction);
        send(res, "token", { text: reply.text });
      } else {
        const messages: unknown[] = [{ role: "system", content: SYSTEM }, ...body.history, { role: "user", content: body.message }];
        for (let round = 0; round < 4; round++) {
          let calls: { id: string; name: string; arguments: string }[] = [];
          for await (const ev of llm.stream(messages, round < 3 ? TOOLS : undefined)) {
            if (ev.type === "token") send(res, "token", { text: ev.text });
            else calls = ev.calls;
          }
          if (!calls.length) break;
          messages.push({ role: "assistant", content: "", tool_calls: calls.map((c) => ({ id: c.id, type: "function", function: { name: c.name, arguments: c.arguments || "{}" } })) });
          for (const call of calls) {
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(call.arguments || "{}"); } catch { /* ignore */ }
            send(res, "tool_call", { name: call.name, args });
            let result: unknown;
            if (call.name === "search_products") {
              const { filters } = await understandQuery(llm, String(args.query ?? ""));
              const found = rank(catalog, filters).slice(0, 5).map((x) => brief(x.product));
              send(res, "products", { products: found });
              result = { results: found };
            } else if (call.name === "get_product") {
              const p = catalog.find((x) => x.slug === args.slug);
              result = p ? { ...brief(p), description: p.description, features: p.features } : { error: "not found" };
            } else if (call.name === "add_to_cart") {
              const p = catalog.find((x) => x.slug === args.slug);
              const quantity = Math.min(Math.max(Number(args.quantity ?? 1), 1), 10);
              if (p) send(res, "cart_action", { slug: p.slug, quantity });
              result = p ? { added: p.name, quantity } : { error: "not found" };
            } else if (call.name === "track_order") {
              const o = await findOrder(db, String(args.number ?? ""), String(args.email ?? ""));
              result = o ? { number: o.number, status: o.status, total: o.total, items: o.items.map((i) => `${i.quantity} × ${i.name}`) } : { error: "No matching order" };
            } else result = { error: "unknown tool" };
            send(res, "tool_result", { name: call.name, summary: JSON.stringify(result).slice(0, 120) });
            messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result).slice(0, 6000) });
          }
        }
      }
    } catch (err) {
      console.error(err);
      send(res, "error", { message: "The assistant is unavailable right now." });
    }
    send(res, "done", {});
    res.end();
  });
  return r;
}
