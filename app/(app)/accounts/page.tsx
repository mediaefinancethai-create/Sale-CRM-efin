import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { Account } from "@/lib/types";
import { AccountsView } from "@/components/accounts-view";

export default async function AccountsPage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .order("legacy_id", { ascending: true });

  return (
    <AccountsView profile={profile} accounts={(data ?? []) as Account[]} />
  );
}
