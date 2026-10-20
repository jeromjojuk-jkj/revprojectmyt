import { redirect } from "next/navigation";
import { adminPasswordStatus, isAdmin } from "@/lib/server/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sign-in", robots: { index: false } };

export default async function AdminLogin() {
  if (await isAdmin()) redirect("/admin");
  const status = adminPasswordStatus();
  return (
    <main id="main" className="mx-auto max-w-sm px-4 pt-16">
      <h1 className="text-xl font-semibold">Krip admin</h1>
      {!status.enabled ? (
        <p className="mt-3 rounded-xl bg-danger-soft p-3 text-sm text-danger">Admin access is disabled. Set ADMIN_PASSWORD (8+ characters) and SESSION_SECRET on the server.</p>
      ) : (
        <>
          {status.usingDevDefault && (
            <p className="mt-3 rounded-xl bg-sun-soft p-3 text-xs">
              Development mode: ADMIN_PASSWORD isn’t set, so the dev password <code className="font-semibold">krip-admin-demo</code> is active. Production requires ADMIN_PASSWORD.
            </p>
          )}
          <LoginForm />
        </>
      )}
    </main>
  );
}
