import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getVendor } from "@/lib/server/vendors";

export const dynamic = "force-dynamic";

const MAX = 4 * 1024 * 1024;
const TYPES: { type: string; ext: string; magic: (b: Uint8Array) => boolean }[] = [
  { type: "image/jpeg", ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: "image/png", ext: "png", magic: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { type: "image/webp", ext: "webp", magic: (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP" },
];

/** A seller uploads one product photo (JPG, PNG or WebP, up to 4 MB). Needs Vercel Blob storage. */
export async function POST(req: Request) {
  const v = await getVendor();
  if (!v || v.status !== "approved") return NextResponse.json({ error: "Please sign in as an approved seller." }, { status: 401 });
  // Vercel connects a Blob store either with a read-write token or (newer) with BLOB_STORE_ID + Vercel's built-in OIDC sign-in.
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) return NextResponse.json({ error: "Photo upload isn’t switched on yet. Paste https:// photo links instead." }, { status: 503 });
  const fd = await req.formData().catch(() => null);
  const file = fd?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a photo." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Photo is larger than 4 MB." }, { status: 413 });
  const buf = new Uint8Array(await file.arrayBuffer());
  const kind = TYPES.find((t) => t.magic(buf));
  if (!kind) return NextResponse.json({ error: "Use a JPG, PNG or WebP photo." }, { status: 415 });
  const name = `sellers/${v.id}/${crypto.randomBytes(8).toString("hex")}.${kind.ext}`;
  try {
    const blob = await put(name, Buffer.from(buf), { access: "public", contentType: kind.type, addRandomSuffix: false });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("Seller photo upload failed", e);
    return NextResponse.json({ error: "Upload failed on our side. Please try again, or paste an https:// photo link." }, { status: 502 });
  }
}
