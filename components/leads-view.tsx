"use client";

import { useState, useTransition } from "react";
import {
  CLIENT_STATUSES,
  OWNERS,
  RELATIONSHIP_LEVELS,
  SEGMENTS,
} from "@/lib/constants";
import { leadSaleAction, leadScore, leadStatus } from "@/lib/lead-score";
import { canModify } from "@/lib/rbac";
import type { Lead, Profile } from "@/lib/types";
import { Card, Kpi } from "@/components/ui";
import {
  convertLead,
  createLead,
  deleteLead,
  updateLead,
  type LeadInput,
} from "@/app/(app)/leads/actions";

export function LeadsView({
  profile,
  leads,
}: {
  profile: Profile;
  leads: Lead[];
}) {
  const [editing, setEditing] = useState<Lead | null>(null);
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  const avg = leads.length
    ? Math.round(leads.reduce((s, l) => s + leadScore(l), 0) / leads.length)
    : 0;
  const qualified = leads.filter((l) => leadStatus(l) === "Qualified").length;
  const watchlist = leads.filter((l) => leadStatus(l) === "Watchlist").length;
  const actionNow = leads.filter((l) =>
    ["Qualified", "Warm Lead"].includes(leadStatus(l))
  ).length;

  function onConvert(l: Lead) {
    if (!confirm(`แปลง "${l.company}" เป็น opportunity?`)) return;
    startTransition(async () => {
      const res = await convertLead(l.id);
      if (res.error) alert(`แปลงไม่สำเร็จ: ${res.error}`);
    });
  }

  function onDelete(l: Lead) {
    if (!confirm(`ลบ lead "${l.company}"?`)) return;
    startTransition(async () => {
      const res = await deleteLead(l.id);
      if (res.error) alert(`ลบไม่สำเร็จ: ${res.error}`);
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-navy">Lead Quality</h1>
          <p className="text-sm text-muted">
            คะแนนคุณภาพ lead · จัดลำดับการติดตาม
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + เพิ่ม Lead
        </button>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Qualified Leads"
          value={String(qualified)}
          note="พร้อม pitch Media/Event"
        />
        <Kpi
          label="Watchlist"
          value={String(watchlist)}
          note="ต้องหาหลักฐานเพิ่ม"
        />
        <Kpi label="Avg Score" value={String(avg)} note="เต็ม 100" />
        <Kpi
          label="Sale Action"
          value={String(actionNow)}
          note="ควรโทร/มอบหมายทันที"
        />
      </div>

      <Card title="รายการ Lead" pill={`${leads.length} รายการ`}>
        {leads.length === 0 ? (
          <p className="text-sm text-muted">
            ยังไม่มี lead — กด &quot;+ เพิ่ม Lead&quot; เพื่อเริ่มต้น
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="pb-2 pr-2">บริษัท</th>
                  <th className="pb-2 pr-2">Market</th>
                  <th className="pb-2 pr-2">Trigger</th>
                  <th className="pb-2 pr-2">สถานะ</th>
                  <th className="pb-2 pr-2">ลูกค้า</th>
                  <th className="pb-2 pr-2">ความสัมพันธ์</th>
                  <th className="pb-2 pr-2">Sale Action</th>
                  <th className="pb-2 pr-2">Owner</th>
                  <th className="pb-2 pr-2 text-right">คะแนน</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {leads
                  .slice()
                  .sort((a, b) => leadScore(b) - leadScore(a))
                  .map((l) => {
                    const status = leadStatus(l);
                    const editable = canModify(profile, l.created_by);
                    return (
                      <tr key={l.id} className="border-b border-line/60 align-top">
                        <td className="py-2 pr-2 font-medium">{l.company}</td>
                        <td className="py-2 pr-2">{l.market || l.segment || "—"}</td>
                        <td className="max-w-[220px] py-2 pr-2 text-xs text-muted">
                          {l.research_source || "—"}
                        </td>
                        <td className="py-2 pr-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              status === "Qualified"
                                ? "bg-brand/15 text-navy"
                                : status === "Warm Lead"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-soft text-muted"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-xs">{l.client_status || "—"}</td>
                        <td className="py-2 pr-2 text-xs">{l.relationship_level || "—"}</td>
                        <td className="max-w-[220px] py-2 pr-2 text-xs text-muted">
                          {leadSaleAction(l)}
                        </td>
                        <td className="py-2 pr-2">{l.owner || "—"}</td>
                        <td className="py-2 pr-2 text-right font-bold text-navy">
                          {leadScore(l)}
                        </td>
                        <td className="py-2 text-right">
                          <span className="inline-flex gap-1">
                            <button
                              onClick={() => onConvert(l)}
                              disabled={isPending}
                              className="rounded border border-brand px-2 py-0.5 text-[11px] text-navy hover:bg-soft"
                            >
                              Convert
                            </button>
                            {editable && (
                              <>
                                <button
                                  onClick={() => setEditing(l)}
                                  className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-brand"
                                >
                                  แก้ไข
                                </button>
                                <button
                                  onClick={() => onDelete(l)}
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
        )}
      </Card>

      {(adding || editing) && (
        <LeadFormModal
          initial={editing}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function LeadFormModal({
  initial,
  onClose,
}: {
  initial: Lead | null;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<LeadInput>({
    company: initial?.company ?? "",
    market: initial?.market ?? "",
    segment: initial?.segment ?? "",
    client_status: initial?.client_status ?? "New or no current purchase",
    relationship_level: initial?.relationship_level ?? "None",
    listed_active: initial?.listed_active ?? 0,
    ipo_bond_pipeline: initial?.ipo_bond_pipeline ?? 0,
    profitable: initial?.profitable ?? 0,
    research_source: initial?.research_source ?? "",
    sale_action: initial?.sale_action ?? "",
    fit: initial?.fit ?? "",
    owner: initial?.owner ?? "",
  });

  function patch(p: Partial<LeadInput>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = initial
        ? await updateLead(initial.id, form)
        : await createLead(form);
      if (res.error) setError(res.error);
      else onClose();
    });
  }

  const input =
    "w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand";
  const label = "mb-1 block text-xs font-medium text-muted";
  const checkbox = "h-4 w-4 accent-[var(--blue)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl">
        <h2 className="mb-4 text-base font-bold text-navy">
          {initial ? "แก้ไข Lead" : "เพิ่ม Lead ใหม่"}
        </h2>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={label}>ชื่อบริษัท</label>
            <input
              required
              value={form.company}
              onChange={(e) => patch({ company: e.target.value })}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Market</label>
            <input
              value={form.market}
              onChange={(e) => patch({ market: e.target.value })}
              className={input}
              placeholder="เช่น ESG / Other"
            />
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
          <div>
            <label className={label}>สถานะลูกค้า</label>
            <select
              value={form.client_status}
              onChange={(e) => patch({ client_status: e.target.value })}
              className={input}
            >
              {CLIENT_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>ระดับความสัมพันธ์</label>
            <select
              value={form.relationship_level}
              onChange={(e) => patch({ relationship_level: e.target.value })}
              className={input}
            >
              {RELATIONSHIP_LEVELS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 grid grid-cols-3 gap-2 rounded-xl bg-bg p-3">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={form.listed_active === 1}
                onChange={(e) =>
                  patch({ listed_active: e.target.checked ? 1 : 0 })
                }
                className={checkbox}
              />
              มีข่าว/ความเคลื่อนไหว (+20)
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={form.ipo_bond_pipeline === 1}
                onChange={(e) =>
                  patch({ ipo_bond_pipeline: e.target.checked ? 1 : 0 })
                }
                className={checkbox}
              />
              มี IPO/Bond pipeline (+20)
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={form.profitable === 1}
                onChange={(e) => patch({ profitable: e.target.checked ? 1 : 0 })}
                className={checkbox}
              />
              ผลประกอบการกำไร (+20)
            </label>
          </div>
          <div className="col-span-2">
            <label className={label}>Trigger / แหล่งข้อมูล</label>
            <input
              value={form.research_source}
              onChange={(e) => patch({ research_source: e.target.value })}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Sale Action (กำหนดเอง — เว้นว่างให้ระบบแนะนำ)</label>
            <input
              value={form.sale_action}
              onChange={(e) => patch({ sale_action: e.target.value })}
              className={input}
            />
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
