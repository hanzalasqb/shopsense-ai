import { CheckCircle2, CreditCard, Lock, Tag, Wallet } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ProductImage, Spinner } from "../components/ui";
import { api } from "../lib/client";
import { useStore } from "../lib/store";
import type { Order, Quote } from "../lib/types";
import { money } from "../lib/util";

export default function Checkout() {
  const { cart, clear } = useStore();
  const [form, setForm] = useState({ name: "", email: "", address: "", paymentMethod: "card" as "card" | "cod" });
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<string>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const items = cart.map((l) => ({ slug: l.product.slug, quantity: l.quantity }));

  useEffect(() => { if (items.length) api.quote(items, applied).then(setQuote).catch((e) => setError(e.message)); }, [JSON.stringify(items), applied]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try { const o = await api.placeOrder({ ...form, discountCode: quote?.totals.code, items }); setOrder(o); clear(); }
    catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }

  if (order) return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
      <h1 className="mt-4 text-3xl font-bold">Thank you, {order.name.split(" ")[0]}!</h1>
      <p className="mt-2 text-slate-600">Order <strong className="font-mono">{order.number}</strong> is confirmed. A receipt was sent to {order.email}.</p>
      <div className="card mt-8 p-6 text-left">
        {order.items.map((i) => <div key={i.name} className="flex justify-between py-1 text-sm"><span>{i.quantity} × {i.name}</span><span>{money(i.unitPrice * i.quantity)}</span></div>)}
        <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-bold"><span>Total</span><span>{money(order.total)}</span></div>
      </div>
      <Link to={`/track?number=${order.number}&email=${encodeURIComponent(order.email)}`} className="btn-primary mt-6">Track your order</Link>
    </div>
  );
  if (!cart.length) return <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-2xl font-bold">Your cart is empty</h1><Link to="/shop" className="btn-brand mt-6">Continue shopping</Link></div>;
  const t = quote?.totals;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_400px]">
      <form onSubmit={submit} className="space-y-6">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <div className="card space-y-4 p-6">
          <h2 className="font-semibold">Contact & shipping</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input className="input" placeholder="Full name" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input" type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <textarea className="input" rows={2} placeholder="Shipping address" required minLength={5} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="card space-y-3 p-6">
          <h2 className="font-semibold">Payment</h2>
          {([["card", CreditCard, "Card", "Stripe-ready integration point — no real charge in this demo"], ["cod", Wallet, "Cash on delivery", "Pay when your order arrives"]] as const).map(([value, Icon, label, hint]) => (
            <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${form.paymentMethod === value ? "border-brand-500 bg-brand-50/50" : "border-slate-200"}`}>
              <input type="radio" name="pm" checked={form.paymentMethod === value} onChange={() => setForm({ ...form, paymentMethod: value })} className="accent-brand-600" />
              <Icon className="h-5 w-5 text-slate-500" /><div><div className="font-medium">{label}</div><div className="text-xs text-slate-500">{hint}</div></div>
            </label>
          ))}
        </div>
        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        <button disabled={busy} className="btn-brand w-full py-3.5 text-base">{busy ? <Spinner /> : <Lock className="h-4 w-4" />} Place order {t && `· ${money(t.total)}`}</button>
      </form>
      <aside className="card h-fit space-y-4 p-6">
        <h2 className="font-semibold">Order summary</h2>
        {cart.map((l) => <div key={l.product.slug} className="flex items-center gap-3"><ProductImage src={l.product.image} alt={l.product.name} className="h-14 w-14 rounded-lg" /><div className="flex-1 text-sm"><div className="font-medium">{l.product.name}</div><div className="text-slate-500">Qty {l.quantity}</div></div><div className="text-sm font-semibold">{money(l.product.price * l.quantity)}</div></div>)}
        <div className="flex gap-2">
          <div className="relative flex-1"><Tag className="absolute top-3 left-3 h-4 w-4 text-slate-400" /><input className="input pl-9 uppercase" placeholder="Discount code" value={code} onChange={(e) => setCode(e.target.value)} /></div>
          <button type="button" className="btn-ghost" onClick={() => setApplied(code || undefined)}>Apply</button>
        </div>
        <p className="text-xs text-slate-400">Try <code>WELCOME10</code> or <code>AI20</code> (orders over $150)</p>
        {t?.codeError && <p className="text-sm text-rose-600">{t.codeError}</p>}
        {t && (
          <div className="space-y-1.5 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(t.subtotal)}</span></div>
            {t.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount ({t.code})</span><span>−{money(t.discount)}</span></div>}
            <div className="flex justify-between"><span>Shipping</span><span>{t.shipping ? money(t.shipping) : "Free"}</span></div>
            <div className="flex justify-between"><span>Tax (8%)</span><span>{money(t.tax)}</span></div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold"><span>Total</span><span>{money(t.total)}</span></div>
          </div>
        )}
      </aside>
    </div>
  );
}
