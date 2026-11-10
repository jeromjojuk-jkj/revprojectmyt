"use client";

import { useActionState, useRef, useState } from "react";
import { saveVendorProductAction } from "@/app/vendor/productActions";

const input = "h-11 w-full rounded-xl border-2 border-line bg-white px-3 text-[15px] outline-none focus:border-leaf";
const area = "w-full rounded-xl border-2 border-line bg-white p-3 text-[15px] outline-none focus:border-leaf";

export function VendorProductForm({ initial, categories, live }: { initial: Record<string, string>; categories: { id: string; name: string }[]; live: boolean }) {
  const [state, action, pending] = useActionState(saveVendorProductAction, null);
  const v = state?.values ?? initial;
  const err = state?.errors ?? {};
  const [images, setImages] = useState(v.images ?? "");
  const [upMsg, setUpMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUpMsg(null);
    const urls: string[] = [];
    for (const f of [...files].slice(0, 8)) {
      const fd = new FormData();
      fd.append("file", f);
      const r = await fetch("/api/vendor/upload", { method: "POST", body: fd }).catch(() => null);
      const d = (await r?.json().catch(() => ({}))) as { url?: string; error?: string } | undefined;
      if (d?.url) urls.push(d.url);
      else { setUpMsg(d?.error ?? "Upload failed. Try again."); break; }
    }
    if (urls.length) setImages((cur) => [...cur.split("\n").filter((x) => x.trim()), ...urls].slice(0, 8).join("\n"));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const F = ({ name, label, hint, mode }: { name: string; label: string; hint?: string; mode?: React.HTMLAttributes<HTMLInputElement>["inputMode"] }) => (
    <div>
      <label htmlFor={`p-${name}`} className="mb-1 block text-sm font-medium">{label}</label>
      <input id={`p-${name}`} name={name} defaultValue={v[name]} inputMode={mode} aria-invalid={!!err[name]} className={`${input} ${err[name] ? "border-danger" : ""}`} />
      {err[name] ? <p className="mt-1 text-xs text-danger">{err[name]}</p> : hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
  const T = ({ name, label, hint, rows = 4 }: { name: string; label: string; hint?: string; rows?: number }) => (
    <div>
      <label htmlFor={`p-${name}`} className="mb-1 block text-sm font-medium">{label}</label>
      <textarea id={`p-${name}`} name={name} rows={rows} defaultValue={v[name]} className={`${area} ${err[name] ? "border-danger" : ""}`} />
      {err[name] ? <p className="mt-1 text-xs text-danger">{err[name]}</p> : hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
  const box = "space-y-3 rounded-2xl bg-white p-4 ring-1 ring-line";
  const list = images.split("\n").map((x) => x.trim()).filter(Boolean);
  return (
    <form action={action} className="space-y-4" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {err.form && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{err.form}</p>}
      {live && <p className="rounded-xl bg-sun-soft p-3 text-sm">Price and stock changes go live straight away. Changes to the name, photos or description go back to Krip for review, and the product is hidden until approved.</p>}
      <fieldset className={box}>
        <legend className="px-1 font-semibold">Product</legend>
        {F({ name: "title", label: "Product name", hint: "Clear and factual, e.g. “Steel Vegetable Chopper, 3 Blades”." })}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="p-category" className="mb-1 block text-sm font-medium">Category</label>
            <select id="p-category" name="category" defaultValue={v.category ?? ""} className={`${input} ${err.category ? "border-danger" : ""}`}>
              <option value="">Choose…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {err.category && <p className="mt-1 text-xs text-danger">{err.category}</p>}
          </div>
          {F({ name: "subcategory", label: "Type (optional)", hint: "e.g. Choppers" })}
        </div>
        {T({ name: "description", label: "Description", hint: "Only facts you can back up — no “best”, “No. 1” or medical claims." })}
        {T({ name: "features", label: "Key features (one per line, up to 8)", rows: 4 })}
        {T({ name: "howToUse", label: "How to use (one step per line, optional)", rows: 3 })}
        <div className="grid gap-3 sm:grid-cols-3">
          {F({ name: "colour", label: "Colour / variant", hint: "e.g. Green" })}
          {F({ name: "material", label: "Material (optional)" })}
          {F({ name: "packageContents", label: "In the box (optional)" })}
        </div>
      </fieldset>
      <fieldset className={box}>
        <legend className="px-1 font-semibold">Price & stock</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {F({ name: "price", label: "Selling price (₹)", mode: "numeric", hint: "Incl. GST. You get this − ₹10 per unit." })}
          {F({ name: "mrp", label: "MRP (₹, optional)", mode: "numeric", hint: "Printed MRP only." })}
          {F({ name: "stock", label: "Stock you have", mode: "numeric" })}
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium">Returns</span>
          <div className="flex flex-wrap gap-2">
            {[["returnable", "7-day returns"], ["non-returnable", "Not returnable (damaged / wrong item replaced)"]].map(([val, label]) => (
              <label key={val} className="flex min-h-11 items-center gap-2 rounded-xl px-3 ring-2 ring-line has-[:checked]:bg-leaf-soft has-[:checked]:ring-leaf">
                <input type="radio" name="returnType" value={val} defaultChecked={(v.returnType ?? "returnable") === val} className="accent-leaf" />{label}
              </label>
            ))}
          </div>
        </div>
      </fieldset>
      <fieldset className={box}>
        <legend className="px-1 font-semibold">Photos</legend>
        <div className="flex flex-wrap gap-2">
          {list.map((u) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={u} src={u} alt="" className="size-20 rounded-lg bg-paper object-contain ring-1 ring-line" />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" id="p-files" onChange={(e) => upload(e.target.files)} />
          <label htmlFor="p-files" className="flex h-11 cursor-pointer items-center rounded-xl bg-white px-4 font-semibold ring-2 ring-leaf text-leaf">{uploading ? "Uploading…" : "Upload photos"}</label>
          <span className="text-xs text-ink-soft">JPG, PNG or WebP, up to 4 MB each. First photo is the main one.</span>
        </div>
        {upMsg && <p className="text-xs text-danger">{upMsg}</p>}
        <div>
          <label htmlFor="p-images" className="mb-1 block text-sm font-medium">Photo links (one per line)</label>
          <textarea id="p-images" name="images" rows={3} value={images} onChange={(e) => setImages(e.target.value)} className={`${area} font-mono text-xs ${err.images ? "border-danger" : ""}`} />
          {err.images && <p className="mt-1 text-xs text-danger">{err.images}</p>}
        </div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="rights" className="mt-0.5 size-5 accent-leaf" />
          <span>I own these photos (or have permission to use them), this product isn’t a copy of a brand or licensed character, and I’m allowed to sell it.</span>
        </label>
        {err.rights && <p className="text-xs text-danger">{err.rights}</p>}
      </fieldset>
      <button disabled={pending || uploading} className="h-12 w-full rounded-xl bg-leaf font-semibold text-white disabled:opacity-60 sm:w-auto sm:px-8">{pending ? "Saving…" : initial.id ? "Save changes" : "Send for Krip review"}</button>
    </form>
  );
}
