"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { OWNERS, SEGMENTS } from "@/lib/constants";
import { canModify } from "@/lib/rbac";
import type { Account, Profile } from "@/lib/types";
import { Card } from "@/components/ui";
import {
  createAccount,
  deleteAccount,
  updateAccount,
  type AccountInput,
} from "@/app/(app)/accounts/actions";

export function AccountsView({
  profile,
  accounts,
}: {
  profile: Profile;
  accounts: Account[];
}) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Account | null>(null);
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((a) =>
      `${a.name} ${a.symbol} ${a.segment} ${a.owner}`.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  function onDelete(a: Account) {
    if (!confirm(`ลบบัญชี "${a.name}"? (ดีล/ผู้ติดต่อ/โน้ตของบัญชีนี้จะถูกลบด้วย)`))
      return;
    startTransition(async () => {
      const res = await deleteAccount(a.id);
      if (res.error) alert(`ลบไม่สำเร็จ: ${res.error}`);
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-navy">Accounts</h1>
          <p className="text-sm text-muted">ฐานลูกค้า/สปอนเซอร์</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + เพิ่มบัญชี
        </button>
      </header>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ค้นหา ชื่อบริษัท/symbol/segment/owner..."
        className="w-full max-w-md rounded-lg border border-line bg-surface px-3 py-2 text-sm"
      />

      <Card title="รายชื่อบัญชี" pill={`${filtered.length} รายการ`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="pb-2 pr-2">รหัส</th>
                <th className="pb-2 pr-2">ชื่อบริษัท</th>
                <th className="pb-2 pr-2">Symbol</th>
                <th className="pb-2 pr-2">Segment</th>
                <th className="pb-2 pr-2">Owner</th>
                <th className="pb-2 pr-2">สถานะ</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const editable = canModify(profile, a.created_by);
                return (
                  <tr key={a.id} className="border-b border-line/60">
                    <td className="py-2 pr-2 text-xs text-muted">
                      {a.legacy_id ?? a.id.slice(0, 8)}
                    </td>
                    <td className="py-2 pr-2">
                      <Link
                        href={`/accounts/${a.id}`}
                        className="font-medium hover:text-brand"
                      >
                        {a.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-2">{a.symbol || "—"}</td>
                    <td className="py-2 pr-2">{a.segment || "—"}</td>
                    <td className="py-2 pr-2">{a.owner || "—"}</td>
                    <td className="py-2 pr-2">
                      <span className="rounded-full bg-soft px-2 py-0.5 text-[11px] text-navy">
                        {a.status}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <span className="inline-flex gap-1">
                        <Link
                          href={`/accounts/${a.id}`}
                          className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-brand"
                        >
                          Detail
                        </Link>
                        {editable && (
                          <>
                            <button
                              onClick={() => setEditing(a)}
                              className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-brand"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => onDelete(a)}
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
        <AccountFormModal
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

function AccountFormModal({
  initial,
  onClose,
}: {
  initial: Account | null;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<AccountInput>({
    name: initial?.name ?? "",
    symbol: initial?.symbol ?? "",
    segment: initial?.segment ?? "",
    tier: initial?.tier ?? "",
    status: initial?.status ?? "Active",
    owner: initial?.owner ?? "",
    notes: initial?.notes ?? "",
  });

  function patch(p: Partial<AccountInput>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = initial
        ? await updateAccount(initial.id, form)
        : await createAccount(form);
      if (res.error) setError(res.error);
      else onClose();
    });
  }

  const input =
    "w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand";
  const label = "mb-1 block text-xs font-medium text-muted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl">
        <h2 className="mb-4 text-base font-bold text-navy">
          {initial ? "แก้ไขบัญชี" : "เพิ่มบัญชีใหม่"}
        </h2>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={label}>ชื่อบริษัท</label>
            <input
              required
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Symbol (ชื่อย่อหุ้น ถ้ามี)</label>
            <input
              value={form.symbol}
              onChange={(e) => patch({ symbol: e.target.value.toUpperCase() })}
              className={input}
              placeholder="เช่น PTT"
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
            <label className={label}>Tier</label>
            <input
              value={form.tier}
              onChange={(e) => patch({ tier: e.target.value })}
              className={input}
              placeholder="เช่น Strategic / Key Account"
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
          <div>
            <label className={label}>สถานะ</label>
            <select
              value={form.status}
              onChange={(e) => patch({ status: e.target.value })}
              className={input}
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
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
