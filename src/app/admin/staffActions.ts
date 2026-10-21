"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStaff, hashToken, newResetToken, requirePerm, requireStaff } from "@/lib/server/auth";
import { withDb } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/passwords";
import { newTotpSecret, verifyTotp } from "@/lib/totp";
import { BUILT_IN_ROLES, canGrant, findRole, isPermission, type Permission, type RoleDef } from "@/lib/rbac";
import type { DB } from "@/lib/server/db";

export type FormState = { ok?: boolean; error?: string; message?: string; link?: string; secret?: string } | null;

const rolesOf = (db: DB): RoleDef[] => db.roles.map((r) => ({ ...r, permissions: r.permissions.filter(isPermission) as Permission[], builtIn: false }));

function resetLink(token: string) {
  return `/admin/reset?token=${token}`;
}

// ---------- Staff ----------

export async function createStaffAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePerm("staff.create");
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const name = String(fd.get("name") ?? "").trim().slice(0, 60);
  const roleId = String(fd.get("roleId") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: "Enter a valid work email." };
  if (name.length < 2) return { error: "Enter their name." };
  const { token, hash, expires } = newResetToken();
  try {
    await withDb((db) => {
      const role = findRole(rolesOf(db), roleId);
      if (!role) throw new Error("Choose a role.");
      if (!canGrant(ctx.role, role)) throw new Error("You can’t assign a role with more access than your own.");
      if (db.staff.some((s) => s.email === email)) throw new Error("A staff member with this email already exists.");
      const now = new Date().toISOString();
      const id = `st_${crypto.randomBytes(5).toString("hex")}`;
      db.staff.push({
        id, email, name, roleId,
        // Unusable random password until they set their own through the invite link.
        passwordHash: hashPassword(crypto.randomBytes(32).toString("base64url")),
        active: true, mfaSecret: null, mfaPending: null, failedLogins: 0, lockedUntil: null, createdAt: now, createdBy: ctx.staff.name,
        lastLoginAt: null, passwordChangedAt: now, resetTokenHash: hash, resetTokenExpires: expires, notificationsSeenAt: null,
      });
      audit(db, ctx.actor, "staff.create", "staff", id, { after: { email, name, roleId } });
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/staff");
  return { ok: true, message: `Invite created for ${email}. Send them this one-time link (valid 30 minutes) — no email service is connected, so it isn’t sent automatically.`, link: resetLink(token) };
}

export async function updateStaffAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePerm("staff.edit");
  const id = String(fd.get("id"));
  const op = String(fd.get("op"));
  let link: string | undefined;
  try {
    await withDb((db) => {
      const u = db.staff.find((s) => s.id === id);
      if (!u) throw new Error("Staff member not found.");
      const current = findRole(rolesOf(db), u.roleId);
      // Nobody can manage an account that has more access than they do.
      if (current && !canGrant(ctx.role, current)) throw new Error("You can’t change an account with more access than your own.");
      const superAdmins = db.staff.filter((s) => s.active && s.roleId === "super_admin");
      const isLastSuper = u.roleId === "super_admin" && u.active && superAdmins.length <= 1;
      switch (op) {
        case "role": {
          const role = findRole(rolesOf(db), String(fd.get("roleId")));
          if (!role) throw new Error("Choose a role.");
          if (!canGrant(ctx.role, role)) throw new Error("You can’t assign a role with more access than your own.");
          if (isLastSuper && role.id !== "super_admin") throw new Error("Keep at least one active Super Admin.");
          audit(db, ctx.actor, "staff.role", "staff", id, { before: { roleId: u.roleId }, after: { roleId: role.id } });
          u.roleId = role.id;
          // Role changes take effect immediately: end their sessions.
          db.sessions.forEach((s) => s.staffId === id && !s.revokedAt && (s.revokedAt = new Date().toISOString()));
          break;
        }
        case "deactivate":
          if (id === ctx.staff.id) throw new Error("You can’t deactivate yourself.");
          if (isLastSuper) throw new Error("Keep at least one active Super Admin.");
          u.active = false;
          db.sessions.forEach((s) => s.staffId === id && !s.revokedAt && (s.revokedAt = new Date().toISOString()));
          audit(db, ctx.actor, "staff.deactivate", "staff", id);
          break;
        case "activate":
          u.active = true;
          audit(db, ctx.actor, "staff.activate", "staff", id);
          break;
        case "unlock":
          u.lockedUntil = null;
          u.failedLogins = 0;
          audit(db, ctx.actor, "staff.unlock", "staff", id);
          break;
        case "revoke":
          db.sessions.forEach((s) => s.staffId === id && !s.revokedAt && (s.revokedAt = new Date().toISOString()));
          audit(db, ctx.actor, "staff.revoke_sessions", "staff", id);
          break;
        case "reset": {
          const t = newResetToken();
          u.resetTokenHash = t.hash;
          u.resetTokenExpires = t.expires;
          link = resetLink(t.token);
          audit(db, ctx.actor, "staff.reset_link", "staff", id);
          break;
        }
        case "reset_mfa":
          u.mfaSecret = null;
          u.mfaPending = null;
          audit(db, ctx.actor, "staff.reset_mfa", "staff", id);
          break;
        default:
          throw new Error("Unknown action.");
      }
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/staff");
  return { ok: true, message: link ? "One-time password reset link (valid 30 minutes). Share it with them privately:" : "Saved.", link };
}

// ---------- Roles ----------

export async function saveRoleAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requirePerm("staff.manage");
  const id = String(fd.get("id") ?? "");
  const name = String(fd.get("name") ?? "").trim().slice(0, 40);
  const description = String(fd.get("description") ?? "").trim().slice(0, 160);
  const permissions = fd.getAll("perm").map(String).filter(isPermission);
  if (name.length < 3) return { error: "Name the role (3+ characters)." };
  if (!permissions.length) return { error: "Give the role at least one permission." };
  if (!permissions.every((p) => ctx.role.permissions.includes(p))) return { error: "You can only grant permissions you have yourself." };
  if (BUILT_IN_ROLES.some((r) => r.name.toLowerCase() === name.toLowerCase())) return { error: "That name is used by a built-in role." };
  try {
    await withDb((db) => {
      const privileged = permissions.some((p) => ["orders.refund", "staff.manage", "staff.edit", "system.manage", "finance.manage"].includes(p));
      if (id) {
        const r = db.roles.find((x) => x.id === id);
        if (!r) throw new Error("Role not found.");
        audit(db, ctx.actor, "role.update", "role", id, { before: r, after: { name, description, permissions } });
        Object.assign(r, { name, description, permissions, privileged });
        db.sessions.forEach((s) => !s.revokedAt && db.staff.find((u) => u.id === s.staffId)?.roleId === id && s.staffId !== ctx.staff.id && (s.revokedAt = new Date().toISOString()));
      } else {
        const newId = `role_${crypto.randomBytes(4).toString("hex")}`;
        db.roles.push({ id: newId, name, description, permissions, privileged });
        audit(db, ctx.actor, "role.create", "role", newId, { after: { name, permissions } });
      }
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/staff");
  redirect("/admin/staff/roles?saved=1");
}

export async function deleteRoleAction(fd: FormData) {
  const ctx = await requirePerm("staff.manage");
  const id = String(fd.get("id"));
  await withDb((db) => {
    if (db.staff.some((s) => s.roleId === id)) return;
    const i = db.roles.findIndex((r) => r.id === id);
    if (i >= 0) {
      db.roles.splice(i, 1);
      audit(db, ctx.actor, "role.delete", "role", id);
    }
  });
  revalidatePath("/admin/staff/roles");
}

// ---------- My account ----------

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireStaff();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next !== String(fd.get("confirm") ?? "")) return { error: "The new passwords don’t match." };
  const problem = passwordProblem(next, ctx.staff.email);
  if (problem) return { error: problem };
  const ok = await withDb((db) => {
    const u = db.staff.find((s) => s.id === ctx.staff.id)!;
    if (!verifyPassword(current, u.passwordHash)) return false;
    u.passwordHash = hashPassword(next);
    // Ends every session (including this one) issued before now.
    u.passwordChangedAt = new Date(Date.now() + 1000).toISOString();
    audit(db, ctx.actor, "staff.password_change", "staff", u.id);
    return true;
  });
  if (!ok) return { error: "Your current password is incorrect." };
  redirect("/admin/login?changed=1");
}

export async function mfaStartAction(_: FormState): Promise<FormState> {
  const ctx = await requireStaff();
  const secret = newTotpSecret();
  await withDb((db) => {
    db.staff.find((s) => s.id === ctx.staff.id)!.mfaPending = secret;
  });
  revalidatePath("/admin/security");
  return { ok: true, secret };
}

export async function mfaConfirmAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireStaff();
  const code = String(fd.get("code") ?? "").trim();
  const ok = await withDb((db) => {
    const u = db.staff.find((s) => s.id === ctx.staff.id)!;
    if (!u.mfaPending || !verifyTotp(u.mfaPending, code)) return false;
    u.mfaSecret = u.mfaPending;
    u.mfaPending = null;
    audit(db, ctx.actor, "staff.mfa_enable", "staff", u.id);
    return true;
  });
  if (!ok) return { error: "That code didn’t match. Check the time on your phone and try the newest code." };
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Two-step sign-in is on. You’ll need a code from your app each time you sign in." };
}

export async function mfaDisableAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireStaff();
  const password = String(fd.get("password") ?? "");
  const ok = await withDb((db) => {
    const u = db.staff.find((s) => s.id === ctx.staff.id)!;
    if (!verifyPassword(password, u.passwordHash)) return false;
    u.mfaSecret = null;
    audit(db, ctx.actor, "staff.mfa_disable", "staff", u.id);
    return true;
  });
  if (!ok) return { error: "Password is incorrect." };
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Two-step sign-in is off." };
}

export async function revokeSessionAction(fd: FormData) {
  const ctx = await requireStaff();
  const which = String(fd.get("session"));
  await withDb((db) => {
    for (const s of db.sessions) {
      if (s.staffId !== ctx.staff.id || s.revokedAt) continue;
      if (which === "others" ? s.idHash !== ctx.sessionHash : s.idHash.slice(0, 12) === which) s.revokedAt = new Date().toISOString();
    }
    audit(db, ctx.actor, "staff.revoke_own_sessions", "staff", ctx.staff.id, { after: { which: which === "others" ? "others" : "one" } });
  });
  revalidatePath("/admin/security");
}

// ---------- Password reset (public, token-gated) ----------

export async function resetPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const token = String(fd.get("token") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next !== String(fd.get("confirm") ?? "")) return { error: "The passwords don’t match." };
  if (!token || token.length > 100) return { error: "This link is invalid or has expired. Ask a Super Admin for a new one." };
  const h = hashToken(token);
  const res = await withDb((db): FormState => {
    const u = db.staff.find((s) => s.resetTokenHash === h);
    if (!u || !u.resetTokenExpires || Date.parse(u.resetTokenExpires) < Date.now()) return { error: "This link is invalid or has expired. Ask a Super Admin for a new one." };
    const problem = passwordProblem(next, u.email);
    if (problem) return { error: problem };
    u.passwordHash = hashPassword(next);
    u.passwordChangedAt = new Date().toISOString();
    u.resetTokenHash = null;
    u.resetTokenExpires = null;
    u.lockedUntil = null;
    u.failedLogins = 0;
    audit(db, { id: u.id, name: u.name }, "staff.password_reset", "staff", u.id);
    return { ok: true };
  });
  if (!res?.ok) return res;
  if (await getStaff()) redirect("/admin");
  redirect("/admin/login?reset=1");
}
