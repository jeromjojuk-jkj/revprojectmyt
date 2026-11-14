"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateRegistration } from "@/lib/vendorInput";
import { changeVendorPassword, demoPayFee, loginVendor, logoutVendor, registerVendor, requireVendor, VendorError } from "@/lib/server/vendors";

export type FormState = { errors?: Record<string, string>; error?: string; values?: Record<string, string> } | null;

export async function registerVendorAction(_: FormState, fd: FormData): Promise<FormState> {
  const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const keep = Object.fromEntries(Object.entries(raw).filter(([k]) => !["password", "password2", "account", "account2"].includes(k)));
  const res = validateRegistration(raw);
  if (!res.ok) return { errors: res.errors, values: keep };
  try {
    await registerVendor(res.value);
  } catch (e) {
    if (e instanceof VendorError) return { error: e.message, values: keep };
    throw e;
  }
  redirect("/vendor");
}

export async function vendorLoginAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await loginVendor(String(fd.get("email") ?? ""), String(fd.get("password") ?? ""));
  if (!r.ok) return { error: r.error, values: { email: String(fd.get("email") ?? "") } };
  redirect("/vendor");
}

export async function vendorLogoutAction() {
  await logoutVendor();
  redirect("/vendor/login");
}

export async function demoPayFeeAction() {
  await demoPayFee();
  revalidatePath("/vendor");
}

export async function changeVendorPasswordAction(_: { ok?: string; error?: string } | null, fd: FormData): Promise<{ ok?: string; error?: string }> {
  const v = await requireVendor();
  const next = String(fd.get("next") ?? "");
  if (next !== String(fd.get("next2") ?? "")) return { error: "The new passwords don’t match." };
  const err = await changeVendorPassword(v.id, String(fd.get("current") ?? ""), next);
  return err ? { error: err } : { ok: "Password changed. Other devices have been signed out." };
}
