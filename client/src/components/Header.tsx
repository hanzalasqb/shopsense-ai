import { Search, ShoppingBag, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { api } from "../lib/client";
import { useStore } from "../lib/store";

export default function Header() {
  const { count, setCartOpen } = useStore();
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const submit = (e: FormEvent) => { e.preventDefault(); if (q.trim()) navigate(`/shop?q=${encodeURIComponent(q.trim())}`); };
  const link = ({ isActive }: { isActive: boolean }) => `text-sm font-medium ${isActive ? "text-brand-600" : "text-slate-600 hover:text-slate-900"}`;
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      {api.demo && <div className="bg-ink px-4 py-1.5 text-center text-xs text-slate-200">✨ Live demo with sample products — AI search & assistant run in your browser. No real payments are taken.</div>}
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-fuchsia-500 text-white"><Sparkles className="h-5 w-5" /></span>
          <span className="text-lg font-bold tracking-tight text-slate-900">Shop<span className="text-brand-600">Sense</span></span>
        </Link>
        <form onSubmit={submit} className="relative hidden flex-1 md:block">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input rounded-full bg-slate-50 pl-10" placeholder="Ask anything — e.g. “waterproof gear for hiking under $150”" />
        </form>
        <nav className="ml-auto flex items-center gap-5">
          <NavLink to="/shop" className={link}>Shop</NavLink>
          <NavLink to="/track" className={link}>Track order</NavLink>
          <NavLink to="/admin" className={link}>Admin</NavLink>
          <button onClick={() => setCartOpen(true)} className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white hover:bg-slate-50" title="Cart">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">{count}</span>}
          </button>
        </nav>
      </div>
    </header>
  );
}
