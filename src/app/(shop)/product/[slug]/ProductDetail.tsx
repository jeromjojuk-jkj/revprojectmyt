"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ProductPublic } from "@/lib/types";
import type { Look } from "@/data/catalog";
import { imageForColor } from "@/lib/art";
import { CATEGORY_NAME } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { estimateDelivery } from "@/lib/pincode";
import { toast, useHydrated, useStore } from "@/lib/store";
import { Gallery } from "@/components/Gallery";
import { Price } from "@/components/Price";
import { Sheet } from "@/components/Sheet";
import { ShareButton } from "@/components/ShareButton";
import { WishlistButton } from "@/components/WishlistButton";
import { ListPicker } from "@/components/ListPicker";
import { PincodeForm } from "@/components/PincodeSheet";
import { ProductRail } from "@/components/ProductCard";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { Section } from "@/components/Section";
import { LookBuilder } from "@/components/LookBuilder";
import { SizeFinder, Spotlight } from "@/components/LabTools";
import { fitQuestion } from "@/lib/fitfinder";
import { VariantPicker, addSelectionToBag, isPurchasable, useVariantSelection } from "@/components/VariantPicker";
import { IconChevron, IconExternal, IconInfo, IconPlus, IconReturn, IconTruck } from "@/components/Icons";

function Detail({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-line">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <IconChevron dir="down" size={18} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-4 text-sm leading-relaxed text-ink-soft">{children}</div>
    </details>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 py-1">
      <dt className="font-medium text-ink">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function SizeGuideTable({ product }: { product: ProductPublic }) {
  const g = product.sizeGuide!;
  const [unit, setUnit] = useState<"in" | "cm">(g.unit);
  const convert = (val: string, i: number) => {
    if (i === 0 || unit === g.unit) return val;
    if (g.headers[i].toLowerCase().includes("eu") || g.headers[i].toLowerCase().includes("us") || g.headers[i] === "UK") return val;
    return val.replace(/\d+(\.\d+)?/g, (n) => (unit === "cm" ? (Number(n) * 2.54).toFixed(1) : (Number(n) / 2.54).toFixed(1)));
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">Garment measurements</p>
        <div role="radiogroup" aria-label="Units" className="flex rounded-full bg-paper p-1 ring-1 ring-line">
          {(["in", "cm"] as const).map((u) => (
            <button key={u} type="button" role="radio" aria-checked={unit === u} onClick={() => setUnit(u)}
              className={`h-9 rounded-full px-4 text-sm font-semibold ${unit === u ? "bg-leaf text-white" : ""}`}>
              {u}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl ring-1 ring-line">
        <table className="w-full text-sm">
          <caption className="sr-only">Size guide in {unit}</caption>
          <thead className="bg-paper">
            <tr>{g.headers.map((h) => <th key={h} scope="col" className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {g.rows.map((r) => (
              <tr key={r[0]} className="border-t border-line">
                {r.map((c, i) => (i === 0 ? <th key={i} scope="row" className="px-3 py-2 text-left font-semibold">{c}</th> : <td key={i} className="px-3 py-2">{convert(c, i)}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-soft"><b>How to measure:</b> {g.howToMeasure}</p>
      {product.fit && <p className="text-xs text-ink-soft"><b>Fit:</b> {product.fit}</p>}
    </div>
  );
}

export function ProductDetail({
  product,
  related,
  looks,
  lookProducts,
  deliveryFee,
  freeDeliveryAbove,
}: {
  product: ProductPublic;
  related: ProductPublic[];
  looks: Look[];
  lookProducts: ProductPublic[];
  deliveryFee: number;
  freeDeliveryAbove: number | null;
}) {
  const router = useRouter();
  const sel = useVariantSelection(product);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [finderOpen, setFinderOpen] = useState(false);
  const [spotOpen, setSpotOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const viewed = useStore((s) => s.viewed);
  const pincode = useStore((s) => s.pincode);
  const hydrated = useHydrated();
  const available = isPurchasable(product);
  const isBeauty = product.category === "beauty";
  const est = hydrated && pincode ? estimateDelivery(pincode) : null;
  const images = product.images.map((src) => imageForColor(src, sel.hex));

  useEffect(() => viewed(product.id), [product.id, viewed]);
  useEffect(() => setError(null), [sel.color, sel.size]);

  const add = (thenCheckout: boolean, from?: Element | null) => {
    const r = addSelectionToBag(product, sel, from);
    if (!r.ok) {
      setError(r.error ?? null);
      pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (thenCheckout) router.push("/checkout");
  };

  const rp = product.returnPolicy;
  const highlights: [string, string][] = (
    [
      ["Fabric / material", product.material],
      ["Fit", product.fit],
      ["Net quantity", product.beauty?.quantity ?? null],
      ["Type", product.subcategory],
      ["Country of origin", product.origin],
      ["In the box", product.packageContents],
    ] as [string, string | null][]
  ).filter((x): x is [string, string] => !!x[1]);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const waText = `${product.title} for ${formatPrice(product.price)} on krip ${origin}/product/${product.slug}`;

  return (
    <div className="pb-actionbar md:pb-10">
      <nav aria-label="Breadcrumb" className="hidden px-4 pt-4 text-xs text-ink-soft md:block">
        <Link href="/" className="hover:underline">Home</Link> /{" "}
        <Link href={`/search?cat=${product.category}`} className="hover:underline">{CATEGORY_NAME[product.category]}</Link> /{" "}
        <span aria-current="page">{product.title}</span>
      </nav>

      <div className="md:grid md:grid-cols-2 md:gap-8 md:px-4 md:pt-4">
        <div className="relative">
          <Gallery images={images} alt={`${product.title} in ${sel.color}`} />
          <div className="absolute bottom-12 right-3 z-10 flex flex-col items-end gap-2">
            <button type="button" onClick={() => setSpotOpen(true)} aria-haspopup="dialog" className="glass-chip flex h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold">✨ Spotlight 3D</button>
            {fitQuestion(product.sizeGuide) && available && (
              <button type="button" onClick={() => setFinderOpen(true)} aria-haspopup="dialog" className="glass-chip flex h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold">📏 Find my size</button>
            )}
          </div>
        </div>

        <div className="space-y-5 px-4 pt-4 md:px-0 md:pt-0">
          {product.isSample && (
            <p className="flex gap-2 rounded-xl bg-sun-soft px-3 py-2 text-xs text-ink">
              <IconInfo size={16} className="mt-0.5 shrink-0" />
              Sample catalogue item for the Krip prototype. The image is an illustration; specifications are placeholders.
            </p>
          )}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{product.brand}</p>
              <h1 className="text-xl font-semibold leading-snug md:text-2xl">{product.title}</h1>
            </div>
            <div className="-mr-2 flex shrink-0">
              <ShareButton title={product.title} path={`/product/${product.slug}`} className="h-11 w-11 rounded-full hover:bg-black/5" />
            </div>
          </div>
          <div className="space-y-1">
            <Price price={product.price} mrp={product.mrp} size="lg" />
            <p className="text-xs text-ink-soft">
              Price includes GST. Delivery charge of {formatPrice(deliveryFee)} per order
              {freeDeliveryAbove !== null ? ` (free above ${formatPrice(freeDeliveryAbove)})` : ""} is shown in your bag before you pay.
            </p>
            {product.reviews.length === 0 && <p className="text-xs text-ink-soft">No ratings yet</p>}
          </div>

          {/* Product highlights — only fields the supplier gave us */}
          {highlights.length > 0 && (
            <section aria-labelledby="hl-title" className="rounded-2xl bg-white p-4 ring-1 ring-line">
              <h2 id="hl-title" className="mb-2 text-sm font-semibold">Product highlights</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {highlights.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-ink-soft">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <div ref={pickerRef}>
            {available ? (
              <VariantPicker product={product} sel={sel} error={error} onSizeGuide={() => setGuideOpen(true)} />
            ) : (
              <div className="space-y-2 rounded-xl bg-neutral-100 p-3">
                <p className="font-semibold">Out of stock</p>
                <p className="text-sm text-ink-soft">
                  This product is currently unavailable in all options. Save it to your wishlist to find it again easily.
                </p>
              </div>
            )}
          </div>

          <div className="hidden gap-2 md:flex">
            <button type="button" onClick={(e) => add(false, e.currentTarget)} disabled={!available} className="h-12 flex-1 rounded-xl font-semibold text-leaf ring-2 ring-leaf disabled:opacity-40">
              Add to Bag
            </button>
            <button type="button" onClick={(e) => add(true, e.currentTarget)} disabled={!available} className="h-12 flex-1 rounded-xl bg-leaf font-semibold text-white disabled:bg-neutral-300">
              Buy Now
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center gap-2 rounded-xl bg-[#1f7a43] px-4 text-sm font-semibold text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4a.5.5 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"/></svg>
              Share on WhatsApp
            </a>
            <WishlistButton productId={product.id} title={product.title} withLabel className="h-11 rounded-xl bg-white px-4 ring-1 ring-line" />
            <button type="button" onClick={() => setListOpen(true)} className="flex h-11 items-center gap-1 rounded-xl bg-white px-4 text-sm font-medium ring-1 ring-line" aria-haspopup="dialog">
              <IconPlus size={16} /> Save to list
            </button>
          </div>

          {/* Delivery & returns */}
          <section aria-labelledby="delivery-title" className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-line">
            <h2 id="delivery-title" className="flex items-center gap-2 font-semibold"><IconTruck size={20} /> Delivery & returns</h2>
            <PincodeForm compact />
            {!est && <p className="text-xs text-ink-soft">Enter your pincode to see an estimated delivery date.</p>}
            <div className="flex gap-2 rounded-xl bg-paper p-3 text-sm">
              <IconReturn size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">
                  {rp.type === "returnable" ? `${rp.days}-day returns & exchange` : rp.type === "exchange-only" ? `${rp.days}-day exchange only` : "Not returnable"}
                </p>
                <p className="text-xs text-ink-soft">{rp.note}</p>
              </div>
            </div>
          </section>

          {/* Seller */}
          <section aria-labelledby="seller-title" className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sun text-sm font-bold text-ink" aria-hidden>
              {product.brand.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="seller-title" className="text-xs text-ink-soft">Sold by</h2>
              <p className="truncate font-semibold">{product.seller ?? "Krip"}</p>
              <p className="text-xs text-ink-soft">Brand: {product.brand}{product.origin ? ` · Made in ${product.origin}` : ""}</p>
            </div>
            <Link href={`/search?q=${encodeURIComponent(product.brand)}`} className="flex h-10 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-leaf ring-1 ring-leaf">
              View brand
            </Link>
          </section>

          {/* Details */}
          <div>
            <Detail title="Product details" open>
              <p className="mb-2">{product.description}</p>
              <dl>
                {product.fit && <Row k="Fit" v={product.fit} />}
                {product.material && <Row k={isBeauty ? "Format" : "Fabric / material"} v={product.material} />}
                {product.packageContents && <Row k="In the box" v={product.packageContents} />}
                <Row k="Category" v={`${CATEGORY_NAME[product.category]} · ${product.subcategory}`} />
              </dl>
            </Detail>
            {product.sizeGuide && (
              <Detail title="Size & fit">
                <SizeGuideTable product={product} />
              </Detail>
            )}
            {product.care.length > 0 && (
              <Detail title="Care instructions">
                <ul className="list-disc pl-5">{product.care.map((c) => <li key={c}>{c}</li>)}</ul>
              </Detail>
            )}
            {product.beauty && (
              <>
                <Detail title="Ingredients">{product.beauty.ingredients}</Detail>
                <Detail title="How to use">{product.beauty.usage}</Detail>
                <Detail title="Quantity, shelf life & suitability">
                  <dl>
                    <Row k="Net quantity" v={product.beauty.quantity} />
                    <Row k={product.variants.length > 1 ? "Shades" : "Variant"} v={[...new Set(product.variants.map((v) => v.color))].join(", ")} />
                    <Row k="Skin type" v={product.beauty.skinTypes.join(", ")} />
                    <Row k="Shelf life" v={product.beauty.shelfLife} />
                    {product.beauty.expiryNote && <Row k="Expiry" v={product.beauty.expiryNote} />}
                  </dl>
                </Detail>
                <Detail title="Manufacturer">{product.beauty.manufacturer}</Detail>
              </>
            )}
            {(product.seller || product.origin) && (
              <Detail title="Seller & origin">
                <dl>
                  <Row k="Brand" v={product.brand} />
                  {product.seller && <Row k="Sold by" v={product.seller} />}
                  {product.origin && <Row k="Country of origin" v={product.origin} />}
                </dl>
              </Detail>
            )}
            <Detail title="Reviews">
              {product.reviews.length === 0 ? (
                <p>No reviews yet. Reviews will appear here only from customers who have received this product from Krip.</p>
              ) : (
                <ul className="space-y-3">
                  {product.reviews.map((r) => (
                    <li key={r.id}>
                      <p className="font-semibold text-ink">{r.rating}/5 · {r.author}{r.purchaseVerified ? " · Krip order" : ""}</p>
                      <p>{r.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Detail>
          </div>

          {product.channelListings.length > 0 && (
            <section aria-labelledby="elsewhere" className="rounded-2xl bg-white p-4 ring-1 ring-line">
              <h2 id="elsewhere" className="font-semibold">Also sold by Krip on</h2>
              <p className="text-xs text-ink-soft">These links open an external marketplace. Prices, delivery and returns there are set by that marketplace.</p>
              <ul className="mt-2 space-y-1">
                {product.channelListings.map((c) => (
                  <li key={c.channel}>
                    <a href={c.url} target="_blank" rel="noopener noreferrer nofollow" className="flex min-h-11 items-center gap-2 font-medium text-leaf underline">
                      View Krip’s listing on {c.channel} <IconExternal size={16} /> <span className="sr-only">(opens external site)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {looks.map((l) => (
        <LookBuilder key={l.id} look={l} products={lookProducts} highlightId={product.id} />
      ))}

      {related.length > 0 && (
        <Section id="related" title="You may also like" kicker="Similar styles">
          <ProductRail products={related} />
        </Section>
      )}
      <RecentlyViewed excludeId={product.id} />

      {/* Sticky actions (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pt-3 backdrop-blur md:hidden" style={{ paddingBottom: "calc(12px + var(--safe-bottom))" }}>
        <div className="flex items-center gap-2">
          <WishlistButton productId={product.id} title={product.title} className="h-12 w-12 shrink-0 rounded-xl ring-1 ring-line" />
          {available ? (
            <>
              <button type="button" onClick={(e) => add(false, e.currentTarget)} className="pressable h-12 flex-1 rounded-xl font-semibold text-leaf ring-2 ring-leaf">
                Add to Bag
              </button>
              <button type="button" onClick={(e) => add(true, e.currentTarget)} className="pressable h-12 flex-1 rounded-xl bg-leaf font-semibold text-white">
                Buy Now
              </button>
            </>
          ) : (
            <button type="button" disabled className="h-12 flex-1 rounded-xl bg-neutral-200 font-semibold text-neutral-600">
              Out of stock
            </button>
          )}
        </div>
      </div>

      {product.sizeGuide && (
        <Sheet open={guideOpen} onClose={() => setGuideOpen(false)} title="Size guide">
          <SizeGuideTable product={product} />
        </Sheet>
      )}
      <ListPicker productId={product.id} open={listOpen} onClose={() => setListOpen(false)} />
      <SizeFinder product={product} open={finderOpen} onClose={() => setFinderOpen(false)} onPick={(sz) => { sel.setSize(sz); toast({ message: `Size ${sz} selected` }); }} />
      <Spotlight src={images[0]} title={product.title} open={spotOpen} onClose={() => setSpotOpen(false)} />
    </div>
  );
}
