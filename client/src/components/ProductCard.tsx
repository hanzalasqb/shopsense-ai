import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import type { Product } from "../lib/types";
import { discountPct, money } from "../lib/util";
import { ProductImage, Stars } from "./ui";

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useStore();
  const off = discountPct(product.price, product.compareAt);
  return (
    <div className="group card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-slate-100">
        <ProductImage src={product.image} alt={product.name} className="h-full w-full transition duration-500 group-hover:scale-105" />
        {off > 0 && <span className="chip absolute top-3 left-3 bg-rose-500 text-white">-{off}%</span>}
        {product.stock < 10 && <span className="chip absolute top-3 right-3 bg-white/90 text-amber-700">Only {product.stock} left</span>}
      </Link>
      <div className="p-4">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{product.categoryName}</div>
        <Link to={`/product/${product.slug}`} className="mt-1 line-clamp-1 font-semibold text-slate-900 hover:text-brand-600">{product.name}</Link>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Stars value={product.rating} /> {product.rating} ({product.reviewCount})</div>
        <div className="mt-3 flex items-center justify-between">
          <div><span className="text-lg font-bold text-slate-900">{money(product.price)}</span>{product.compareAt && <span className="ml-2 text-sm text-slate-400 line-through">{money(product.compareAt)}</span>}</div>
          <button onClick={() => add(product)} className="grid h-9 w-9 place-items-center rounded-full bg-ink text-white transition hover:bg-brand-600" title="Add to cart"><Plus className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
