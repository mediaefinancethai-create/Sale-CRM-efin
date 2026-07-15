"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OpportunityRemark } from "@/lib/types";
import {
  FORECASTS,
  KANBAN_LANES,
  OWNERS,
  SEGMENTS,
  SOURCES,
  STAGES,
  SUBSETS,
  SUBSET_TO_SOURCE,
  baht,
  type Stage,
} from "@/lib/constants";
import { canModify } from "@/lib/rbac";
import type { Account, Opportunity, Profile } from "@/lib/types";
import { Card, StagePill } from "@/components/ui";
import { OpportunityDetailModal } from "@/components/opportunity-detail-modal";
import {
  createOpportunity,
  deleteOpportunity,
  moveOppStage,
  updateOpportunity,
  type OppInput,
} from "@/app/(app)/opportunities/actions";

type AccountLite = Pick<Account, "id" | "name" | "legacy_id" | "segment">;

interface Filters {
  month: string;
  owner: string;
  source: string;
  subset: string;
  stage: string;
  search: string;
}

const EMPTY_FILTERS: Filters = {
  month: "",
  owner: "",
  source: "",
  subset: "",
  stage: "",
  search: "",
};

export function OpportunitiesView({
  profile,
  opportunities,
  accounts,
}: {
  profile: Profile;
  opportunities: Opportunity[];
  accounts: AccountLite[];
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [adding, setAdding] = useState(false);
  const [remarkOpp, setRemarkOpp] = useState<Opportunity | null>(null);
  const [detailOpp, setDetailOpp] = useState<Opportunity | null>(null);
  const [isPending, startTransition] = useTransition();

  const months = useMemo(
    () => [...new Set(opportunities.map((o) => o.month).filter(Boolean))] as string[],
    [opportunities]
  );

  // all filters except stage — used for chip counts (per prototype oppsForStageChips)
  const preStage = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return opportunities.filter((o) => {
      if (filters.month && o.month !== filters.month) return false;
      if (filters.owner && o.owner !== filters.owner) return false;
      if (filters.source && o.source !== filters.source) return false;
      if (filters.subset && o.subset !== filters.subset) return false;
      if (
        q &&
        !`${o.account_name} ${o.product} ${o.notes} ${o.owner}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [opportunities, filters]);

  const filtered = useMemo(
    () =>
      filters.stage
        ? preStage.filter((o) => o.stage === filters.stage)
        : preStage,
    [preStage, filters.stage]
  );

  const chipCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of preStage) counts.set(o.stage, (counts.get(o.stage) ?? 0) + 1);
    return counts;
  }, [preStage]);

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function onDrop(stage: Stage, e: React.DragEvent) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    startTransition(async () => {
      const res = await moveOppStage(id, stage);
      if (res.error) alert(`ย้าย stage ไม่สำเร็จ: ${res.error}`);
    });
  }

  function onDelete(o: Opportunity) {
    if (!confirm(`ลบดีล "${o.account_name}" (฿${baht(o.amount)})?`)) return;
    startTransition(async () => {
      const res = await deleteOpportunity(o.id);
      if (res.error) alert(`ลบไม่สำเร็จ: ${res.error}`);
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-navy">Opportunities</h1>
          <p className="text-sm text-muted">
            Pipeline · stage · forecast · next action
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + เพิ่มดีล
        </button>
      </header>

      {/* filter bar */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filters.month}
          onChange={(e) => set("month", e.target.value)}
          className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm"
        >
          <option value="">ทุกเดือน</option>
          {months.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select
          value={filters.owner}
          onChange={(e) => set("owner", e.target.value)}
          className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm"
        >
          <option value="">ทุก owner</option>
          {OWNERS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <select
          value={filters.source}
          onChange={(e) => set("source", e.target.value)}
          className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm"
        >
          <option value="">ทุก source</option>
          {SOURCES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.subset}
          onChange={(e) => set("subset", e.target.value)}
          className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm"
        >
          <option value="">ทุก subset</option>
          {SUBSETS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="ค้นหา ลูกค้า/สินค้า/โน้ต..."
          className="min-w-[200px] flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm"
        />
      </div>

      {/* stage chips — only stages with deals + "ทั้งหมด" */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => set("stage", "")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !filters.stage
              ? "bg-brand text-white"
              : "border border-line bg-surface text-ink hover:border-brand"
          }`}
        >
          ทั้งหมด ({preStage.length})
        </button>
        {STAGES.filter((s) => (chipCounts.get(s) ?? 0) > 0).map((s) => (
          <button
            key={s}
            onClick={() => set("stage", filters.stage === s ? "" : s)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filters.stage === s
                ? "bg-brand text-white"
                : "border border-line bg-surface text-ink hover:border-brand"
            }`}
          >
            {s} ({chipCounts.get(s)})
          </button>
        ))}
      </div>

      {/* Kanban */}
      <Card title="Kanban" pill={isPending ? "กำลังบันทึก..." : "ลากการ์ดเพื่อเปลี่ยน stage"}>
        <div className="grid gap-3 overflow-x-auto md:grid-cols-6">
          {KANBAN_LANES.map((lane) => {
            const cards = filtered.filter((o) => o.stage === lane);
            const laneValue = cards.reduce((s, o) => s + Number(o.amount || 0), 0);
            return (
              <div
                key={lane}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(lane, e)}
                className="min-h-[180px] rounded-xl bg-bg p-2"
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-navy">{lane}</span>
                  <span className="text-[10px] text-muted">
                    {cards.length} · ฿{baht(laneValue)}
                  </span>
                </div>
                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {cards.map((o) => (
                    <div
                      key={o.id}
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", o.id)
                      }
                      className="cursor-grab rounded-lg border border-line bg-surface p-2.5 text-xs shadow-sm active:cursor-grabbing"
                    >
                      <button
                        onClick={() => setDetailOpp(o)}
                        className="mb-1 line-clamp-2 text-left font-semibold text-navy hover:text-brand hover:underline"
                        title="เปิดรายละเอียดดีล"
                      >
                        {o.account_name}
                      </button>
                      <div className="text-muted">{o.product}</div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="font-bold text-navy">
                          ฿{baht(o.amount)}
                        </span>
                        <span className="text-[10px] text-muted">{o.owner}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* table */}
      <Card title="ตารางดีล" pill={`${filtered.length} รายการ`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="pb-2 pr-2">#</th>
                <th className="pb-2 pr-2">ลูกค้า</th>
                <th className="pb-2 pr-2">Owner</th>
                <th className="pb-2 pr-2">Product</th>
                <th className="pb-2 pr-2">Source/Subset</th>
                <th className="pb-2 pr-2">Stage</th>
                <th className="pb-2 pr-2 text-right">มูลค่า</th>
                <th className="pb-2 pr-2">Forecast</th>
                <th className="pb-2 pr-2">Next Action</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const editable = canModify(profile, o.created_by);
                return (
                  <tr key={o.id} className="border-b border-line/60 align-top">
                    <td className="py-2 pr-2 text-muted">{o.deal_no}</td>
                    <td className="py-2 pr-2 font-medium">
                      {o.account_id ? (
                        <Link
                          href={`/accounts/${o.account_id}`}
                          className="hover:text-brand hover:underline"
                          title="ดูข้อมูลบริษัทนี้ทั้งหมด"
                        >
                          {o.account_name}
                        </Link>
                      ) : (
                        o.account_name
                      )}
                    </td>
                    <td className="py-2 pr-2">{o.owner || "—"}</td>
                    <td className="py-2 pr-2">{o.product}</td>
                    <td className="py-2 pr-2 text-xs text-muted">
                      {o.source} / {o.subset}
                    </td>
                    <td className="py-2 pr-2">
                      <StagePill stage={o.stage} />
                    </td>
                    <td className="py-2 pr-2 text-right font-medium">
                      ฿{baht(o.amount)}
                    </td>
                    <td className="py-2 pr-2 text-xs">{o.forecast}</td>
                    <td className="py-2 pr-2 text-xs text-muted">
                      {o.next_action_date ? `${o.next_action_date} · ` : ""}
                      {o.next_action || "—"}
                    </td>
                    <td className="py-2 text-right">
                      <span className="inline-flex gap-1">
                        <button
                          onClick={() => setRemarkOpp(o)}
                          className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-brand"
                          title="บันทึกการติดตามงาน"
                        >
                          ติดตามงาน
                        </button>
                        {editable && (
                          <>
                            <button
                              onClick={() => setEditing(o)}
                              className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-brand"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => onDelete(o)}
                              className="rounded border border-line px-2 py-0.5 text-[11px] text-red-600 hover:border-red-400"
                            >
                              ลบ
                            </button>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {(adding || editing) && (
        <OppFormModal
          accounts={accounts}
          initial={editing}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      )}

      {remarkOpp && (
        <RemarkModal
          opp={remarkOpp}
          profile={profile}
          onClose={() => setRemarkOpp(null)}
        />
      )}

      {detailOpp && (
        <OpportunityDetailModal
          opp={detailOpp}
          profile={profile}
          onClose={() => setDetailOpp(null)}
        />
      )}
    </div>
  );
}

// ---------- Remark / follow-up timeline per deal ----------

function RemarkModal({
  opp,
  profile,
  onClose,
}: {
  opp: Opportunity;
  profile: Profile;
  onClose: () => void;
}) {
  const today = new Date().toLocaleDateString("en-CA");
  const [remarks, setRemarks] = useState<OpportunityRemark[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [date, setDate] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("opportunity_remarks")
      .select("*")
      .eq("opportunity_id", opp.id)
      .order("remark_date", { ascending: false })
      .order("created_at", { ascending: false });
    setRemarks((data ?? []) as OpportunityRemark[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opp.id]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!text.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("opportunity_remarks").insert({
      opportunity_id: opp.id,
      remark: text.trim(),
      remark_date: date,
      author_name: profile.full_name || profile.email,
      created_by: profile.id,
    });
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    setText("");
    setDate(today);
    await load();
    setSaving(false);
  }

  async function del(id: string) {
    if (!confirm("ลบบันทึกนี้?")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("opportunity_remarks")
      .delete()
      .eq("id", id);
    if (error) {
      alert(`ลบไม่สำเร็จ: ${error.message}`);
      return;
    }
    await load();
  }

  const input =
    "w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-surface p-6 shadow-xl">
        <h2 className="text-base font-bold text-navy">ติดตามงาน (Remark)</h2>
        <p className="mb-4 text-xs text-muted">
          {opp.account_name}
          {opp.product ? ` · ${opp.product}` : ""} · stage {opp.stage}
        </p>

        <form onSubmit={add} className="mb-4 space-y-2 rounded-xl bg-bg p-3">
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40 rounded-lg border border-line px-2.5 py-1.5 text-sm"
            />
          </div>
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={input}
            placeholder="เช่น วันนี้คุยลูกค้าใหม่ อยากได้สื่อประชาสัมพันธ์ ยังไม่เสนอแพ็กเกจ — นัดตามต่อสัปดาห์หน้า"
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "+ เพิ่มบันทึก"}
          </button>
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted">กำลังโหลด...</p>
          ) : remarks.length === 0 ? (
            <p className="text-sm text-muted">
              ยังไม่มีบันทึกติดตามงาน — เริ่มบันทึกความคืบหน้าได้เลย
            </p>
          ) : (
            <ul className="space-y-2">
              {remarks.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-line/70 bg-bg p-3 text-sm"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-navy">
                      {r.remark_date} · {r.author_name || "—"}
                    </span>
                    {r.created_by === profile.id || profile.role === "admin" ? (
                      <button
                        onClick={() => del(r.id)}
                        className="text-[11px] text-red-500 hover:underline"
                      >
                        ลบ
                      </button>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-wrap">{r.remark}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-bg"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- add/edit modal ----------

function OppFormModal({
  accounts,
  initial,
  onClose,
}: {
  accounts: AccountLite[];
  initial: Opportunity | null;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<OppInput>({
    account_id: initial?.account_id ?? null,
    account_name: initial?.account_name ?? "",
    owner: initial?.owner ?? "",
    segment: initial?.segment ?? "",
    product: initial?.product ?? "",
    source: initial?.source ?? "Media",
    subset: initial?.subset ?? "efinancethai",
    stage: initial?.stage ?? "Prospecting",
    amount: Number(initial?.amount ?? 0),
    probability: initial?.probability ?? null,
    forecast: initial?.forecast ?? "Pipeline",
    month: initial?.month ?? "",
    week: initial?.week ?? "",
    close_date: initial?.close_date ?? null,
    next_action_date: initial?.next_action_date ?? null,
    next_action: initial?.next_action ?? "",
    qt_no: initial?.qt_no ?? "",
    so_no: initial?.so_no ?? "",
    notes: initial?.notes ?? "",
  });

  function patch(p: Partial<OppInput>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = initial
        ? await updateOpportunity(initial.id, form)
        : await createOpportunity(form);
      if (res.error) setError(res.error);
      else onClose();
    });
  }

  const input =
    "w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand";
  const label = "mb-1 block text-xs font-medium text-muted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl">
        <h2 className="mb-4 text-base font-bold text-navy">
          {initial ? `แก้ไขดีล #${initial.deal_no}` : "เพิ่มดีลใหม่"}
        </h2>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={label}>ลูกค้า (Account)</label>
            <select
              required
              value={form.account_id ?? ""}
              onChange={(e) => {
                const acc = accounts.find((a) => a.id === e.target.value);
                patch({
                  account_id: acc?.id ?? null,
                  account_name: acc?.name ?? "",
                  segment: acc?.segment ?? form.segment,
                });
              }}
              className={input}
            >
              <option value="">— เลือกลูกค้า —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Owner (AE)</label>
            <select
              value={form.owner}
              onChange={(e) => patch({ owner: e.target.value })}
              className={input}
            >
              <option value="">—</option>
              {OWNERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Segment</label>
            <select
              value={form.segment}
              onChange={(e) => patch({ segment: e.target.value })}
              className={input}
            >
              <option value="">—</option>
              {SEGMENTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className={label}>Product</label>
            <input
              required
              value={form.product}
              onChange={(e) => patch({ product: e.target.value })}
              className={input}
              placeholder="เช่น BT-Media, Media Package, IPO Package"
            />
          </div>
          <div>
            <label className={label}>Subset</label>
            <select
              value={form.subset}
              onChange={(e) => {
                const subset = e.target.value;
                patch({
                  subset,
                  source: SUBSET_TO_SOURCE[subset] ?? form.source,
                });
              }}
              className={input}
            >
              {SUBSETS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Source (ตาม mapping)</label>
            <select
              value={form.source}
              onChange={(e) => patch({ source: e.target.value })}
              className={input}
            >
              {SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Stage</label>
            <select
              value={form.stage}
              onChange={(e) => patch({ stage: e.target.value })}
              className={input}
            >
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Forecast</label>
            <select
              value={form.forecast}
              onChange={(e) => patch({ forecast: e.target.value })}
              className={input}
            >
              {FORECASTS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>มูลค่า (บาท)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => patch({ amount: Number(e.target.value) })}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Probability (%)</label>
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
              className={input}
            />
          </div>
          <div>
            <label className={label}>Month (เช่น Mar-2026)</label>
            <input
              value={form.month}
              onChange={(e) => patch({ month: e.target.value })}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Close Date</label>
            <input
              type="date"
              value={form.close_date ?? ""}
              onChange={(e) => patch({ close_date: e.target.value || null })}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Next Action Date</label>
            <input
              type="date"
              value={form.next_action_date ?? ""}
              onChange={(e) =>
                patch({ next_action_date: e.target.value || null })
              }
              className={input}
            />
          </div>
          <div>
            <label className={label}>Next Action</label>
            <input
              value={form.next_action}
              onChange={(e) => patch({ next_action: e.target.value })}
              className={input}
            />
          </div>
          <div>
            <label className={label}>QT No.</label>
            <input
              value={form.qt_no}
              onChange={(e) => patch({ qt_no: e.target.value })}
              className={input}
            />
          </div>
          <div>
            <label className={label}>SO No.</label>
            <input
              value={form.so_no}
              onChange={(e) => patch({ so_no: e.target.value })}
              className={input}
            />
          </div>
          <div className="col-span-2">
            <label className={label}>Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              className={input}
            />
          </div>

          {error && (
            <p className="col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="col-span-2 mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-bg"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
