"use client";

import { createContext, useActionState, useContext } from "react";
import type { RawProductInput } from "@/lib/productInput";
import { CATEGORIES, COLLECTIONS, VIBES } from "@/lib/constants";
import { saveProductAction, type SaveProductState } from "../../../actions";

const FormCtx = createContext<{ v: Record<string, string | undefined>; err: Record<string, string> }>({ v: {}, err: {} });

function F({ name, label, hint, area, rows = 3, type = "text", required }: { name: string; label: string; hint?: string; area?: boolean; rows?: number; type?: string; required?: boolean }) {
  const { v, err } = useContext(FormCtx);
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-medium">{label}{required && <span className="text-danger"> *</span>}</label>
      {area ? (
        <textarea id={name} name={name} rows={rows} defaultValue={v[name] ?? ""} aria-invalid={!!err[name]} aria-describedby={`${name}-d`}
          className={`w-full rounded-xl border-2 bg-white px-3 py-2 font-mono text-sm ${err[name] ? "border-danger" : "border-line"}`} />
      ) : (
        <input id={name} name={name} type={type} defaultValue={v[name] ?? ""} aria-invalid={!!err[name]} aria-describedby={`${name}-d`}
          className={`h-11 w-full rounded-xl border-2 bg-white px-3 ${err[name] ? "border-danger" : "border-line"}`} />
      )}
      <p id={`${name}-d`} className={`text-xs ${err[name] ? "font-medium text-danger" : "text-ink-soft"}`}>{err[name] ?? hint}</p>
    </div>
  );
}

function Box({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <fieldset className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-line">
      <legend className="px-1 font-semibold">{title}</legend>
      {note && <p className="text-xs text-ink-soft">{note}</p>}
      {children}
    </fieldset>
  );
}


export function ProductForm({ initial, id }: { initial: RawProductInput; id: string }) {
  const [state, action, pending] = useActionState<SaveProductState, FormData>(saveProductAction, null);
  const v = (state?.values ?? initial) as Record<string, string | undefined>;
  const err = state?.errors ?? {};

  return (
    <FormCtx.Provider value={{ v, err }}>
    <form action={action} className="space-y-4" key={JSON.stringify(state?.values ?? "")}>
      <input type="hidden" name="id" value={id} />
      {state?.message && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{state.message}</p>}

      <Box title="Basics">
        <div className="grid gap-3 md:grid-cols-2">
          <F name="title" label="Title" required />
          <F name="slug" label="URL slug" hint="Leave blank to generate from the title." />
          <F name="brand" label="Brand" />
          <div className="space-y-1">
            <label htmlFor="category" className="text-sm font-medium">Category<span className="text-danger"> *</span></label>
            <select id="category" name="category" defaultValue={v.category ?? ""} className={`h-11 w-full rounded-xl border-2 bg-white px-2 ${err.category ? "border-danger" : "border-line"}`}>
              <option value="">Select…</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {err.category && <p className="text-xs font-medium text-danger">{err.category}</p>}
          </div>
          <F name="subcategory" label="Subcategory" hint="e.g. T-Shirts, Lips, Earrings" required />
          <div className="space-y-1">
            <label htmlFor="status" className="text-sm font-medium">Status</label>
            <select id="status" name="status" defaultValue={v.status ?? "draft"} className="h-11 w-full rounded-xl border-2 border-line bg-white px-2">
              <option value="draft">Draft (hidden)</option><option value="active">Active</option><option value="out-of-stock">Out of stock (visible, can’t buy)</option><option value="archived">Archived (hidden, kept for records)</option>
            </select>
            {err.status && <p className="text-xs font-medium text-danger">{err.status}</p>}
          </div>
        </div>
        <F name="description" label="Description" area required hint="Factual description from the supplier. Don’t add claims you can’t verify." />
      </Box>

      <Box title="Pricing (shopper-facing)">
        <div className="grid gap-3 md:grid-cols-2">
          <F name="price" label="Selling price on Krip (₹, incl. GST)" type="number" required />
          <F name="mrp" label="MRP (₹)" type="number" hint="Only if printed on the product/pack. Leave blank otherwise — no MRP or discount is shown." />
        </div>
      </Box>

      <Box title="Images & variants">
        <F name="images" label="Image URLs (one per line)" area required hint="https:// links to photos Krip is authorised to use. First image is the main photo." />
        <F name="features" label="Key features (one per line, optional)" area rows={4} hint="Short points shown under the price, e.g. “Pack of 15 covers”. Only facts from the supplier or the pack." />
        <F name="howToUse" label="How to use (one step per line, optional)" area rows={4} />
        <F name="video" label="Product reel (optional)" hint="Vertical MP4/WebM, e.g. /reels/daluci-socket-covers.mp4 or an https:// link. Plays muted first in the gallery; use only footage Krip is authorised to use." />
        <F name="variants" label="Variants (one per line: SKU | Colour/Shade | #hex | Size | Stock)" area rows={5} required hint="Leave Size empty for one-size products, e.g. P101-BLK-M | Black | #171717 | M | 12" />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="rightsConfirmed" defaultChecked={v.rightsConfirmed === "on"} className="mt-1 h-5 w-5 accent-[#166534]" />
          <span>I confirm Krip is authorised to use these product photos and descriptions (required to activate).</span>
        </label>
        {err.rightsConfirmed && <p className="text-xs font-medium text-danger">{err.rightsConfirmed}</p>}
      </Box>

      <Box title="Details" note="Only fill fields you have from the supplier — empty fields are simply hidden from shoppers.">
        <div className="grid gap-3 md:grid-cols-3">
          <F name="fit" label="Fit" hint="e.g. Regular, Oversized" />
          <F name="material" label="Fabric / material" />
          <F name="origin" label="Country of origin" />
          <F name="seller" label="Sold by (seller name & address)" />
          <F name="packageContents" label="Package contents" />
          <F name="styleTags" label="Style tags (comma separated)" />
          <F name="vibes" label="Vibes" hint={VIBES.map((x) => x.id).join(", ")} />
          <F name="collections" label="Collections" hint={Object.keys(COLLECTIONS).join(", ")} />
        </div>
        <F name="care" label="Care instructions (one per line)" area />
        <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <F name="sizeGuide" label="Size guide (CSV: header row then one row per size)" area rows={5} hint="e.g. Size, Chest, Length ⏎ S, 38, 27 — use the supplier’s measured values." />
          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="sizeGuideUnit" className="text-sm font-medium">Unit</label>
              <select id="sizeGuideUnit" name="sizeGuideUnit" defaultValue={v.sizeGuideUnit ?? "in"} className="h-11 w-full rounded-xl border-2 border-line bg-white px-2">
                <option value="in">inches</option><option value="cm">cm</option>
              </select>
            </div>
            <F name="sizeGuideHow" label="How to measure" />
          </div>
        </div>
      </Box>

      <Box title="Returns">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="returnType" className="text-sm font-medium">Return type</label>
            <select id="returnType" name="returnType" defaultValue={v.returnType ?? "returnable"} className="h-11 w-full rounded-xl border-2 border-line bg-white px-2">
              <option value="returnable">Returnable</option><option value="exchange-only">Exchange only</option><option value="non-returnable">Non-returnable</option>
            </select>
          </div>
          <F name="returnDays" label="Window (days)" type="number" />
        </div>
        <F name="returnNote" label="Conditions shown to shoppers" area required />
      </Box>

      <Box title="Cosmetics (required for Beauty)" note="Copy exactly from the product label/carton. Never invent ingredients or claims.">
        <F name="ingredients" label="Ingredients" area />
        <div className="grid gap-3 md:grid-cols-3">
          <F name="quantity" label="Net quantity" />
          <F name="skinTypes" label="Skin types (comma separated)" />
          <F name="shelfLife" label="Shelf life / expiry" />
        </div>
        <F name="usage" label="How to use" area />
        <F name="manufacturer" label="Manufacturer / importer (name, address, licence)" area rows={2} />
      </Box>

      <Box title="Private — sourcing & channels" note="Visible to admins only. Never shown in the storefront or public APIs.">
        <div className="grid gap-3 md:grid-cols-2">
          <F name="supplierName" label="Supplier name" required />
          <F name="sourceRef" label="Supplier source reference" hint="Supplier SKU, PO or catalogue reference." />
          <F name="purchaseCost" label="Purchase cost per unit (₹)" type="number" required />
          <F name="shippingCost" label="Estimated outbound shipping per unit (₹)" type="number" />
        </div>
        <F name="channelPrices" label="Channel prices (one per line: Channel | price)" area hint="e.g. Krip | 449 ⏎ Amazon | 499 — used for contribution estimates." />
        <F name="channelListings" label="Public listings on other marketplaces (Channel | https://…)" area hint="Only real, live Krip listings. Shown to shoppers as clearly labelled outbound links." />
      </Box>

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-white/95 px-4 py-3">
        <button disabled={pending} className="h-12 w-full rounded-xl bg-leaf font-semibold text-white disabled:opacity-60 md:w-auto md:px-10">{pending ? "Saving…" : "Save product"}</button>
      </div>
    </form>
    </FormCtx.Provider>
  );
}
