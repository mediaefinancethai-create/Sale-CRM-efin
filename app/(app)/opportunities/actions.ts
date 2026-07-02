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

export async function createOpportunity(input: OppInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ไม่ได้เข้าสู่ระบบ" };

  const { data: maxRow } = await supabase
    .from("opportunities")
    .select("deal_no")
    .order("deal_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("opportunities").insert({
    ...input,
    deal_no: (maxRow?.deal_no ?? 0) + 1,
    created_by: user.id,
  });
  revalidatePath("/opportunities");
  revalidatePath("/dashboard");
  return { error: error?.message ?? null };
}

export async function updateOpportunity(id: string, input: OppInput) {
  const supabase = createClient();
  const { error } = await supabase
    .from("opportunities")
    .update(input)
    .eq("id", id);
  revalidatePath("/opportunities");
  revalidatePath("/dashboard");
  return { error: error?.message ?? null };
}

export async function deleteOpportunity(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("opportunities").delete().eq("id", id);
  revalidatePath("/opportunities");
  revalidatePath("/dashboard");
  return { error: error?.message ?? null };
}
