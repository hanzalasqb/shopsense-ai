// Server-authoritative pricing rules (the browser only displays them).
export const FREE_SHIPPING_OVER = 100;
export const SHIPPING_FEE = 7.99;
export const TAX_RATE = 0.08;
export const DISCOUNT_CODES: Record<string, { percent: number; minSubtotal?: number; label: string }> = {
  WELCOME10: { percent: 10, label: "10% off your first order" },
  AI20: { percent: 20, minSubtotal: 150, label: "20% off orders over $150" },
};

const round = (n: number) => Math.round(n * 100) / 100;

export interface Totals { subtotal: number; discount: number; shipping: number; tax: number; total: number; code?: string; codeError?: string }

export function computeTotals(lines: { price: number; quantity: number }[], code?: string): Totals {
  const subtotal = round(lines.reduce((n, l) => n + l.price * l.quantity, 0));
  let discount = 0, codeError: string | undefined, applied: string | undefined;
  if (code) {
    const rule = DISCOUNT_CODES[code.trim().toUpperCase()];
    if (!rule) codeError = "Invalid discount code";
    else if (rule.minSubtotal && subtotal < rule.minSubtotal) codeError = `Requires a subtotal of $${rule.minSubtotal}`;
    else { discount = round((subtotal * rule.percent) / 100); applied = code.trim().toUpperCase(); }
  }
  const afterDiscount = subtotal - discount;
  const shipping = subtotal === 0 || afterDiscount >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
  const tax = round(afterDiscount * TAX_RATE);
  return { subtotal, discount, shipping, tax, total: round(afterDiscount + shipping + tax), code: applied, codeError };
}
