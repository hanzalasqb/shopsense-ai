import { createApp } from "../src/app";
import { createDatabase } from "../src/db/client";
import type { LLM, LLMEvent } from "../src/lib/llm";
import { seed } from "../src/services/seed";

export const noLLM: LLM = { enabled: false, json: async () => ({}), async *stream() {} };

/** Scripted LLM: understands queries via JSON mode and calls search_products, then add_to_cart. */
export function fakeLLM(): LLM & { calls: unknown[][] } {
  const calls: unknown[][] = [];
  return {
    enabled: true, calls,
    json: async (system) => system.includes("search filters") ? { keywords: ["headphones"], category: "electronics", maxPrice: null, minPrice: null, sort: null } : { summary: "Great sound.", pros: ["battery"], cons: ["price"], sentiment: "positive" },
    async *stream(messages): AsyncIterable<LLMEvent> {
      calls.push(messages);
      const toolMsgs = messages.filter((m) => (m as { role: string }).role === "tool");
      if (toolMsgs.length === 0) yield { type: "tool_calls", calls: [{ id: "c1", name: "search_products", arguments: '{"query":"noise cancelling headphones"}' }] };
      else if (toolMsgs.length === 1) yield { type: "tool_calls", calls: [{ id: "c2", name: "add_to_cart", arguments: '{"slug":"aurasound-pro-headphones","quantity":2}' }] };
      else yield { type: "token", text: "Added the **AuraSound Pro** to your cart." };
    },
  };
}

export async function makeApp(llm: LLM = noLLM) {
  const { db, close } = await createDatabase("memory://");
  await seed(db);
  return { app: createApp(db, llm), db, close };
}
