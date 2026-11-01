import { AlertTriangle, BarChart3, DollarSign, Lightbulb, Package, ShoppingCart, Sparkles, TrendingUp, Wand2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Spinner } from "../components/ui";
import { api, token } from "../lib/client";
import type { Analytics, GeneratedCopy } from "../lib/types";
import { money } from "../lib/util";

const COLORS = ["#7c3aed", "#d946ef", "#0ea5e9", "#10b981"];

function Login({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ email: "admin@shopsense.local", password: "" });
  const [error, setError] = useState<string | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    try { const r = await api.login(form.email, form.password); if (r.user.role !== "admin") throw new Error("Admin access required"); token.set(r.token); onDone(); }
    catch (err) { setError((err as Error).message); }
  }
  return (
    <form onSubmit={submit} className="card mx-auto mt-20 max-w-sm space-y-3 p-8">
      <h1 className="text-xl font-bold">Admin sign in</h1>
      <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button className="btn-primary w-full">Sign in</button>
    </form>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(api.demo || !!token.get());
  const [data, setData] = useState<Analytics | null>(null);
  const [copyForm, setCopyForm] = useState({ name: "Bamboo Desk Organizer", category: "home", features: "Sustainable bamboo\n5 compartments\nNon-slip base", tone: "friendly" });
  const [copy, setCopy] = useState<GeneratedCopy | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (authed) api.analytics().then(setData).catch(() => { token.set(null); setAuthed(false); }); }, [authed]);
  if (!authed) return <Login onDone={() => setAuthed(true)} />;
  if (!data) return <div className="grid h-96 place-items-center"><Spinner className="h-6 w-6 text-brand-600" /></div>;
  const k = data.kpis;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex items-end justify-between"><div><h1 className="text-3xl font-bold">Store dashboard</h1><p className="text-slate-500">Last 30 days</p></div><span className="chip bg-brand-50 text-brand-700"><BarChart3 className="h-3.5 w-3.5" /> Live analytics</span></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[[DollarSign, "Revenue", money(k.revenue)], [ShoppingCart, "Orders", k.orders], [Package, "Avg. order value", money(k.aov)], [TrendingUp, "Growth", `${k.growth > 0 ? "+" : ""}${k.growth}%`]].map(([Icon, label, value]) => {
          const I = Icon as typeof DollarSign;
          return <div key={label as string} className="card flex items-center gap-4 p-5"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><I className="h-6 w-6" /></div><div><div className="text-sm text-slate-500">{label as string}</div><div className="text-2xl font-bold">{value as string}</div></div></div>;
        })}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Revenue</h2>
          <div className="h-64"><ResponsiveContainer><AreaChart data={data.daily}><defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} /><stop offset="100%" stopColor="#7c3aed" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#f1f5f9" vertical={false} /><XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={45} /><Tooltip formatter={(v) => money(Number(v))} /><Area dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} fill="url(#rev)" /></AreaChart></ResponsiveContainer></div>
        </div>
        <div className="card p-6">
          <h2 className="mb-2 font-semibold">Sales by category</h2>
          <div className="h-48"><ResponsiveContainer><PieChart><Pie data={data.byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>{data.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v) => money(Number(v))} /></PieChart></ResponsiveContainer></div>
          <div className="grid grid-cols-2 gap-1 text-xs">{data.byCategory.map((c, i) => <div key={c.name} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{c.name}</div>)}</div>
        </div>
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Top products</h2>
          <div className="h-56"><ResponsiveContainer><BarChart data={data.top} layout="vertical" margin={{ left: 20 }}><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} /><Tooltip formatter={(v) => money(Number(v))} /><Bar dataKey="revenue" fill="#7c3aed" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
        <div className="card space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4 text-amber-500" /> AI insights</h2>
          {data.insights.map((i) => <p key={i} className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{i}</p>)}
          <h3 className="flex items-center gap-2 pt-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-rose-500" /> Low stock</h3>
          {data.lowStock.slice(0, 4).map((p) => <div key={p.slug} className="flex justify-between text-sm"><span>{p.name}</span><span className="font-semibold text-rose-600">{p.stock} left</span></div>)}
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form className="card space-y-3 p-6" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setCopy(await api.generateDescription({ ...copyForm, features: copyForm.features.split("\n").filter(Boolean) })); setBusy(false); }}>
          <h2 className="flex items-center gap-2 font-semibold"><Wand2 className="h-4 w-4 text-brand-600" /> AI product copywriter</h2>
          <div className="grid gap-3 sm:grid-cols-2"><input className="input" value={copyForm.name} onChange={(e) => setCopyForm({ ...copyForm, name: e.target.value })} /><select className="input" value={copyForm.tone} onChange={(e) => setCopyForm({ ...copyForm, tone: e.target.value })}><option value="friendly">Friendly</option><option value="premium">Premium</option><option value="technical">Technical</option></select></div>
          <textarea className="input" rows={3} value={copyForm.features} onChange={(e) => setCopyForm({ ...copyForm, features: e.target.value })} />
          <button className="btn-brand">{busy ? <Spinner /> : <Sparkles className="h-4 w-4" />} Generate description</button>
          {copy && <div className="rounded-xl bg-slate-50 p-4 text-sm"><p>{copy.description}</p><ul className="mt-2 list-disc pl-5 text-slate-600">{copy.bullets.map((b) => <li key={b}>{b}</li>)}</ul><div className="mt-2 flex flex-wrap gap-1">{copy.seoKeywords.map((s) => <span key={s} className="chip bg-white text-slate-500">#{s}</span>)}</div></div>}
        </form>
        <div className="card p-6">
          <h2 className="mb-3 font-semibold">Recent orders</h2>
          <table className="w-full text-sm"><tbody>{data.recent.map((o) => <tr key={o.number} className="border-b border-slate-100 last:border-0"><td className="py-2 font-mono text-xs">{o.number}</td><td className="py-2 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td><td className="py-2"><span className="chip bg-slate-100 capitalize text-slate-600">{o.status}</span></td><td className="py-2 text-right font-semibold">{money(o.total)}</td></tr>)}</tbody></table>
        </div>
      </div>
    </div>
  );
}
