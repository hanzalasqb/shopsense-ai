import { ImageOff, LoaderCircle, Star } from "lucide-react";
import { useState } from "react";
import { imageUrl } from "../lib/util";

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return <LoaderCircle className={`animate-spin ${className}`} />;
}

export function Stars({ value, size = "h-3.5 w-3.5" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`${size} ${i <= Math.round(value) ? "fill-current" : "text-slate-200"}`} />)}
    </span>
  );
}

export function ProductImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className={`grid place-items-center bg-gradient-to-br from-brand-100 to-fuchsia-100 text-brand-500 ${className}`}><ImageOff className="h-8 w-8" /></div>;
  return <img src={imageUrl(src)} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}
