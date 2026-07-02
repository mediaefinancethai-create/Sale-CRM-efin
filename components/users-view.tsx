"use client";

import { useState, useTransition } from "react";
import type { Profile, Role } from "@/lib/types";
import { Card } from "@/components/ui";
import {
  deleteUser,
  inviteUser,
  setUserPassword,
  setUserRole,
} from "@/app/(app)/admin/users/actions";

export function UsersView({
  me,
  users,
}: {
  me: Profile;
  users: Profile[];
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwUser, setPwUser] = useState<Profile | null>(null);
  const [isPending, startTransition] = useTransition();

  function invite(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await inviteUser(email, fullName, role);
      if (res.error) setMsg({ ok: false, text: res.error });
      else {
        setMsg({ ok: true, text: `ส่งคำเชิญไปที่ ${email} แล้ว` });
        setEmail("");
        setFullName("");
        setRole("staff");
      }
    });
  }

  function changeRole(userId: string, newRole: Role) {
    startTransition(async () => {
      const res = await setUserRole(userId, newRole);
      if (res.error) alert(`เปลี่ยน role ไม่สำเร็จ: ${res.error}`);
    });
  }

  function removeUser(u: Profile) {
    if (
      !confirm(
        `ลบผู้ใช้ "${u.email}" (${u.role}) ออกจากระบบถาวร?\nข้อมูลที่ผู้ใช้นี้สร้างจะยังอยู่ แต่จะเข้าสู่ระบบไม่ได้อีก`
      )
    )
      return;
    startTransition(async () => {
      const res = await deleteUser(u.id);
      if (res.error) alert(`ลบผู้ใช้ไม่สำเร็จ: ${res.error}`);
    });
  }

  const input =
    "w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand";
  const label = "mb-1 block text-xs font-medium text-muted";

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-bold text-navy">จัดการผู้ใช้ (Admin)</h1>
        <p className="text-sm text-muted">
          เชิญผู้ใช้ใหม่และกำหนดสิทธิ์ · ผู้ถูกเชิญจะได้อีเมลตั้งรหัสผ่าน
        </p>
      </header>

      <Card title="เชิญผู้ใช้ใหม่" pill="admin เท่านั้น">
        <form onSubmit={invite} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="col-span-2">
            <label className={label}>อีเมล</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={input}
              placeholder="name@efinancethai.com"
            />
          </div>
          <div>
            <label className={label}>ชื่อ-สกุล</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className={input}
            >
              <option value="staff">staff</option>
              <option value="admin">admin</option>
            </select>
          </div>
          {msg && (
            <p
              className={`col-span-2 rounded-lg px-3 py-2 text-sm md:col-span-4 ${
                msg.ok
                  ? "bg-brand/10 text-navy"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {msg.text}
            </p>
          )}
          <div className="col-span-2 md:col-span-4">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "กำลังส่งคำเชิญ..." : "ส่งคำเชิญ"}
            </button>
          </div>
        </form>
      </Card>

      <Card title="รายชื่อผู้ใช้" pill={`${users.length} คน`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="pb-2 pr-2">ชื่อ</th>
                <th className="pb-2 pr-2">อีเมล</th>
                <th className="pb-2 pr-2">Role</th>
                <th className="pb-2 pr-2">เปลี่ยน role</th>
                <th className="pb-2">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line/60">
                  <td className="py-2 pr-2 font-medium">
                    {u.full_name || "—"}
                    {u.id === me.id && (
                      <span className="ml-1 text-[10px] text-muted">(คุณ)</span>
                    )}
                  </td>
                  <td className="py-2 pr-2">{u.email}</td>
                  <td className="py-2 pr-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        u.role === "admin"
                          ? "bg-brand/15 text-navy"
                          : "bg-soft text-muted"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2">
                    {u.id === me.id ? (
                      <span className="text-xs text-muted">
                        เปลี่ยน role ตัวเองไม่ได้
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) =>
                          changeRole(u.id, e.target.value as Role)
                        }
                        disabled={isPending}
                        className="rounded-lg border border-line px-2 py-1 text-xs"
                      >
                        <option value="staff">staff</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </td>
                  <td className="py-2">
                    <span className="inline-flex gap-1">
                      <button
                        onClick={() => setPwUser(u)}
                        disabled={isPending}
                        className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-brand disabled:opacity-50"
                      >
                        ตั้งรหัสผ่าน
                      </button>
                      {u.id !== me.id && (
                        <button
                          onClick={() => removeUser(u)}
                          disabled={isPending}
                          className="rounded border border-line px-2 py-0.5 text-[11px] text-red-600 hover:border-red-400 disabled:opacity-50"
                        >
                          ลบผู้ใช้
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {pwUser && (
        <SetPasswordModal user={pwUser} onClose={() => setPwUser(null)} />
      )}
    </div>
  );
}

function SetPasswordModal({
  user,
  onClose,
}: {
  user: Profile;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirm) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }
    startTransition(async () => {
      const res = await setUserPassword(user.id, password);
      if (res.error) setError(res.error);
      else {
        setDone(true);
        setTimeout(onClose, 1200);
      }
    });
  }

  const input =
    "w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand";
  const label = "mb-1 block text-xs font-medium text-muted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
        <h2 className="mb-1 text-base font-bold text-navy">ตั้งรหัสผ่าน</h2>
        <p className="mb-4 text-xs text-muted">{user.email}</p>
        {done ? (
          <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-navy">
            ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className={label}>รหัสผ่านใหม่</label>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={input}
                placeholder="อย่างน้อย 8 ตัวอักษร"
              />
            </div>
            <div>
              <label className={label}>ยืนยันรหัสผ่าน</label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={input}
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
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
        )}
      </div>
    </div>
  );
}
