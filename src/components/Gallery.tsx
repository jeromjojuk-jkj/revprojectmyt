"use client";

import { useEffect, useRef, useState } from "react";
import { ProductImage } from "./ProductImage";
import { Sheet } from "./Sheet";
import { IconZoom } from "./Icons";

export function Gallery({ images, alt, video = null }: { images: string[]; alt: string; video?: string | null }) {
  const [index, setIndex] = useState(0);
  // The reel (when present) is slide 0; images follow it.
  const offset = video ? 1 : 0;
  const count = images.length + offset;
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
        {video && (
          <button type="button" role="tab" aria-selected={index === 0} aria-label="Product reel" onClick={() => goTo(0)}
            className={`relative aspect-[4/5] overflow-hidden rounded-lg bg-ink ring-2 ${index === 0 ? "ring-leaf" : "ring-transparent"}`}>
            <ProductImage src={images[0]} alt="" sizes="80px" />
            <span className="absolute inset-0 grid place-items-center bg-black/35 text-lg text-white" aria-hidden>▶</span>
          </button>
        )}
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            role="tab"
            aria-selected={i + offset === index}
            aria-label={`Image ${i + 1}`}
            onClick={() => goTo(i + offset)}
            className={`relative aspect-[4/5] overflow-hidden rounded-lg ring-2 ${i + offset === index ? "ring-leaf" : "ring-transparent"}`}
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
          {video && <ReelSlide src={video} poster={images[0]} title={alt} active={index === 0} />}
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className="relative aspect-square w-full shrink-0 snap-center cursor-zoom-in bg-neutral-100 md:aspect-[4/5]"
              onClick={() => {
                setIndex(i + offset);
                setZoomOpen(true);
              }}
              aria-label={`Zoom image ${i + 1} of ${images.length}`}
            >
              <ProductImage src={src} alt={i === 0 ? alt : `${alt}, detail view`} priority={i === 0} sizes="(min-width: 768px) 45vw, 100vw" />
            </button>
          ))}
        </div>
        {index >= offset && (
          <span className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium shadow-sm">
            <IconZoom size={14} /> Tap to zoom
          </span>
        )}
        {count > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
            {Array.from({ length: count }, (_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-ink" : "w-1.5 bg-ink/30"}`} />
            ))}
          </div>
        )}
      </div>
      <ZoomViewer open={zoomOpen} onClose={() => setZoomOpen(false)} src={images[Math.max(0, index - offset)]} alt={alt} />
    </div>
  );
}

/**
 * Vertical product reel. Plays muted and looped only while it's the visible slide,
 * and never autoplays for people who ask for reduced motion.
 */
function ReelSlide({ src, poster, title, active }: { src: string; poster: string; title: string; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [reduce, setReduce] = useState(true);
  useEffect(() => setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active && !reduce) v.play().catch(() => {});
    else v.pause();
  }, [active, reduce]);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };
  return (
    <div className="relative aspect-square w-full shrink-0 snap-center overflow-hidden bg-ink md:aspect-[4/5]">
      {/* Blurred backdrop fills the sides of the 9:16 reel. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" />
      <video
        ref={ref}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={toggle}
        aria-label={`${title} — product reel`}
        className="relative mx-auto h-full w-auto max-w-full cursor-pointer object-contain"
      >
        <source src={src} type={src.endsWith(".webm") ? "video/webm" : "video/mp4"} />
        {/* Reels served from /reels/ ship a WebM copy for browsers without H.264. */}
        {src.startsWith("/reels/") && src.endsWith(".mp4") && <source src={src.replace(/\.mp4$/, ".webm")} type="video/webm" />}
      </video>
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">▶ Reel</span>
      <button type="button" onClick={toggle} aria-label={playing ? "Pause reel" : "Play reel"}
        className="absolute bottom-10 left-3 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-ink shadow">
        {playing ? "❚❚" : "▶"}
      </button>
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
