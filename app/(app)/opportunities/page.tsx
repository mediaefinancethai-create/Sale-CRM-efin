import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { Account, Opportunity, Profile } from "@/lib/types";
import { OpportunitiesView } from "@/components/opportunities-view";

export type OwnerUser = Pick<Profile, "id" | "full_name" | "email" | "role">;

export default async function OpportunitiesPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const [{ data: opps }, { data: accounts }, { data: users }] =
    await Promise.all([
      supabase
        .from("opportunities")
        .select("*")
        .order("deal_no", { ascending: true }),
      supabase
        .from("accounts")
        .select("id, name, legacy_id, segment")
        .order("name"),
      supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .order("full_name"),
    ]);

  return (
    <OpportunitiesView
      profile={profile}
      opportunities={(opps ?? []) as Opportunity[]}
      accounts={(accounts ?? []) as Pick<Account, "id" | "name" | "legacy_id" | "segment">[]}
      users={(users ?? []) as OwnerUser[]}
    />
  );
}
