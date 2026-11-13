"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Columns3, Copy, ExternalLink } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/format";
import { CATEGORIES, CATEGORY_NAME } from "@/lib/constants";
import type { CategoryId, ProductStatus } from "@/lib/types";
import { bulkProductsAction, duplicateProductAction } from "@/app/admin/opsActions";
import { Badge, Empty, SortLink, btn, field, td, th, type Tone } from "@/app/admin/_components/ui";
import { QuickPrice } from "./QuickPrice";
import { QuickStock } from "./QuickStock";
import { QuickCosts, type FeeModel } from "./QuickCosts";

export interface ProductRow {
  id: string; slug: string; title: string; brand: string; category: CategoryId; image: string; price: number; mrp: number | null;
  stock: number; variants: number; firstSku: string; status: ProductStatus; sold: number; createdAt: string; sample: boolean; rights: boolean; low: boolean;
  cost: number | null; shippingCost: number | null; otherCost: number | null; contribution: number | null; margin: number | null;
}

const STATUS_TONE: Record<ProductStatus, Tone> = { active: "green", draft: "neutral", "out-of-stock": "yellow", archived: "dark" };
const OPTIONAL = { brand: "Brand", category: "Category", sold: "Sold", created: "Created", finance: "Cost & margin" } as const;
type Col = keyof typeof OPTIONAL;

export function ProductTable({ rows, params, canEdit, canEditStock, canArchive, canCreate, showFinance, fees }: { rows: ProductRow[]; params: Record<string, string | undefined>; canEdit: boolean; canEditStock: boolean; canArchive: boolean; canCreate: boolean; showFinance: boolean; fees: FeeModel }) {
  const [sel, setSel] = useState<string[]>([]);
  const [op, setOp] = useState("");
  const [hidden, setHidden] = useState<Col[]>([]);
  const [state, action, pending] = useActionState(bulkProductsAction, null);
  useEffect(() => {
    try { setHidden(JSON.parse(localStorage.getItem("krip-admin-product-cols") ?? "[]")); } catch {}
  }, []);
  useEffect(() => { if (state?.ok) setSel([]); }, [state]);
  const show = (c: Col) => !hidden.includes(c) && (c !== "finance" || showFinance);
  const toggleCol = (c: Col) => setHidden((h) => {
    const next = h.includes(c) ? h.filter((x) => x !== c) : [...h, c];
    try { localStorage.setItem("krip-admin-product-cols", JSON.stringify(next)); } catch {}
    return next;
  });
  const all = rows.length > 0 && sel.length === rows.length;
  if (!rows.length) return <Empty title="No products match">Try clearing a filter, or add a product.</Empty>;

  return (
    <form action={action}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(canEdit || canArchive) && (
          <div className={`flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 ring-1 transition-colors ${sel.length ? "bg-ink text-white ring-ink" : "bg-white ring-line"}`}>
            <span className="text-sm font-medium">{sel.length ? `${sel.length} selected` : "Select products for bulk actions"}</span>
            {sel.length > 0 && (
              <>
                <label className="sr-only" htmlFor="bulkOp">Bulk action</label>
                <select id="bulkOp" name="bulkOp" value={op} onChange={(e) => setOp(e.target.value)} className={`${field} h-9 w-auto text-ink`}>
                  <option value="">Choose action…</option>
                  {canEdit && <option value="activate">Activate</option>}
                  {canEdit && <option value="draft">Move to draft</option>}
                  {canArchive && <option value="archive">Archive (hide, keep record)</option>}
                  {canArchive && <option value="delete">Delete permanently</option>}
                  {canEdit && <option value="category">Change category</option>}
                  {canEdit && <option value="price">Adjust price</option>}
                </select>
                {op === "category" && (
                  <select name="category" aria-label="New category" className={`${field} h-9 w-auto text-ink`}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.short}</option>)}</select>
                )}
                {op === "price" && (
                  <>
                    <select name="priceMode" aria-label="Price change type" className={`${field} h-9 w-auto text-ink`}><option value="percent">% change</option><option value="amount">₹ change</option></select>
                    <input name="priceValue" aria-label="Price change" placeholder="e.g. -10" inputMode="decimal" className={`${field} h-9 w-24 text-ink`} />
                  </>
                )}
                {op === "delete" && (
                  <input name="confirmDelete" aria-label="Type DELETE to confirm" placeholder="Type DELETE" autoComplete="off" className={`${field} h-9 w-32 text-ink`} />
                )}
                <button disabled={!op || pending} className="h-9 rounded-lg bg-sun px-3 text-sm font-semibold text-ink disabled:opacity-50">{pending ? "Applying…" : "Apply"}</button>
              </>
            )}
          </div>
        )}
        <details className="relative ml-auto">
          <summary className={`${btn.secondary} cursor-pointer list-none`}><Columns3 size={16} aria-hidden /> Columns</summary>
          <div className="absolute right-0 z-10 mt-2 w-48 rounded-xl bg-white p-2 shadow-lg ring-1 ring-line">
            {(Object.keys(OPTIONAL) as Col[]).filter((c) => c !== "finance" || showFinance).map((c) => (
              <label key={c} className="flex min-h-9 items-center gap-2 rounded px-2 text-sm hover:bg-paper"><input type="checkbox" checked={!hidden.includes(c)} onChange={() => toggleCol(c)} /> {OPTIONAL[c]}</label>
            ))}
          </div>
        </details>
      </div>
      <div aria-live="polite">
        {state?.error && <p role="alert" className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
        {state?.ok && <p className="mb-3 rounded-lg bg-leaf-soft px-3 py-2 text-sm text-leaf">{state.message}</p>}
      </div>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-paper">
            <tr>
              {(canEdit || canArchive) && <th className={`${th} w-10`}><input type="checkbox" aria-label="Select all on this page" checked={all} onChange={() => setSel(all ? [] : rows.map((r) => r.id))} /></th>}
              <th className={th}><SortLink base="/admin/products" params={params} col="title">Product</SortLink></th>
              {show("brand") && <th className={th}>Brand</th>}
              {show("category") && <th className={th}>Category</th>}
              <th className={`${th} text-right`}><SortLink base="/admin/products" params={params} col="price">Price</SortLink></th>
              <th className={`${th} text-right`}><SortLink base="/admin/products" params={params} col="stock">Stock</SortLink></th>
              {show("sold") && <th className={`${th} text-right`}><SortLink base="/admin/products" params={params} col="sold">Sold</SortLink></th>}
              {show("finance") && <th className={`${th} text-right`}>Costs · est. profit</th>}
              <th className={th}>Status</th>
              {show("created") && <th className={th}><SortLink base="/admin/products" params={params} col="created">Created</SortLink></th>}
              <th className={th}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className={`border-t border-line ${sel.includes(p.id) ? "bg-leaf-soft/50" : "hover:bg-paper/60"}`}>
                {(canEdit || canArchive) && (
                  <td className={td}><input type="checkbox" name="ids" value={p.id} aria-label={`Select ${p.title}`} checked={sel.includes(p.id)} onChange={() => setSel((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))} /></td>
                )}
                <td className={td}>
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt="" className="h-12 w-10 shrink-0 rounded-lg bg-paper object-cover" loading="lazy" />
                    <div className="min-w-0">
                      <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-leaf hover:underline">{p.title}</Link>
                      <p className="text-xs text-ink-soft"><span className="font-mono">{p.firstSku}</span>{p.variants > 1 ? ` +${p.variants - 1}` : ""}{p.sample ? " · sample" : ""}{!p.rights ? " · rights unconfirmed" : ""}</p>
                    </div>
                  </div>
                </td>
                {show("brand") && <td className={`${td} text-xs`}>{p.brand}</td>}
                {show("category") && <td className={`${td} text-xs`}>{CATEGORY_NAME[p.category]}</td>}
                <td className={`${td} text-right tabular-nums`}>
                  {canEdit ? <QuickPrice id={p.id} title={p.title} price={p.price} mrp={p.mrp} /> : formatPrice(p.price)}
                  {p.mrp && <span className="block text-xs text-ink-soft line-through">{formatPrice(p.mrp)}</span>}
                </td>
                <td className={`${td} text-right tabular-nums`}>
                  {(() => {
                    const tone = p.stock === 0 ? "font-semibold text-danger" : p.low ? "font-semibold text-amber-700" : "";
                    if (!canEditStock) return <span className={tone}>{p.stock}</span>;
                    if (p.variants === 1) return <QuickStock sku={p.firstSku} title={p.title} stock={p.stock} tone={tone} />;
                    // Each colour/size has its own stock: edit them on Inventory.
                    return <Link href={`/admin/inventory?q=${encodeURIComponent(p.title)}`} title="Edit stock per colour/size" className={`rounded-lg px-2 py-1 hover:bg-paper hover:underline ${tone}`}>{p.stock} ›</Link>;
                  })()}
                </td>
                {show("sold") && <td className={`${td} text-right tabular-nums`}>{p.sold}</td>}
                {show("finance") && (
                  <td className={`${td} text-right text-xs tabular-nums`}>
                    {canEdit && p.cost !== null ? (
                      <QuickCosts id={p.id} title={p.title} price={p.price} cost={p.cost} shipping={p.shippingCost ?? 0} other={p.otherCost ?? 0} fees={fees} contribution={p.contribution} margin={p.margin} />
                    ) : (
                      <>{p.cost !== null ? formatPrice(p.cost) : "—"}{p.contribution !== null && <span className={`block ${p.contribution < 0 ? "font-semibold text-danger" : "text-ink-soft"}`}>{formatPrice(p.contribution)} ({p.margin}%)</span>}</>
                    )}
                  </td>
                )}
                <td className={td}><Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge></td>
                {show("created") && <td className={`${td} whitespace-nowrap text-xs`}>{formatDate(p.createdAt, { day: "numeric", month: "short", year: "2-digit" })}</td>}
                <td className={`${td} whitespace-nowrap`}>
                  <div className="flex justify-end gap-1">
                    {p.status !== "draft" && p.status !== "archived" && <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer" aria-label={`Preview ${p.title} in store`} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-paper"><ExternalLink size={16} /></a>}
                    {canCreate && <button formAction={duplicateProductAction} name="id" value={p.id} aria-label={`Duplicate ${p.title}`} title="Duplicate as draft" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-paper"><Copy size={16} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}
