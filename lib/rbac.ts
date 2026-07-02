import type { Profile } from "@/lib/types";

// UI-side permission helpers. RLS at the database is the real enforcement —
// these only decide what to show/enable in the UI.

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === "admin";
}

// staff can edit/delete only records they created; admin can do anything
export function canModify(
  profile: Profile | null,
  createdBy: string | null
): boolean {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  return createdBy !== null && createdBy === profile.id;
}
