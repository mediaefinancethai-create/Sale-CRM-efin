import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { Account, Opportunity } from "@/lib/types";
import { OpportunitiesView } from "@/components/opportunities-view";

export default async function OpportunitiesPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const [{ data: opps }, { data: accounts }] = await Promise.all([
    supabase
      .from("opportunities")
      .select("*")
      .order("deal_no", { ascending: true }),
    supabase.from("accounts").select("id, name, legacy_id, segment").order("name"),
  ]);

  return (
    <OpportunitiesView
      profile={profile}
      opportunities={(opps ?? []) as Opportunity[]}
      accounts={(accounts ?? []) as Pick<Account, "id" | "name" | "legacy_id" | "segment">[]}
    />
  );
}
