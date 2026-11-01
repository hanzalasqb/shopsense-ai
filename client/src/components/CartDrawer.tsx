import { Minus, Plus, ShoppingBag, Truck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FREE_SHIPPING_OVER } from "../../../shared/pricing";
import { useStore } from "../lib/store";
import { money } from "../lib/util";
import { ProductImage } from "./ui";

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQty, subtotal } = useStore();
  const navigate = useNavigate();
  if (!cartOpen) return null;
  const remaining = Math.max(0, FREE_SHIPPING_OVER - subtotal);
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
      <aside className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><ShoppingBag className="h-5 w-5" /> Your cart</h2>
          <button onClick={() => setCartOpen(false)} className="rounded-full p-1.5 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        {cart.length > 0 && (
          <div className="border-b border-slate-100 px-6 py-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600"><Truck className="h-4 w-4 text-brand-600" />{remaining > 0 ? <>Add <strong>{money(remaining)}</strong> more for free shipping</> : <strong className="text-emerald-600">You've unlocked free shipping!</strong>}</div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-gradient-to-r from-brand-600 to-fuchsia-500" style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_OVER) * 100)}%` }} /></div>
          </div>
        )}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {cart.length === 0 && <p className="py-16 text-center text-slate-500">Your cart is empty.</p>}
          {cart.map(({ product, quantity }) => (
            <div key={product.slug} className="flex gap-4">
              <ProductImage src={product.image} alt={product.name} className="h-20 w-20 shrink-0 rounded-xl" />
              <div className="flex-1">
                <div className="font-medium text-slate-900">{product.name}</div>
                <div className="text-sm text-slate-500">{money(product.price)}</div>
                <div className="mt-2 inline-flex items-center rounded-full border border-slate-200">
                  <button className="p-1.5" onClick={() => setQty(product.slug, quantity - 1)}><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-6 text-center text-sm">{quantity}</span>
                  <button className="p-1.5" onClick={() => setQty(product.slug, quantity + 1)}><Plus className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="font-semibold">{money(product.price * quantity)}</div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-5">
            <div className="mb-4 flex justify-between text-base"><span>Subtotal</span><span className="font-bold">{money(subtotal)}</span></div>
            <button className="btn-brand w-full py-3" onClick={() => { setCartOpen(false); navigate("/checkout"); }}>Checkout securely</button>
            <p className="mt-2 text-center text-xs text-slate-400">Taxes and discounts are calculated at checkout.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
