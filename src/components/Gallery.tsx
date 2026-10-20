"use client";

import { useRef, useState } from "react";
import { ProductImage } from "./ProductImage";
import { Sheet } from "./Sheet";
import { IconZoom } from "./Icons";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const track = useRef<HTMLDivElement>(null);

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="relative md:flex md:gap-3">
      <div className="hidden w-20 shrink-0 flex-col gap-2 md:flex" role="tablist" aria-label="Product images">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Image ${i + 1}`}
            onClick={() => goTo(i)}
            className={`relative aspect-[4/5] overflow-hidden rounded-lg ring-2 ${i === index ? "ring-leaf" : "ring-transparent"}`}
          >
            <ProductImage src={src} alt="" sizes="80px" />
          </button>
        ))}
      </div>
      <div className="relative min-w-0 flex-1">
        <div
          ref={track}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto md:rounded-2xl"
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          aria-roledescription="carousel"
          aria-label={`${alt} images`}
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className="relative aspect-square w-full shrink-0 snap-center cursor-zoom-in bg-neutral-100 md:aspect-[4/5]"
              onClick={() => {
                setIndex(i);
                setZoomOpen(true);
              }}
              aria-label={`Zoom image ${i + 1} of ${images.length}`}
            >
              <ProductImage src={src} alt={i === 0 ? alt : `${alt}, detail view`} priority={i === 0} sizes="(min-width: 768px) 45vw, 100vw" />
            </button>
          ))}
        </div>
        <span className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium shadow-sm">
          <IconZoom size={14} /> Tap to zoom
        </span>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
            {images.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-ink" : "w-1.5 bg-ink/30"}`} />
            ))}
          </div>
        )}
      </div>
      <ZoomViewer open={zoomOpen} onClose={() => setZoomOpen(false)} src={images[index]} alt={alt} />
    </div>
  );
}

function ZoomViewer({ open, onClose, src, alt }: { open: boolean; onClose: () => void; src: string; alt: string }) {
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const setFrom = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };
  return (
    <Sheet open={open} onClose={() => { setZoom(false); onClose(); }} title="Zoom">
      <button
        type="button"
        className="relative mx-auto block aspect-[4/5] w-full max-w-md touch-pan-y overflow-hidden rounded-xl bg-neutral-100"
        onClick={(e) => {
          setFrom(e as unknown as React.PointerEvent<HTMLElement>);
          setZoom((z) => !z);
        }}
        onPointerMove={(e) => zoom && setFrom(e)}
        aria-label={zoom ? "Zoom out" : "Zoom in"}
      >
        <span className="absolute inset-0 transition-transform duration-200" style={{ transform: zoom ? "scale(2.4)" : "none", transformOrigin: origin }}>
          <ProductImage src={src} alt={alt} sizes="(min-width: 768px) 448px, 100vw" />
        </span>
      </button>
      <p className="mt-2 text-center text-xs text-ink-soft">{zoom ? "Move your finger or cursor to look around. Tap to zoom out." : "Tap the image to zoom in."}</p>
    </Sheet>
  );
}
