import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "./types";

export interface CartLine { product: Product; quantity: number }
interface Store {
  cart: CartLine[]; cartOpen: boolean; setCartOpen: (o: boolean) => void;
  add: (p: Product, qty?: number) => void; setQty: (slug: string, qty: number) => void; clear: () => void;
  count: number; subtotal: number; viewed: string[]; markViewed: (slug: string) => void;
}
const Ctx = createContext<Store | null>(null);
const load = <T,>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; } };
const save = (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>(() => load("shopsense.cart", []));
  const [viewed, setViewed] = useState<string[]>(() => load("shopsense.viewed", []));
  const [cartOpen, setCartOpen] = useState(false);
  useEffect(() => save("shopsense.cart", cart), [cart]);
  useEffect(() => save("shopsense.viewed", viewed), [viewed]);

  const add = useCallback((product: Product, qty = 1) => {
    setCart((c) => {
      const existing = c.find((l) => l.product.slug === product.slug);
      return existing ? c.map((l) => (l === existing ? { ...l, quantity: Math.min(10, l.quantity + qty) } : l)) : [...c, { product, quantity: qty }];
    });
    setCartOpen(true);
  }, []);
  const setQty = useCallback((slug: string, qty: number) => setCart((c) => (qty <= 0 ? c.filter((l) => l.product.slug !== slug) : c.map((l) => (l.product.slug === slug ? { ...l, quantity: Math.min(10, qty) } : l)))), []);
  const markViewed = useCallback((slug: string) => setViewed((v) => [...v.filter((s) => s !== slug), slug].slice(-10)), []);

  const value = useMemo(() => ({
    cart, cartOpen, setCartOpen, add, setQty, clear: () => setCart([]), viewed, markViewed,
    count: cart.reduce((n, l) => n + l.quantity, 0), subtotal: cart.reduce((n, l) => n + l.quantity * l.product.price, 0),
  }), [cart, cartOpen, add, setQty, viewed, markViewed]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}
