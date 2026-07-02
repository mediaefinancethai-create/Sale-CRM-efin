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
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/login`,
  });
  if (error) return { error: error.message };

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
