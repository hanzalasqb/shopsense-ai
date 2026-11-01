import { RotateCcw, Search, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { ProductImage } from "../components/ui";
import { api } from "../lib/client";
import { useStore } from "../lib/store";
import type { Category, Product } from "../lib/types";

const EXAMPLES = ["running shoes under $150", "gift for a coffee lover", "cozy living room decor", "best rated headphones"];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [forYou, setForYou] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const { viewed } = useStore();
  const navigate = useNavigate();
  useEffect(() => { api.products({ sort: "rating" }).then(setProducts); api.categories().then(setCategories); }, []);
  useEffect(() => { api.recommendations(viewed).then(setForYou); }, [viewed]);
  const go = (query: string) => navigate(`/shop?q=${encodeURIComponent(query)}`);
  const submit = (e: FormEvent) => { e.preventDefault(); if (q.trim()) go(q.trim()); };
  const hero = ["aurasound-pro-headphones", "classic-leather-jacket", "monstera-deliciosa-plant"].map((s) => products.find((p) => p.slug === s)).filter(Boolean) as Product[];

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-fuchsia-50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="chip bg-white text-brand-700 shadow-sm"><Sparkles className="h-3.5 w-3.5" /> AI-powered shopping</span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 md:text-6xl">Shopping that <span className="bg-gradient-to-r from-brand-600 to-fuchsia-500 bg-clip-text text-transparent">understands you.</span></h1>
            <p className="mt-5 max-w-lg text-lg text-slate-600">Describe what you need in plain words. Our AI turns it into the perfect results, compares options and fills your cart.</p>
            <form onSubmit={submit} className="mt-8 flex max-w-xl gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-brand-500/10">
              <Search className="ml-2 h-5 w-5 self-center text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 bg-transparent px-2 text-base outline-none" placeholder="e.g. waterproof speaker for the beach under $100" />
              <button className="btn-brand">Search</button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">{EXAMPLES.map((e) => <button key={e} onClick={() => go(e)} className="chip border border-slate-200 bg-white text-slate-600 hover:border-brand-500 hover:text-brand-700">{e}</button>)}</div>
          </div>
          <div className="relative hidden h-[440px] lg:block">
            {hero.map((p, i) => (
              <Link key={p.slug} to={`/product/${p.slug}`} className={`absolute w-60 overflow-hidden rounded-3xl bg-white shadow-2xl transition hover:-translate-y-1 ${["top-0 left-6 rotate-[-4deg]", "top-24 right-0 rotate-[3deg]", "bottom-0 left-28 rotate-[-1deg]"][i]}`}>
                <ProductImage src={p.image} alt={p.name} className="h-48 w-full" />
                <div className="p-3"><div className="text-sm font-semibold">{p.name}</div><div className="text-sm text-brand-600">${p.price}</div></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => {
            const cover = products.find((p) => p.category === c.slug);
            return (
              <Link key={c.slug} to={`/shop?category=${c.slug}`} className="group relative h-44 overflow-hidden rounded-2xl">
                {cover && <ProductImage src={cover.image} alt={c.name} className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-slate-900/10" />
                <div className="absolute bottom-4 left-4 text-white"><div className="text-lg font-bold">{c.name}</div><div className="text-sm text-white/80">{c.tagline}</div></div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="mb-6 flex items-end justify-between"><div><h2 className="text-2xl font-bold text-slate-900">{viewed.length ? "Picked for you" : "Trending now"}</h2><p className="text-sm text-slate-500">{viewed.length ? "Based on what you've been browsing" : "Top-rated by our customers"}</p></div><Link to="/shop" className="text-sm font-semibold text-brand-600">View all →</Link></div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">{forYou.slice(0, 8).map((p) => <ProductCard key={p.slug} product={p} />)}</div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3">
          {[[Truck, "Free shipping over $100", "Fast delivery on every order"], [RotateCcw, "30-day returns", "Changed your mind? No problem"], [ShieldCheck, "Secure checkout", "Server-side pricing & validation"]].map(([Icon, t, s]) => {
            const I = Icon as typeof Truck;
            return <div key={t as string} className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><I className="h-6 w-6" /></div><div><div className="font-semibold">{t as string}</div><div className="text-sm text-slate-500">{s as string}</div></div></div>;
          })}
        </div>
      </section>
    </div>
  );
}
