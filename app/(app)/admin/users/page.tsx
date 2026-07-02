import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { UsersView } from "@/components/users-view";

export default async function AdminUsersPage() {
  const me = await requireAdmin();
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  return <UsersView me={me} users={(data ?? []) as Profile[]} />;
}
