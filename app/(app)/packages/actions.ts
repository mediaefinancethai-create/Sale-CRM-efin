"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface IdeaInput {
  name: string;
  price: number;
  components: string;
  best_for: string;
}

export async function addIdeaPackage(input: IdeaInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ไม่ได้เข้าสู่ระบบ" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("idea_packages").insert({
    ...input,
    owner: profile?.full_name || profile?.email || "",
    created_by: user.id,
  });
  revalidatePath("/packages");
  return { error: error?.message ?? null };
}

export async function deleteIdeaPackage(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("idea_packages").delete().eq("id", id);
  revalidatePath("/packages");
  return { error: error?.message ?? null };
}
