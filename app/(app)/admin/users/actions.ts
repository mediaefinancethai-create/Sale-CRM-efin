"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import type { Role } from "@/lib/types";

// Invite a new user by email. Admin-only; runs with service role on the server.
export async function inviteUser(email: string, fullName: string, role: Role) {
  await requireAdmin(); // hard guard — throws/redirects if not admin

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/update-password`,
  });
  if (error) {
    const raw = (error.message || "").trim();
    // GoTrue returns 500 with an empty body ("{}") when the invite email
    // cannot be sent (SMTP not configured / rate limited / delivery failed)
    const emailFailed =
      raw === "" ||
      raw === "{}" ||
      error.status === 500 ||
      /rate limit|sending|smtp|email/i.test(raw);
    return {
      error: emailFailed
        ? "ส่งอีเมลเชิญไม่สำเร็จ — ระบบอีเมลยังไม่พร้อม (ยังไม่ได้ตั้ง SMTP หรือติด rate limit) กรุณาตั้ง custom SMTP หรือให้แอดมินสร้างผู้ใช้พร้อมรหัสผ่านแทน"
        : raw,
    };
  }

  // set requested role on the auto-created profile (trigger defaults to 'staff')
  if (role === "admin" && data.user) {
    const { error: roleErr } = await admin
      .from("profiles")
      .update({ role })
      .eq("id", data.user.id);
    if (roleErr) return { error: roleErr.message };
  }

  revalidatePath("/admin/users");
  return { error: null };
}

// Create a user directly with a password (no email link). Admin-only.
// Reliable onboarding when corporate email scanners consume invite links.
export async function createUserWithPassword(
  email: string,
  fullName: string,
  role: Role,
  password: string
) {
  await requireAdmin();
  if (password.length < 8)
    return { error: "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร" };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification
    user_metadata: { full_name: fullName },
  });
  if (error) {
    return {
      error: /already|registered|exists/i.test(error.message)
        ? "มีผู้ใช้อีเมลนี้อยู่แล้ว"
        : error.message,
    };
  }

  // ensure profile + requested role (trigger defaults to 'staff')
  if (data.user) {
    const { error: roleErr } = await admin
      .from("profiles")
      .upsert(
        { id: data.user.id, email, full_name: fullName, role },
        { onConflict: "id" }
      );
    if (roleErr) return { error: roleErr.message };
  }

  revalidatePath("/admin/users");
  return { error: null };
}

export async function setUserRole(userId: string, role: Role) {
  const me = await requireAdmin();
  if (userId === me.id)
    return { error: "ไม่สามารถเปลี่ยน role ของตัวเองได้" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  revalidatePath("/admin/users");
  return { error: error?.message ?? null };
}

// Permanently delete a user (any role). Admin-only; cascades to their profile.
export async function deleteUser(userId: string) {
  const me = await requireAdmin();
  if (userId === me.id) return { error: "ไม่สามารถลบบัญชีของตัวเองได้" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  revalidatePath("/admin/users");
  return { error: error?.message ?? null };
}

// Change a user's display name. Admin-only.
export async function setUserName(userId: string, fullName: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId);
  // keep auth metadata in sync (best-effort)
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { full_name: fullName },
  });
  revalidatePath("/admin/users");
  return { error: error?.message ?? null };
}

// Set/reset a user's password. Admin-only; runs with service role on the server.
export async function setUserPassword(userId: string, newPassword: string) {
  await requireAdmin();
  if (newPassword.length < 8)
    return { error: "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  return { error: error?.message ?? null };
}
