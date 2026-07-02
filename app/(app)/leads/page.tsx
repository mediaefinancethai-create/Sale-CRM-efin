import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { Lead } from "@/lib/types";
import { LeadsView } from "@/components/leads-view";

export default async function LeadsPage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: true });

  return <LeadsView profile={profile} leads={(data ?? []) as Lead[]} />;
}
