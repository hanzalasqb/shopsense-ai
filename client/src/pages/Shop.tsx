import { SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { Spinner } from "../components/ui";
import { api } from "../lib/client";
import type { Category, Product, SearchResult } from "../lib/types";

const SORTS = [["relevance", "Best match"], ["rating", "Top rated"], ["price_asc", "Price: low to high"], ["price_desc", "Price: high to low"]] as const;

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [search, setSearch] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.categories().then(setCategories); }, []);
  useEffect(() => {
    setLoading(true);
    const filters = Object.fromEntries([...params.entries()].filter(([k]) => k !== "q"));
    const task = q ? api.search(q).then((r) => { setSearch(r); return r.results; }) : api.products(filters).then((r) => { setSearch(null); return r; });
    task.then(setResults).finally(() => setLoading(false));
  }, [params, q]);
  const set = (key: string, value?: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); next.delete("q"); setParams(next); };
  const i = search?.interpretation;
  const chips = i ? [i.category && `Category: ${i.category}`, i.minPrice !== undefined && `Min $${i.minPrice}`, i.maxPrice !== undefined && `Max $${i.maxPrice}`, i.sort && i.sort !== "relevance" && `Sort: ${SORTS.find((s) => s[0] === i.sort)?.[1]}`, i.keywords?.length && `Keywords: ${i.keywords.join(", ")}`].filter(Boolean) as string[] : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{q ? `Results for “${q}”` : params.get("category") ? categories.find((c) => c.slug === params.get("category"))?.name : "All products"}</h1>
        {search && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm">
            <span className="flex items-center gap-1 font-semibold text-brand-700"><Sparkles className="h-4 w-4" /> AI understood:</span>
            {chips.map((c) => <span key={c} className="chip bg-white text-slate-700 shadow-sm">{c}</span>)}
            <span className="ml-auto text-xs text-slate-500">engine: {search.engine === "llm" ? "LLM" : "NLP rules"} · {results.length} results</span>
            <button onClick={() => setParams(new URLSearchParams())} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
          </div>
        )}
      </div>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-6">
          <div className="flex items-center gap-2 font-semibold"><SlidersHorizontal className="h-4 w-4" /> Filters</div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Category</div>
            <div className="space-y-1">
              <button onClick={() => set("category")} className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${!params.get("category") && !q ? "bg-ink text-white" : "hover:bg-slate-100"}`}>All</button>
              {categories.map((c) => <button key={c.slug} onClick={() => set("category", c.slug)} className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${params.get("category") === c.slug ? "bg-ink text-white" : "hover:bg-slate-100"}`}>{c.name}</button>)}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Max price</div>
            <div className="flex flex-wrap gap-2">{["50", "100", "150", "250"].map((v) => <button key={v} onClick={() => set("maxPrice", params.get("maxPrice") === v ? undefined : v)} className={`chip border ${params.get("maxPrice") === v ? "border-ink bg-ink text-white" : "border-slate-200 bg-white"}`}>Under ${v}</button>)}</div>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Sort by</div>
            <select className="input" value={params.get("sort") ?? "relevance"} onChange={(e) => set("sort", e.target.value)}>{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </div>
        </aside>
        <div>
          {loading ? <div className="grid h-64 place-items-center"><Spinner className="h-6 w-6 text-brand-600" /></div>
            : results.length === 0 ? <div className="card p-12 text-center text-slate-500">No products match. Try a broader description.</div>
              : <div className="grid grid-cols-2 gap-5 md:grid-cols-3">{results.map((p) => <ProductCard key={p.slug} product={p} />)}</div>}
        </div>
      </div>
    </div>
  );
}
