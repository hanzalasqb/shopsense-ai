import { Check, Minus, Plus, ShieldCheck, Sparkles, ThumbsDown, ThumbsUp, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { ProductImage, Spinner, Stars } from "../components/ui";
import { api } from "../lib/client";
import { useStore } from "../lib/store";
import type { ProductPage as Data, ReviewSummary } from "../lib/types";
import { discountPct, money } from "../lib/util";

export default function ProductPage() {
  const { slug = "" } = useParams();
  const [data, setData] = useState<Data | null>(null);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [qty, setQty] = useState(1);
  const { add, markViewed } = useStore();
  useEffect(() => {
    setData(null); setSummary(null); setQty(1);
    api.product(slug).then((d) => { setData(d); markViewed(slug); window.scrollTo(0, 0); });
    api.reviewSummary(slug).then(setSummary);
  }, [slug, markViewed]);
  if (!data) return <div className="grid h-96 place-items-center"><Spinner className="h-6 w-6 text-brand-600" /></div>;
  const { product: p, reviews, similar, boughtTogether } = data;
  const off = discountPct(p.price, p.compareAt);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm"><ProductImage src={p.image} alt={p.name} className="aspect-square w-full" /></div>
        <div>
          <div className="text-sm font-medium uppercase tracking-wider text-brand-600">{p.categoryName}</div>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">{p.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500"><Stars value={p.rating} size="h-4 w-4" /> <strong className="text-slate-800">{p.rating}</strong> · {p.reviewCount} reviews</div>
          <div className="mt-5 flex items-baseline gap-3"><span className="text-3xl font-extrabold">{money(p.price)}</span>{p.compareAt && <><span className="text-lg text-slate-400 line-through">{money(p.compareAt)}</span><span className="chip bg-rose-50 text-rose-600">Save {off}%</span></>}</div>
          <p className="mt-5 leading-relaxed text-slate-600">{p.description}</p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">{p.features.map((f) => <li key={f} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{f}</li>)}</ul>
          <div className="mt-6 text-sm">{p.stock > 10 ? <span className="text-emerald-600">● In stock</span> : p.stock > 0 ? <span className="text-amber-600">● Only {p.stock} left — order soon</span> : <span className="text-rose-600">● Out of stock</span>}</div>
          <div className="mt-4 flex gap-3">
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white">
              <button className="p-3" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></button><span className="w-8 text-center font-semibold">{qty}</span><button className="p-3" onClick={() => setQty(Math.min(10, qty + 1))}><Plus className="h-4 w-4" /></button>
            </div>
            <button disabled={p.stock === 0} onClick={() => add(p, qty)} className="btn-brand flex-1 py-3 text-base">Add to cart — {money(p.price * qty)}</button>
          </div>
          <div className="mt-5 flex gap-6 text-sm text-slate-500"><span className="flex items-center gap-1.5"><Truck className="h-4 w-4" /> Free shipping over $100</span><span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> 30-day returns</span></div>

          <div className="mt-8 rounded-2xl bg-gradient-to-br from-brand-600 to-fuchsia-500 p-[1.5px]">
            <div className="rounded-[15px] bg-white p-5">
              <div className="flex items-center gap-2 font-semibold text-slate-900"><Sparkles className="h-4 w-4 text-brand-600" /> AI review summary <span className="ml-auto text-[11px] font-normal text-slate-400">{summary ? (summary.engine === "llm" ? "LLM" : "extractive NLP") : ""}</span></div>
              {!summary ? <div className="mt-3"><Spinner className="h-4 w-4 text-brand-600" /></div> : (
                <>
                  <p className="mt-2 text-sm text-slate-600">{summary.summary}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>{summary.pros.map((x) => <div key={x} className="flex items-start gap-2 text-sm text-slate-700"><ThumbsUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />{x}</div>)}</div>
                    <div>{summary.cons.map((x) => <div key={x} className="flex items-start gap-2 text-sm text-slate-700"><ThumbsDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />{x}</div>)}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {boughtTogether.length > 0 && <section className="mt-16"><h2 className="mb-5 text-xl font-bold">Frequently bought together</h2><div className="grid grid-cols-2 gap-5 md:grid-cols-4">{boughtTogether.map((x) => <ProductCard key={x.slug} product={x} />)}</div></section>}
      <section className="mt-14"><h2 className="mb-5 text-xl font-bold">You may also like</h2><div className="grid grid-cols-2 gap-5 md:grid-cols-4">{similar.map((x) => <ProductCard key={x.slug} product={x} />)}</div></section>
      <section className="mt-14">
        <h2 className="text-xl font-bold">Customer reviews</h2>
        <p className="mb-5 text-xs text-slate-400">Sample reviews generated for this demo store.</p>
        <div className="grid gap-4 md:grid-cols-2">{reviews.map((r) => <div key={r.id} className="card p-5"><div className="flex items-center justify-between"><Stars value={r.rating} /><span className="text-xs text-slate-400">{r.author}</span></div><div className="mt-2 font-semibold">{r.title}</div><p className="mt-1 text-sm text-slate-600">{r.body}</p></div>)}</div>
      </section>
    </div>
  );
}
