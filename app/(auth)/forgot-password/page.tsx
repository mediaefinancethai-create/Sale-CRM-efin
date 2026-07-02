"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    // recovery link lands on the set-password page (handles the token from the hash)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) {
      setError(
        error.message.toLowerCase().includes("rate limit")
          ? "ส่งอีเมลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่"
          : error.message
      );
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-xl font-bold text-white">
            e
          </div>
          <h1 className="text-xl font-bold text-navy">ลืมรหัสผ่าน</h1>
          <p className="mt-1 text-sm text-muted">
            กรอกอีเมล เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="rounded-lg bg-brand/10 px-3 py-3 text-sm text-navy">
              ส่งลิงก์รีเซ็ตรหัสผ่านไปที่ <strong>{email}</strong> แล้ว
              <br />
              กรุณาตรวจสอบกล่องจดหมาย (รวมถึงโฟลเดอร์ Spam) แล้วกดลิงก์เพื่อตั้งรหัสผ่านใหม่
            </p>
            <Link href="/login" className="text-sm text-brand hover:underline">
              ← กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                อีเมล
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                placeholder="you@efinancethai.com"
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
              {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
            </button>
            <div className="text-center">
              <Link href="/login" className="text-sm text-muted hover:text-brand">
                ← กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
