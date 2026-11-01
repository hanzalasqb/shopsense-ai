import { Bot, MessageCircle, Plus, SendHorizontal, Sparkles, Wrench, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/client";
import { useStore } from "../lib/store";
import type { Product } from "../lib/types";
import { money } from "../lib/util";
import Markdown from "./Markdown";
import { ProductImage, Spinner } from "./ui";

interface Msg { role: "user" | "assistant"; content: string; tools?: string[]; products?: Product[] }
const SUGGESTIONS = ["A gift for a coffee lover under $60", "Waterproof gear for a hiking trip", "Compare the smartwatch vs the analog watch", "Add the yoga mat to my cart"];

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const { add } = useStore();
  const bottom = useRef<HTMLDivElement>(null);
  const seen = useRef(new Map<string, Product>());
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const history = messages.map(({ role, content }) => ({ role, content }));
    const lastShown = [...messages].reverse().find((m) => m.products?.length)?.products?.map((p) => p.slug) ?? [];
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "", tools: [] }]);
    setInput(""); setBusy(true);
    const patch = (fn: (m: Msg) => Msg) => setMessages((all) => [...all.slice(0, -1), fn(all[all.length - 1])]);
    try {
      await api.assistant(text, history, lastShown, (e) => {
        if (e.type === "token") patch((m) => ({ ...m, content: m.content + e.text }));
        else if (e.type === "tool_call") patch((m) => ({ ...m, tools: [...(m.tools ?? []), e.name] }));
        else if (e.type === "products") { e.products.forEach((p) => seen.current.set(p.slug, p)); patch((m) => ({ ...m, products: e.products })); }
        else if (e.type === "cart_action") {
          const product = seen.current.get(e.slug);
          if (product) add(product, e.quantity);
          else api.product(e.slug).then((p) => add(p.product, e.quantity));
        } else if (e.type === "error") patch((m) => ({ ...m, content: e.message }));
      });
    } catch (err) {
      patch((m) => ({ ...m, content: (err as Error).message }));
    } finally { setBusy(false); }
  }

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} className="fixed right-6 bottom-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-fuchsia-500 px-5 py-3.5 font-semibold text-white shadow-2xl shadow-brand-500/40 transition hover:scale-105">
          <MessageCircle className="h-5 w-5" /> Ask AI shopper
        </button>
      )}
      {open && (
        <div className="fixed right-6 bottom-6 z-40 flex h-[600px] max-h-[calc(100vh-3rem)] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center gap-3 bg-gradient-to-r from-brand-600 to-fuchsia-500 px-5 py-4 text-white">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20"><Bot className="h-5 w-5" /></div>
            <div className="flex-1"><div className="font-semibold">ShopSense Assistant</div><div className="text-xs text-white/80">Finds products, compares and adds to cart</div></div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-white/20"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Hi! Tell me what you're looking for — budget, occasion, style — and I'll find the best matches.</p>
                {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-brand-500"><Sparkles className="h-4 w-4 shrink-0 text-brand-500" />{s}</button>)}
              </div>
            )}
            {messages.map((m, i) => m.role === "user" ? (
              <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-ink px-3.5 py-2 text-sm text-white">{m.content}</div>
            ) : (
              <div key={i} className="max-w-[95%] space-y-2">
                {m.tools?.map((t, j) => <div key={j} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700"><Wrench className="h-3 w-3" />{t}</div>)}
                {m.products && m.products.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {m.products.map((p) => (
                      <div key={p.slug} className="w-36 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <Link to={`/product/${p.slug}`}><ProductImage src={p.image} alt={p.name} className="h-24 w-full" /></Link>
                        <div className="p-2">
                          <div className="line-clamp-1 text-xs font-medium">{p.name}</div>
                          <div className="mt-1 flex items-center justify-between"><span className="text-sm font-bold">{money(p.price)}</span>
                            <button onClick={() => add(p)} className="grid h-6 w-6 place-items-center rounded-full bg-ink text-white hover:bg-brand-600"><Plus className="h-3.5 w-3.5" /></button></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {m.content ? <div className="rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 shadow-sm"><Markdown>{m.content}</Markdown></div> : busy && i === messages.length - 1 && <Spinner className="h-4 w-4 text-slate-400" />}
              </div>
            ))}
            <div ref={bottom} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t border-slate-100 p-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} className="input rounded-full" placeholder="Ask about products…" />
            <button disabled={busy || !input.trim()} className="btn-brand h-10 w-10 shrink-0 rounded-full p-0"><SendHorizontal className="h-4 w-4" /></button>
          </form>
        </div>
      )}
    </>
  );
}
