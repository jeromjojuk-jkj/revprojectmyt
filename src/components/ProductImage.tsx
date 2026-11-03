import Image from "next/image";

export function ProductImage({
  src,
  alt,
  priority = false,
  sizes = "(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 50vw",
  className = "",
  fit = "contain",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** "contain" (default) always shows the whole photo; "cover" fills the box and may crop (decorative art only). */
  fit?: "contain" | "cover";
}) {
  if (!src) return <div className={`h-full w-full bg-neutral-100 ${className}`} aria-hidden />;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      unoptimized={src.endsWith(".svg")}
      className={`${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
      draggable={false}
    />
  );
}
