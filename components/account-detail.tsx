"use client";

import { useState, useTransition } from "react";
import { NOTE_TYPES } from "@/lib/constants";
import { canModify } from "@/lib/rbac";
import type { AccountContact, AccountNote, Profile } from "@/lib/types";
import { Card } from "@/components/ui";
import {
  createContact,
  createNote,
  deleteContact,
  deleteNote,
  updateContact,
  type ContactInput,
  type NoteInput,
} from "@/app/(app)/accounts/actions";

const inputCls =
  "w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand";
const labelCls = "mb-1 block text-xs font-medium text-muted";

// ---------- Contacts ----------

export function ContactsSection({
  profile,
  accountId,
  contacts,
}: {
  profile: Profile;
  accountId: string;
  contacts: AccountContact[];
}) {
  const [editing, setEditing] = useState<AccountContact | null>(null);
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();

  function onDelete(c: AccountContact) {
    if (!confirm(`ลบผู้ติดต่อ "${c.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteContact(c.id, accountId);
      if (res.error) alert(`ลบไม่สำเร็จ: ${res.error}`);
    });
  }

  return (
    <Card title="ผู้ติดต่อประสานงาน" pill={`${contacts.length} คน`}>
      {contacts.length === 0 ? (
        <p className="mb-3 text-sm text-muted">ยังไม่มีผู้ติดต่อ</p>
      ) : (
        <div className="mb-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="pb-2 pr-2">ชื่อ</th>
                <th className="pb-2 pr-2">ตำแหน่ง</th>
                <th className="pb-2 pr-2">เบอร์</th>
                <th className="pb-2 pr-2">อีเมล</th>
                <th className="pb-2 pr-2">Line</th>
                <th className="pb-2 pr-2">Primary</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => {
                const editable = canModify(profile, c.created_by);
                return (
                  <tr key={c.id} className="border-b border-line/60">
                    <td className="py-2 pr-2 font-medium">{c.name}</td>
                    <td className="py-2 pr-2">{c.role || "—"}</td>
                    <td className="py-2 pr-2">{c.phone || "—"}</td>
                    <td className="py-2 pr-2">{c.email || "—"}</td>
                    <td className="py-2 pr-2">{c.line || "—"}</td>
                    <td className="py-2 pr-2">
                      {c.is_primary ? (
                        <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-medium text-navy">
                          Primary
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {editable && (
                        <span className="inline-flex gap-1">
                          <button
                            onClick={() => setEditing(c)}
                            className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-brand"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => onDelete(c)}
                            className="rounded border border-line px-2 py-0.5 text-[11px] text-red-600 hover:border-red-400"
                          >
                            ลบ
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <button
        onClick={() => setAdding(true)}
        className="rounded-lg border border-brand px-3 py-1.5 text-xs font-semibold text-navy hover:bg-soft"
      >
        + Add Contact
      </button>

      {(adding || editing) && (
        <ContactFormModal
          accountId={accountId}
          initial={editing}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      )}
    </Card>
  );
}

function ContactFormModal({
  accountId,
  initial,
  onClose,
}: {
  accountId: string;
  initial: AccountContact | null;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ContactInput>({
    name: initial?.name ?? "",
    role: initial?.role ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    line: initial?.line ?? "",
    is_primary: initial?.is_primary ?? false,
    note: initial?.note ?? "",
  });

  function patch(p: Partial<ContactInput>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = initial
        ? await updateContact(initial.id, accountId, form)
        : await createContact(accountId, form);
      if (res.error) setError(res.error);
      else onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl">
        <h2 className="mb-4 text-base font-bold text-navy">
          {initial ? "แก้ไขผู้ติดต่อ" : "เพิ่มผู้ติดต่อ"}
        </h2>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>ชื่อ</label>
            <input
              required
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>ตำแหน่ง</label>
            <input
              value={form.role}
              onChange={(e) => patch({ role: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>เบอร์โทร</label>
            <input
              value={form.phone}
              onChange={(e) => patch({ phone: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>อีเมล</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => patch({ email: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Line ID</label>
            <input
              value={form.line}
              onChange={(e) => patch({ line: e.target.value })}
              className={inputCls}
            />
          </div>
          <div className="flex items-end pb-1.5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_primary}
                onChange={(e) => patch({ is_primary: e.target.checked })}
                className="h-4 w-4 accent-[var(--blue)]"
              />
              ผู้ติดต่อหลัก (Primary)
            </label>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>หมายเหตุ</label>
            <input
              value={form.note}
              onChange={(e) => patch({ note: e.target.value })}
              className={inputCls}
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

// ---------- Daily AE Notes ----------

export function NotesSection({
  profile,
  accountId,
  notes,
}: {
  profile: Profile;
  accountId: string;
  notes: AccountNote[];
}) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const today = new Date().toLocaleDateString("en-CA");
  const [form, setForm] = useState<NoteInput>({
    note_date: today,
    type: "Call",
    note: "",
    next_follow_up: null,
    owner: profile.full_name || profile.email || "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createNote(accountId, form);
      if (res.error) setError(res.error);
      else {
        setAdding(false);
        setForm((f) => ({ ...f, note: "", next_follow_up: null }));
      }
    });
  }

  function onDelete(n: AccountNote) {
    if (!confirm("ลบโน้ตนี้?")) return;
    startTransition(async () => {
      const res = await deleteNote(n.id, accountId);
      if (res.error) alert(`ลบไม่สำเร็จ: ${res.error}`);
    });
  }

  return (
    <Card title="Daily AE Notes" pill={`${notes.length} รายการ (ล่าสุดก่อน)`}>
      <div className="mb-3">
        {adding ? (
          <form
            onSubmit={submit}
            className="grid grid-cols-2 gap-3 rounded-xl bg-bg p-3 md:grid-cols-4"
          >
            <div>
              <label className={labelCls}>วันที่</label>
              <input
                type="date"
                required
                value={form.note_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, note_date: e.target.value }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>ประเภท</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value }))
                }
                className={inputCls}
              >
                {NOTE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>นัดตามต่อ (ถ้ามี)</label>
              <input
                type="date"
                value={form.next_follow_up ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    next_follow_up: e.target.value || null,
                  }))
                }
                className={inputCls}
              />
            </div>
            <div className="col-span-2 md:col-span-4">
              <label className={labelCls}>บันทึก</label>
              <textarea
                required
                rows={2}
                value={form.note}
                onChange={(e) =>
                  setForm((f) => ({ ...f, note: e.target.value }))
                }
                className={inputCls}
              />
            </div>
            {error && (
              <p className="col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 md:col-span-4">
                {error}
              </p>
            )}
            <div className="col-span-2 flex gap-2 md:col-span-4">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? "กำลังบันทึก..." : "บันทึกโน้ต"}
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-lg border border-line px-4 py-1.5 text-xs hover:bg-bg"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="rounded-lg border border-brand px-3 py-1.5 text-xs font-semibold text-navy hover:bg-soft"
          >
            + Add Note
          </button>
        )}
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted">ยังไม่มีบันทึก</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-xl border border-line/70 bg-bg p-3 text-sm"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-navy">
                  {n.note_date} · {n.type || "Note"} · {n.owner || "—"}
                </span>
                <span className="flex items-center gap-2">
                  {n.next_follow_up && (
                    <span className="rounded-full bg-soft px-2 py-0.5 text-[11px] text-navy">
                      ตามต่อ {n.next_follow_up}
                    </span>
                  )}
                  {canModify(profile, n.created_by) && (
                    <button
                      onClick={() => onDelete(n)}
                      className="text-[11px] text-red-500 hover:underline"
                    >
                      ลบ
                    </button>
                  )}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{n.note}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
