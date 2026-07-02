"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface LeadInput {
  company: string;
  market: string;
  segment: string;
  client_status: string;
  relationship_level: string;
  listed_active: number;
  ipo_bond_pipeline: number;
  profitable: number;
  research_source: string;
  sale_action: string;
  fit: string;
  owner: string;
}

export async function createLead(input: LeadInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ไม่ได้เข้าสู่ระบบ" };

  const { error } = await supabase
    .from("leads")
    .insert({ ...input, created_by: user.id });
  revalidatePath("/leads");
  return { error: error?.message ?? null };
}

export async function updateLead(id: string, input: LeadInput) {
  const supabase = createClient();
  const { error } = await supabase.from("leads").update(input).eq("id", id);
  revalidatePath("/leads");
  return { error: error?.message ?? null };
}

export async function deleteLead(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("leads").delete().eq("id", id);
  revalidatePath("/leads");
  return { error: error?.message ?? null };
}

// convert lead → account (find-or-create by name) + prospecting opportunity, then remove lead
export async function convertLead(id: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ไม่ได้เข้าสู่ระบบ" };

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!lead) return { error: "ไม่พบ lead" };

  let accountId: string | null = null;
  const { data: existing } = await supabase
    .from("accounts")
    .select("id")
    .eq("name", lead.company)
    .maybeSingle();

  if (existing) {
    accountId = existing.id;
  } else {
    const { data: created, error: accErr } = await supabase
      .from("accounts")
      .insert({
        name: lead.company,
        segment: lead.segment || lead.market,
        owner: lead.owner,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (accErr) return { error: accErr.message };
    accountId = created.id;
  }

  const { data: maxRow } = await supabase
    .from("opportunities")
    .select("deal_no")
    .order("deal_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error: oppErr } = await supabase.from("opportunities").insert({
    account_id: accountId,
    account_name: lead.company,
    owner: lead.owner,
    segment: lead.segment || lead.market,
    stage: "Prospecting",
    forecast: "Pipeline",
    amount: 0,
    deal_no: (maxRow?.deal_no ?? 0) + 1,
    notes: `Converted from lead${lead.research_source ? ` — ${lead.research_source}` : ""}`,
    created_by: user.id,
  });
  if (oppErr) return { error: oppErr.message };

  const { error: delErr } = await supabase.from("leads").delete().eq("id", id);
  revalidatePath("/leads");
  revalidatePath("/opportunities");
  revalidatePath("/accounts");
  return { error: delErr?.message ?? null };
}
