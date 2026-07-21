"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  FORECASTS,
  OWNERS,
  SEGMENTS,
  SOURCES,
  STAGES,
  SUBSETS,
  SUBSET_TO_SOURCE,
  baht,
} from "@/lib/constants";
import { roleLabel } from "@/lib/roles";
import type {
  Attachment,
  Opportunity,
  OpportunityRemark,
  Profile,
} from "@/lib/types";
import { StagePill } from "@/components/ui";
import { deleteOpportunity } from "@/app/(app)/opportunities/actions";

const BUCKET = "attachments";

type MemberRow = { id: string; profile_id: string };
type MiniProfile = Pick<Profile, "id" | "full_name" | "email" | "role">;

function initials(p?: MiniProfile): string {
  const s = p?.full_name || p?.email || "?";
  return s.trim().slice(0, 2).toUpperCase();
}
function humanSize(n: number | null): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function OpportunityDetailModal({
  opp,
  profile,
  onClose,
}: {
  opp: Opportunity;
  profile: Profile;
  onClose: () => void;
}) {
  const supabase = useRef(createClient()).current;
  const router = useRouter();
  const today = new Date().toLocaleDateString("en-CA");

  const [notes, setNotes] = useState(opp.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // editable deal fields
  const [form, setForm] = useState({
    product: opp.product ?? "",
    owner: opp.owner ?? "",
    segment: opp.segment ?? "",
    source: opp.source ?? "Media",
    subset: opp.subset ?? "efinancethai",
    stage: opp.stage,
    forecast: opp.forecast ?? "Pipeline",
    amount: Number(opp.amount ?? 0),
    probability: opp.probability ?? null,
    month: opp.month ?? "",
    close_date: opp.close_date ?? "",
    next_action_date: opp.next_action_date ?? "",
    next_action: opp.next_action ?? "",
    qt_no: opp.qt_no ?? "",
    so_no: opp.so_no ?? "",
    invoice_status: opp.invoice_status ?? "",
    invoice_no: opp.invoice_no ?? "",
    invoice_date: opp.invoice_date ?? "",
    payment_status: opp.payment_status ?? "",
    paid_date: opp.paid_date ?? "",
  });
  const [savingDeal, setSavingDeal] = useState(false);
  const [dealSaved, setDealSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function removeDeal() {
    if (
      !confirm(
        `ลบดีล "${opp.account_name}" (฿${baht(form.amount)}) ออกถาวร?\nรวมถึงบันทึกติดตามงานและผู้เกี่ยวข้องของดีลนี้`
      )
    )
      return;
    setDeleting(true);
    const res = await deleteOpportunity(opp.id);
    if (res.error) {
      setErr(`ลบไม่สำเร็จ: ${res.error}`);
      setDeleting(false);
      return;
    }
    onClose();
    router.refresh();
  }
  function patch(p: Partial<typeof form>) {
    setForm((f) => ({ ...f, ...p }));
  }

  async function saveDeal() {
    setSavingDeal(true);
    setDealSaved(false);
    setErr(null);
    const { error } = await supabase
      .from("opportunities")
      .update({
        product: form.product,
        owner: form.owner || null,
        segment: form.segment || null,
        source: form.source || null,
        subset: form.subset || null,
        stage: form.stage,
        forecast: form.forecast || null,
        amount: Number(form.amount) || 0,
        probability: form.probability,
        month: form.month || null,
        close_date: form.close_date || null,
        next_action_date: form.next_action_date || null,
        next_action: form.next_action || null,
        qt_no: form.qt_no || null,
        so_no: form.so_no || null,
        invoice_status: form.invoice_status || null,
        invoice_no: form.invoice_no || null,
        invoice_date: form.invoice_date || null,
        payment_status: form.payment_status || null,
        paid_date: form.paid_date || null,
      })
      .eq("id", opp.id);
    setSavingDeal(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setDealSaved(true);
    setTimeout(() => setDealSaved(false), 2000);
    router.refresh(); // update Kanban / table / account views in the background
  }

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [allProfiles, setAllProfiles] = useState<MiniProfile[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const [files, setFiles] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [remarks, setRemarks] = useState<OpportunityRemark[]>([]);
  const [rText, setRText] = useState("");
  const [rDate, setRDate] = useState(today);
  const [savingRemark, setSavingRemark] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const profById = new Map(allProfiles.map((p) => [p.id, p]));

  const loadMembers = useCallback(async () => {
    const { data } = await supabase
      .from("opportunity_members")
      .select("id, profile_id")
      .eq("opportunity_id", opp.id);
    setMembers((data ?? []) as MemberRow[]);
  }, [supabase, opp.id]);

  const loadFiles = useCallback(async () => {
    if (!opp.account_id) return;
    const { data } = await supabase
      .from("attachments")
      .select("*")
      .eq("account_id", opp.account_id)
      .order("created_at", { ascending: false });
    setFiles((data ?? []) as Attachment[]);
  }, [supabase, opp.account_id]);

  const loadRemarks = useCallback(async () => {
    const { data } = await supabase
      .from("opportunity_remarks")
      .select("*")
      .eq("opportunity_id", opp.id)
      .order("remark_date", { ascending: false })
      .order("created_at", { ascending: false });
    setRemarks((data ?? []) as OpportunityRemark[]);
  }, [supabase, opp.id]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .then(({ data }) => setAllProfiles((data ?? []) as MiniProfile[]));
    loadMembers();
    loadFiles();
    loadRemarks();
  }, [supabase, loadMembers, loadFiles, loadRemarks]);

  async function saveNotes() {
    setSavingNotes(true);
    setNotesSaved(false);
    const { error } = await supabase
      .from("opportunities")
      .update({ notes })
      .eq("id", opp.id);
    setSavingNotes(false);
    if (error) setErr(error.message);
    else {
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    }
  }

  async function addMember(profileId: string) {
    setErr(null);
    const { error } = await supabase.from("opportunity_members").insert({
      opportunity_id: opp.id,
      profile_id: profileId,
      created_by: profile.id,
    });
    if (error) setErr(error.message);
    await loadMembers();
  }
  async function removeMember(rowId: string) {
    await supabase.from("opportunity_members").delete().eq("id", rowId);
    await loadMembers();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !opp.account_id) return;
    setErr(null);
    setUploading(true);
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${opp.account_id}/${crypto.randomUUID()}-${safe}`;
    const up = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || undefined,
    });
    if (up.error) {
      setErr(`อัปโหลดไม่สำเร็จ: ${up.error.message}`);
      setUploading(false);
      return;
    }
    const ins = await supabase.from("attachments").insert({
      account_id: opp.account_id,
      file_name: file.name,
      storage_path: path,
      content_type: file.type || null,
      size: file.size,
      uploaded_by: profile.id,
    });
    if (ins.error) {
      await supabase.storage.from(BUCKET).remove([path]);
      setErr(`บันทึกไม่สำเร็จ: ${ins.error.message}`);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    await loadFiles();
  }
  async function downloadFile(a: Attachment) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(a.storage_path, 60);
    if (error || !data) return alert(`เปิดไฟล์ไม่สำเร็จ`);
    window.open(data.signedUrl, "_blank");
  }
  async function deleteFile(a: Attachment) {
    if (!confirm(`ลบไฟล์ "${a.file_name}"?`)) return;
    await supabase.storage.from(BUCKET).remove([a.storage_path]);
    await supabase.from("attachments").delete().eq("id", a.id);
    await loadFiles();
  }

  async function addRemark(e: React.FormEvent) {
    e.preventDefault();
    if (!rText.trim()) return;
    setSavingRemark(true);
    const { error } = await supabase.from("opportunity_remarks").insert({
      opportunity_id: opp.id,
      remark: rText.trim(),
      remark_date: rDate,
      author_name: profile.full_name || profile.email,
      created_by: profile.id,
    });
    setSavingRemark(false);
    if (error) return setErr(error.message);
    setRText("");
    setRDate(today);
    await loadRemarks();
  }
  async function deleteRemark(id: string) {
    if (!confirm("ลบบันทึกนี้?")) return;
    await supabase.from("opportunity_remarks").delete().eq("id", id);
    await loadRemarks();
  }

  const memberProfiles = members
    .map((m) => ({ row: m, p: profById.get(m.profile_id) }))
    .filter((x) => x.p);
  const untagged = allProfiles.filter(
    (p) => !members.some((m) => m.profile_id === p.id)
  );

  const label = "mb-1 block text-xs font-semibold text-muted";
  const fieldCls =
    "w-full rounded-lg border border-line px-2 py-1.5 text-sm outline-none focus:border-brand";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-6 w-full max-w-4xl rounded-2xl bg-surface shadow-xl">
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="min-w-0">
            {opp.account_id ? (
              <Link
                href={`/accounts/${opp.account_id}`}
                className="text-lg font-bold text-navy hover:text-brand hover:underline"
                title="ดูข้อมูลบริษัทนี้ทั้งหมด"
              >
                {opp.account_name}
              </Link>
            ) : (
              <h2 className="text-lg font-bold text-navy">{opp.account_name}</h2>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
              <StagePill stage={form.stage} />
              {form.product && <span>{form.product}</span>}
              <span>· ฿{baht(form.amount)}</span>
              {form.owner && <span>· owner: {form.owner}</span>}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={removeDeal}
              disabled={deleting}
              className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? "กำลังลบ..." : "ลบดีล"}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-line px-3 py-1 text-sm hover:bg-bg"
            >
              ปิด
            </button>
          </div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-3">
          {/* main column */}
          <div className="space-y-5 lg:col-span-2">
            {/* Members */}
            <section>
              <label className={label}>Members (ผู้เกี่ยวข้อง)</label>
              <div className="flex flex-wrap items-center gap-2">
                {memberProfiles.map(({ row, p }) => (
                  <span
                    key={row.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-soft py-0.5 pl-0.5 pr-2 text-xs"
                    title={p!.full_name || p!.email || ""}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                      {initials(p!)}
                    </span>
                    <span className="max-w-[120px] truncate">
                      {p!.full_name || p!.email}
                    </span>
                    <button
                      onClick={() => removeMember(row.id)}
                      className="text-muted hover:text-red-500"
                      title="เอาออก"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <div className="relative">
                  <button
                    onClick={() => setShowPicker((v) => !v)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-line text-muted hover:border-brand hover:text-brand"
                    title="เพิ่มผู้เกี่ยวข้อง"
                  >
                    +
                  </button>
                  {showPicker && (
                    <div className="absolute z-10 mt-1 max-h-56 w-60 overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-lg">
                      {untagged.length === 0 ? (
                        <p className="px-2 py-1.5 text-xs text-muted">
                          เพิ่มครบทุกคนแล้ว
                        </p>
                      ) : (
                        untagged.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              addMember(p.id);
                              setShowPicker(false);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-bg"
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                              {initials(p)}
                            </span>
                            <span className="min-w-0 truncate">
                              {p.full_name || p.email}
                              <span className="ml-1 text-[10px] text-muted">
                                {roleLabel(p.role)}
                              </span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Editable deal fields */}
            <section>
              <label className={label}>รายละเอียดดีล (แก้ไขได้)</label>
              <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-bg p-3">
                <div className="col-span-2">
                  <span className="mb-1 block text-[11px] text-muted">Product / แพ็ก</span>
                  <input
                    value={form.product}
                    onChange={(e) => patch({ product: e.target.value })}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-muted">มูลค่า (บาท)</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => patch({ amount: Number(e.target.value) })}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-muted">Probability (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.probability ?? ""}
                    onChange={(e) =>
                      patch({
                        probability:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className={fieldCls}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-muted">Stage</span>
                  <select
                    value={form.stage}
                    onChange={(e) => patch({ stage: e.target.value as typeof form.stage })}
                    className={fieldCls}
                  >
                    {STAGES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-muted">Forecast</span>
                  <select
                    value={form.forecast}
                    onChange={(e) => patch({ forecast: e.target.value })}
                    className={fieldCls}
                  >
                    {FORECASTS.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-muted">Subset</span>
                  <select
                    value={form.subset}
                    onChange={(e) =>
                      patch({
                        subset: e.target.value as typeof form.subset,
                        source: (SUBSET_TO_SOURCE[e.target.value] ??
                          form.source) as typeof form.source,
                      })
                    }
                    className={fieldCls}
                  >
                    {SUBSETS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-muted">Source</span>
                  <select
                    value={form.source}
                    onChange={(e) => patch({ source: e.target.value as typeof form.source })}
                    className={fieldCls}
                  >
                    {SOURCES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-muted">Owner (AE)</span>
                  <select
                    value={form.owner}
                    onChange={(e) => patch({ owner: e.target.value })}
                    className={fieldCls}
                  >
                    <option value="">—</option>
                    {OWNERS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-muted">Segment</span>
                  <select
                    value={form.segment}
                    onChange={(e) => patch({ segment: e.target.value })}
                    className={fieldCls}
                  >
                    <option value="">—</option>
                    {SEGMENTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-muted">Close date</span>
                  <input
                    type="date"
                    value={form.close_date}
                    onChange={(e) => patch({ close_date: e.target.value })}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-muted">Next action date</span>
                  <input
                    type="date"
                    value={form.next_action_date}
                    onChange={(e) => patch({ next_action_date: e.target.value })}
                    className={fieldCls}
                  />
                </div>
                <div className="col-span-2">
                  <span className="mb-1 block text-[11px] text-muted">Next action</span>
                  <input
                    value={form.next_action}
                    onChange={(e) => patch({ next_action: e.target.value })}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-muted">QT No.</span>
                  <input
                    value={form.qt_no}
                    onChange={(e) => patch({ qt_no: e.target.value })}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-muted">SO No.</span>
                  <input
                    value={form.so_no}
                    onChange={(e) => patch({ so_no: e.target.value })}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-muted">สถานะวางบิล</span>
                  <input
                    value={form.invoice_status}
                    onChange={(e) => patch({ invoice_status: e.target.value })}
                    className={fieldCls}
                    placeholder="เช่น Invoiced / Not Invoiced"
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-muted">สถานะชำระเงิน</span>
                  <input
                    value={form.payment_status}
                    onChange={(e) => patch({ payment_status: e.target.value })}
                    className={fieldCls}
                    placeholder="เช่น Paid / Waiting Payment"
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={saveDeal}
                  disabled={savingDeal}
                  className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {savingDeal ? "กำลังบันทึก..." : "บันทึกรายละเอียดดีล"}
                </button>
                {dealSaved && <span className="text-xs text-brand">บันทึกแล้ว ✓</span>}
              </div>
            </section>

            {/* Description (editable) */}
            <section>
              <label className={label}>Description</label>
              <textarea
                rows={8}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                placeholder="รายละเอียดดีล / ที่อยู่วางบิล / รายการที่เสนอ ฯลฯ"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={saveNotes}
                  disabled={savingNotes}
                  className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {savingNotes ? "กำลังบันทึก..." : "บันทึก Description"}
                </button>
                {notesSaved && (
                  <span className="text-xs text-brand">บันทึกแล้ว ✓</span>
                )}
              </div>
            </section>

            {/* Attachment */}
            <section>
              <label className={label}>Attachment (ไฟล์ของบริษัทนี้)</label>
              {!opp.account_id ? (
                <p className="text-xs text-muted">
                  ดีลนี้ยังไม่ผูกกับบริษัท — ผูกบริษัทก่อนจึงแนบไฟล์ได้
                </p>
              ) : (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    id="opp-file"
                    onChange={onFile}
                    disabled={uploading}
                    className="hidden"
                  />
                  <label
                    htmlFor="opp-file"
                    className={`inline-block cursor-pointer rounded-lg border border-brand px-3 py-1.5 text-xs font-semibold text-navy hover:bg-soft ${
                      uploading ? "opacity-50" : ""
                    }`}
                  >
                    {uploading ? "กำลังอัปโหลด..." : "+ แนบไฟล์"}
                  </label>
                  {files.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {files.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-line/70 bg-bg p-2 text-sm"
                        >
                          <button
                            onClick={() => downloadFile(a)}
                            className="min-w-0 truncate font-medium text-navy hover:text-brand hover:underline"
                          >
                            {a.file_name}
                            <span className="ml-2 text-[10px] text-muted">
                              {humanSize(a.size)}
                            </span>
                          </button>
                          <button
                            onClick={() => deleteFile(a)}
                            className="shrink-0 text-[11px] text-red-500 hover:underline"
                          >
                            ลบ
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </section>

            {err && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {err}
              </p>
            )}
          </div>

          {/* activity column */}
          <div className="lg:col-span-1">
            <label className={label}>ติดตามงาน / Activity</label>
            <form onSubmit={addRemark} className="mb-3 space-y-2 rounded-xl bg-bg p-3">
              <input
                type="date"
                value={rDate}
                onChange={(e) => setRDate(e.target.value)}
                className="w-40 rounded-lg border border-line px-2 py-1 text-xs"
              />
              <textarea
                rows={3}
                value={rText}
                onChange={(e) => setRText(e.target.value)}
                className="w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand"
                placeholder="เช่น คุยลูกค้าใหม่ อยากได้สื่อ ยังไม่เสนอแพ็ก — ตามต่อสัปดาห์หน้า"
              />
              <button
                type="submit"
                disabled={savingRemark}
                className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {savingRemark ? "กำลังบันทึก..." : "+ เพิ่มบันทึก"}
              </button>
            </form>
            <ul className="space-y-2">
              {remarks.length === 0 ? (
                <li className="text-sm text-muted">ยังไม่มีบันทึกติดตามงาน</li>
              ) : (
                remarks.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-line/70 bg-bg p-2.5 text-sm"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-navy">
                        {r.remark_date} · {r.author_name || "—"}
                      </span>
                      {(r.created_by === profile.id || profile.role === "admin") && (
                        <button
                          onClick={() => deleteRemark(r.id)}
                          className="text-[11px] text-red-500 hover:underline"
                        >
                          ลบ
                        </button>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-[13px]">{r.remark}</p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
