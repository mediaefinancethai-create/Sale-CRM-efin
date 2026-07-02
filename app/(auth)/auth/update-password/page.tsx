"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Landing page for invite / password-recovery links.
// The Supabase browser client auto-detects the session token from the URL hash
// (detectSessionInUrl). Once a session exists, the user sets a new password.
export default function UpdatePasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // give detectSessionInUrl a tick to consume the hash, then check
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setHasSession(!!session);
      setReady(true);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
      setReady(true);
    });
    check();
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
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
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1200);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-xl font-bold text-white">
            e
          </div>
          <h1 className="text-xl font-bold text-navy">ตั้งรหัสผ่าน</h1>
          <p className="mt-1 text-sm text-muted">
            ตั้งรหัสผ่านเพื่อเริ่มใช้งาน efin CRM
          </p>
        </div>

        {!ready ? (
          <p className="text-center text-sm text-muted">กำลังตรวจสอบลิงก์...</p>
        ) : done ? (
          <p className="rounded-lg bg-brand/10 px-3 py-2 text-center text-sm text-navy">
            ตั้งรหัสผ่านสำเร็จ กำลังพาเข้าสู่ระบบ...
          </p>
        ) : !hasSession ? (
          <div className="space-y-3 text-center">
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอคำเชิญใหม่จากผู้ดูแลระบบ
            </p>
            <a href="/login" className="text-sm text-brand hover:underline">
              ไปหน้าเข้าสู่ระบบ
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="pw" className="mb-1 block text-sm font-medium">
                รหัสผ่านใหม่
              </label>
              <input
                id="pw"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                placeholder="อย่างน้อย 8 ตัวอักษร"
              />
            </div>
            <div>
              <label htmlFor="cf" className="mb-1 block text-sm font-medium">
                ยืนยันรหัสผ่าน
              </label>
              <input
                id="cf"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านและเข้าใช้งาน"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
