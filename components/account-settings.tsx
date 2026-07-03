"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { Card } from "@/components/ui";

// Self-service account page — every logged-in user changes ONLY their own
// password (supabase.auth.updateUser acts on the current session only).
export function AccountSettings({ profile }: { profile: Profile }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    if (password.length < 8) {
      setError("รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirm) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setOk(true);
    setPassword("");
    setConfirm("");
    setLoading(false);
  }

  const input =
    "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand";
  const label = "mb-1 block text-sm font-medium";

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-bold text-navy">ตั้งค่าบัญชี</h1>
        <p className="text-sm text-muted">จัดการรหัสผ่านของบัญชีคุณ</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="ข้อมูลบัญชี">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">ชื่อ</dt>
              <dd className="font-medium">{profile.full_name || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">อีเมล</dt>
              <dd className="font-medium">{profile.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">สิทธิ์ (role)</dt>
              <dd>
                <span className="rounded-full bg-soft px-2 py-0.5 text-[11px] font-medium text-navy">
                  {profile.role}
                </span>
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted">
            ต้องการแก้ชื่อ? แจ้งผู้ดูแลระบบ (admin) ให้เปลี่ยนให้
          </p>
        </Card>

        <Card title="เปลี่ยนรหัสผ่าน">
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
              <label className={label}>ยืนยันรหัสผ่านใหม่</label>
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
            {ok && (
              <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-navy">
                เปลี่ยนรหัสผ่านเรียบร้อยแล้ว
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
