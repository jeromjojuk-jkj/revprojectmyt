"use client";

import { useEffect, useState } from "react";
import type { ProductPublic } from "@/lib/types";
import { useHydrated, useStore } from "@/lib/store";
import { ProductRail } from "./ProductCard";
import { Section } from "./Section";

export function useProductsByIds(ids: string[]) {
  const [products, setProducts] = useState<ProductPublic[] | null>(null);
  const key = ids.join(",");
  useEffect(() => {
    if (!key) {
      setProducts([]);
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/products?ids=${encodeURIComponent(key)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: { products: ProductPublic[] }) => {
        const order = key.split(",");
        setProducts(d.products.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)));
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [key]);
  return products;
}

export function RecentlyViewed({ excludeId, title = "Recently viewed" }: { excludeId?: string; title?: string }) {
  const hydrated = useHydrated();
  const ids = useStore((s) => s.recentlyViewed);
  const list = hydrated ? ids.filter((i) => i !== excludeId).slice(0, 12) : [];
  const products = useProductsByIds(list);
  const clear = useStore((s) => s.clearViewed);
  if (!products || products.length === 0) return null;
  return (
    <Section id="recent" title={title} kicker="Pick up where you left off">
      <ProductRail products={products} />
      <button type="button" onClick={clear} className="mt-1 min-h-11 text-xs font-semibold text-ink-soft underline">
        Clear recently viewed
      </button>
    </Section>
  );
}
