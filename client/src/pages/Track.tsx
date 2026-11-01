import { CheckCircle2, Circle, PackageSearch } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Spinner } from "../components/ui";
import { api } from "../lib/client";
import type { Order } from "../lib/types";
import { money } from "../lib/util";

const STEPS = ["pending", "paid", "shipped", "delivered"];

export default function Track() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({ number: params.get("number") ?? "", email: params.get("email") ?? "" });
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function lookup(e?: FormEvent) {
    e?.preventDefault(); setBusy(true); setError(null);
    try { setOrder(await api.track(form.number, form.email)); } catch (err) { setError((err as Error).message); setOrder(null); } finally { setBusy(false); }
  }
  useEffect(() => { if (form.number && form.email) lookup(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const step = order ? STEPS.indexOf(order.status) : -1;
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="text-center"><PackageSearch className="mx-auto h-12 w-12 text-brand-600" /><h1 className="mt-3 text-3xl font-bold">Track your order</h1></div>
      <form onSubmit={lookup} className="card mt-8 grid gap-3 p-6 sm:grid-cols-[1fr_1fr_auto]">
        <input className="input font-mono uppercase" placeholder="Order number" required value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
        <input className="input" type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <button className="btn-primary">{busy ? <Spinner /> : "Track"}</button>
      </form>
      {error && <p className="mt-4 text-center text-sm text-rose-600">{error}</p>}
      {order && (
        <div className="card mt-6 p-6">
          <div className="flex justify-between"><span className="font-mono font-semibold">{order.number}</span><span className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</span></div>
          <div className="mt-6 flex items-center">
            {STEPS.slice(1).map((s, i) => (
              <div key={s} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1 text-xs capitalize">{i + 1 <= step ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <Circle className="h-6 w-6 text-slate-300" />}{s}</div>
                {i < 2 && <div className={`mx-2 h-0.5 flex-1 ${i + 2 <= step ? "bg-emerald-500" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-1 border-t border-slate-100 pt-4 text-sm">
            {order.items.map((i) => <div key={i.name} className="flex justify-between"><span>{i.quantity} × {i.name}</span><span>{money(i.unitPrice * i.quantity)}</span></div>)}
            <div className="flex justify-between pt-2 font-bold"><span>Total</span><span>{money(order.total)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
