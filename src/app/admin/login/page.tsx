import { redirect } from "next/navigation";
import { adminPasswordStatus, getStaff } from "@/lib/server/auth";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sign-in", robots: { index: false } };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ next?: string; changed?: string; reset?: string }> }) {
  if (await getStaff()) redirect("/admin");
  const sp = await searchParams;
  const status = adminPasswordStatus();
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-[radial-gradient(ellipse_at_top,#ecfdf3,transparent_60%)] bg-paper px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl ring-1 ring-line">
        <div className="flex items-center gap-2"><Logo className="text-[28px]" /><span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white">ADMIN</span></div>
        <h1 className="mt-4 text-xl font-bold">Sign in to Krip Admin</h1>
        {sp.changed && <p role="status" className="mt-3 rounded-xl bg-leaf-soft p-3 text-sm text-leaf">Password changed. Sign in with your new password.</p>}
        {sp.reset && <p role="status" className="mt-3 rounded-xl bg-leaf-soft p-3 text-sm text-leaf">Password set. You can sign in now.</p>}
        {!status.enabled ? (
          <p className="mt-3 rounded-xl bg-danger-soft p-3 text-sm text-danger">Admin access is disabled. Set ADMIN_PASSWORD (8+ characters) and SESSION_SECRET on the server.</p>
        ) : (
          <>
            {status.usingDevDefault && (
              <p className="mt-3 rounded-xl bg-sun-soft p-3 text-xs">
                Development mode: the first Super Admin is <code className="font-semibold">{status.ownerEmail}</code> with password <code className="font-semibold">krip-admin-demo</code>. Production requires ADMIN_EMAIL and ADMIN_PASSWORD.
              </p>
            )}
            <LoginForm defaultEmail={status.usingDevDefault ? status.ownerEmail : ""} next={sp.next ?? ""} />
            <p className="mt-4 text-xs text-ink-soft">Forgot your password? Ask a Super Admin for a one-time reset link from Staff & roles. (No email service is connected yet.)</p>
          </>
        )}
      </div>
    </main>
  );
}
