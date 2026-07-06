import type { Profile } from "@/lib/types";

// UI-side permission helpers. RLS at the database is the real enforcement —
// these only decide what to show/enable in the UI.

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === "admin";
}

// Any authenticated user may edit/delete business data (accounts, opportunities,
// contacts, notes, packages, leads). Enforced at the DB by RLS too.
// User management stays admin-only and is gated separately (requireAdmin).
export function canModify(
  profile: Profile | null,
  _createdBy?: string | null
): boolean {
  return !!profile;
}
