import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { baht } from "@/lib/constants";
import type {
  Account,
  AccountContact,
  AccountNote,
  Attachment,
  Opportunity,
} from "@/lib/types";
import { Card } from "@/components/ui";
import { ContactsSection, NotesSection } from "@/components/account-detail";
import { AttachmentsSection } from "@/components/attachments-section";

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

  const [{ data: contacts }, { data: notes }, { data: wonOpps }, { data: files }] =
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
      supabase
        .from("opportunities")
        .select("*")
        .eq("account_id", params.id)
        .eq("stage", "Closed Won")
        .order("close_date", { ascending: false }),
      supabase
        .from("attachments")
        .select("*")
        .eq("account_id", params.id)
        .order("created_at", { ascending: false }),
    ]);

  const acc = account as Account;
  const history = (wonOpps ?? []) as Opportunity[];

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

      <Card
        title="Product & Service History"
        pill={`${history.length} รายการ (Closed Won)`}
      >
        {history.length === 0 ? (
          <p className="text-sm text-muted">ยังไม่มีประวัติการซื้อ</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="pb-2 pr-2">วันปิด</th>
                  <th className="pb-2 pr-2">สินค้า</th>
                  <th className="pb-2 pr-2">Source/Subset</th>
                  <th className="pb-2 pr-2 text-right">มูลค่า</th>
                  <th className="pb-2">สถานะบิล</th>
                </tr>
              </thead>
              <tbody>
                {history.map((o) => (
                  <tr key={o.id} className="border-b border-line/60">
                    <td className="py-2 pr-2 whitespace-nowrap">
                      {o.close_date || "—"}
                    </td>
                    <td className="py-2 pr-2">{o.product}</td>
                    <td className="py-2 pr-2 text-xs text-muted">
                      {o.source} / {o.subset}
                    </td>
                    <td className="py-2 pr-2 text-right font-medium">
                      ฿{baht(o.amount)}
                    </td>
                    <td className="py-2 text-xs text-muted">
                      {o.invoice_status || o.next_action || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
