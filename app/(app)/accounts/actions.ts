"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ---------- accounts ----------

export interface AccountInput {
  name: string;
  symbol: string;
  segment: string;
  tier: string;
  status: string;
  owner: string;
  notes: string;
}

export async function createAccount(input: AccountInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ไม่ได้เข้าสู่ระบบ" };

  const { error } = await supabase
    .from("accounts")
    .insert({ ...input, created_by: user.id });
  revalidatePath("/accounts");
  return { error: error?.message ?? null };
}

export async function updateAccount(id: string, input: AccountInput) {
  const supabase = createClient();
  const { error } = await supabase.from("accounts").update(input).eq("id", id);
  revalidatePath("/accounts");
  revalidatePath(`/accounts/${id}`);
  return { error: error?.message ?? null };
}

export async function deleteAccount(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  revalidatePath("/accounts");
  return { error: error?.message ?? null };
}

// ---------- contacts ----------

export interface ContactInput {
  name: string;
  role: string;
  phone: string;
  email: string;
  line: string;
  is_primary: boolean;
  note: string;
}

export async function createContact(accountId: string, input: ContactInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ไม่ได้เข้าสู่ระบบ" };

  const { error } = await supabase
    .from("account_contacts")
    .insert({ ...input, account_id: accountId, created_by: user.id });
  revalidatePath(`/accounts/${accountId}`);
  return { error: error?.message ?? null };
}

export async function updateContact(
  id: string,
  accountId: string,
  input: ContactInput
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("account_contacts")
    .update(input)
    .eq("id", id);
  revalidatePath(`/accounts/${accountId}`);
  return { error: error?.message ?? null };
}

export async function deleteContact(id: string, accountId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("account_contacts")
    .delete()
    .eq("id", id);
  revalidatePath(`/accounts/${accountId}`);
  return { error: error?.message ?? null };
}

// ---------- AE notes ----------

export interface NoteInput {
  note_date: string;
  type: string;
  note: string;
  next_follow_up: string | null;
  owner: string;
}

export async function createNote(accountId: string, input: NoteInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ไม่ได้เข้าสู่ระบบ" };

  const { error } = await supabase
    .from("account_notes")
    .insert({ ...input, account_id: accountId, created_by: user.id });
  revalidatePath(`/accounts/${accountId}`);
  return { error: error?.message ?? null };
}

export async function deleteNote(id: string, accountId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("account_notes").delete().eq("id", id);
  revalidatePath(`/accounts/${accountId}`);
  return { error: error?.message ?? null };
}
