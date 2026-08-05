import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import type {
  Account,
  AccountContact,
  AccountNote,
  Attachment,
  Opportunity,
} from "@/lib/types";
import { ContactsSection, NotesSection } from "@/components/account-detail";
import { AttachmentsSection } from "@/components/attachments-section";
import { AccountDeals } from "@/components/account-deals";

export default async function AccountDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!account) notFound();

  // deals fetched with service role so EVERY role sees all of this account's
  // deals equally on the Account page (the Opportunities module still scopes
  // Staff to their own deals via RLS).
  const admin = createAdminClient();

  const [{ data: contacts }, { data: notes }, { data: deals }, { data: files }] =
    await Promise.all([
      supabase
        .from("account_contacts")
        .select("*")
        .eq("account_id", params.id)
        .order("is_primary", { ascending: false })
        .order("created_at"),
      supabase
        .from("account_notes")
        .select("*")
        .eq("account_id", params.id)
        .order("note_date", { ascending: false })
        .order("created_at", { ascending: false }),
      // ALL deals of this account (many orders / bills / quotations), all roles equal
      admin
        .from("opportunities")
        .select("*")
        .eq("account_id", params.id)
        .order("deal_no", { ascending: true }),
      supabase
        .from("attachments")
        .select("*")
        .eq("account_id", params.id)
        .order("created_at", { ascending: false }),
    ]);

  const acc = account as Account;

  return (
    <div className="space-y-5">
      <header>
        <Link href="/accounts" className="text-xs text-muted hover:text-brand">
          ← กลับไปหน้า Accounts
        </Link>
        <h1 className="mt-1 text-lg font-bold text-navy">{acc.name}</h1>
        <p className="text-sm text-muted">
          {[acc.symbol, acc.segment, acc.tier, `owner: ${acc.owner || "—"}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {acc.notes && <p className="mt-1 text-sm text-muted">{acc.notes}</p>}
      </header>

      <ContactsSection
        profile={profile}
        accountId={acc.id}
        contacts={(contacts ?? []) as AccountContact[]}
      />

      <AccountDeals profile={profile} deals={(deals ?? []) as Opportunity[]} />

      <AttachmentsSection
        accountId={acc.id}
        attachments={(files ?? []) as Attachment[]}
      />

      <NotesSection
        profile={profile}
        accountId={acc.id}
        notes={(notes ?? []) as AccountNote[]}
      />
    </div>
  );
}
