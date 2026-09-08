"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STAGES, type Stage } from "@/lib/constants";

// Kanban drop → persist stage (Closed Won forces probability/forecast, per prototype)
export async function moveOppStage(id: string, stage: Stage) {
  if (!STAGES.includes(stage)) return { error: "invalid stage" };
  const supabase = createClient();

  const patch: Record<string, unknown> = { stage };
  if (stage === "Closed Won") {
    patch.probability = 100;
    patch.forecast = "Closed Won";
  }

  const { error } = await supabase
    .from("opportunities")
    .update(patch)
    .eq("id", id);
  revalidatePath("/opportunities");
  revalidatePath("/dashboard");
  return { error: error?.message ?? null };
}

export interface OppInput {
  account_id: string | null;
  account_name: string;
  owner: string;
  segment: string;
  product: string;
  source: string;
  subset: string;
  stage: string;
  amount: number;
  probability: number | null;
  forecast: string;
  month: string;
  week: string;
  close_date: string | null;
  next_action_date: string | null;
  next_action: string;
  qt_no: string;
  so_no: string;
  notes: string;
}

// Resolve the account for a deal: use the picked account_id, else find an
// existing account by name, else create a brand-new account (inline add).
async function resolveAccountId(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  input: OppInput
): Promise<{ id: string | null; error: string | null }> {
  if (input.account_id) return { id: input.account_id, error: null };
  const name = input.account_name?.trim();
  if (!name) return { id: null, error: null };

  const { data: existing } = await supabase
    .from("accounts")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (existing) return { id: existing.id, error: null };

  const { data: created, error } = await supabase
    .from("accounts")
    .insert({
      name,
      segment: input.segment || null,
      owner: input.owner || null,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) return { id: null, error: `สร้างบัญชีใหม่ไม่สำเร็จ: ${error.message}` };
  return { id: created.id, error: null };
}

export async function createOpportunity(input: OppInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ไม่ได้เข้าสู่ระบบ" };

  const acc = await resolveAccountId(supabase, user.id, input);
  if (acc.error) return { error: acc.error };

  const { data: maxRow } = await supabase
    .from("opportunities")
    .select("deal_no")
    .order("deal_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("opportunities").insert({
    ...input,
    account_id: acc.id,
    deal_no: (maxRow?.deal_no ?? 0) + 1,
    created_by: user.id,
  });
  revalidatePath("/opportunities");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  return { error: error?.message ?? null };
}

export async function updateOpportunity(id: string, input: OppInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ไม่ได้เข้าสู่ระบบ" };

  const acc = await resolveAccountId(supabase, user.id, input);
  if (acc.error) return { error: acc.error };

  const { error } = await supabase
    .from("opportunities")
    .update({ ...input, account_id: acc.id })
    .eq("id", id);
  revalidatePath("/opportunities");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  return { error: error?.message ?? null };
}

export async function deleteOpportunity(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("opportunities").delete().eq("id", id);
  revalidatePath("/opportunities");
  revalidatePath("/dashboard");
  return { error: error?.message ?? null };
}
