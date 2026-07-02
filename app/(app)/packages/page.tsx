import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { IdeaPackage, Opportunity, Package } from "@/lib/types";
import { PackagesView } from "@/components/packages-view";

export default async function PackagesPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const [{ data: packages }, { data: ideas }, { data: wonOpps }] =
    await Promise.all([
      supabase.from("packages").select("*").order("list_price"),
      supabase
        .from("idea_packages")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase
        .from("opportunities")
        .select("product, amount, account_name, subset")
        .eq("stage", "Closed Won"),
    ]);

  return (
    <PackagesView
      profile={profile}
      packages={(packages ?? []) as Package[]}
      ideas={(ideas ?? []) as IdeaPackage[]}
      wonOpps={(wonOpps ?? []) as Pick<
        Opportunity,
        "product" | "amount" | "account_name" | "subset"
      >[]}
    />
  );
}
