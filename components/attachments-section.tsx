"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Attachment } from "@/lib/types";
import { Card } from "@/components/ui";

const BUCKET = "attachments";

function humanSize(n: number | null): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentsSection({
  accountId,
  attachments,
  title = "ไฟล์แนบ / เอกสาร",
  pill,
}: {
  accountId: string | null;
  attachments: Attachment[];
  title?: string;
  pill?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("ไม่ได้เข้าสู่ระบบ");
      setBusy(false);
      return;
    }
    // unique path: <accountId|library>/<uuid>-<filename>
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${accountId ?? "library"}/${crypto.randomUUID()}-${safeName}`;
    const up = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
    if (up.error) {
      setError(`อัปโหลดไม่สำเร็จ: ${up.error.message}`);
      setBusy(false);
      return;
    }
    const ins = await supabase.from("attachments").insert({
      account_id: accountId,
      file_name: file.name,
      storage_path: path,
      content_type: file.type || null,
      size: file.size,
      uploaded_by: user.id,
    });
    if (ins.error) {
      // roll back the uploaded object if the row insert failed
      await supabase.storage.from(BUCKET).remove([path]);
      setError(`บันทึกไม่สำเร็จ: ${ins.error.message}`);
      setBusy(false);
      return;
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    startTransition(() => router.refresh());
  }

  async function download(a: Attachment) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(a.storage_path, 60);
    if (error || !data) {
      alert(`เปิดไฟล์ไม่สำเร็จ: ${error?.message ?? ""}`);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function remove(a: Attachment) {
    if (!confirm(`ลบไฟล์ "${a.file_name}"?`)) return;
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([a.storage_path]);
    const { error } = await supabase.from("attachments").delete().eq("id", a.id);
    if (error) {
      alert(`ลบไม่สำเร็จ: ${error.message}`);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <Card title={title} pill={pill ?? `${attachments.length} ไฟล์`}>
      <div className="mb-3">
        <input
          ref={inputRef}
          type="file"
          onChange={onFile}
          disabled={busy}
          className="hidden"
          id="attach-input"
        />
        <label
          htmlFor="attach-input"
          className={`inline-block cursor-pointer rounded-lg border border-brand px-3 py-1.5 text-xs font-semibold text-navy hover:bg-soft ${
            busy ? "opacity-50" : ""
          }`}
        >
          {busy ? "กำลังอัปโหลด..." : "+ อัปโหลดไฟล์"}
        </label>
        {error && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-muted">ยังไม่มีไฟล์แนบ</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-line/70 bg-bg p-2.5 text-sm"
            >
              <div className="min-w-0">
                <button
                  onClick={() => download(a)}
                  className="truncate font-medium text-navy hover:text-brand hover:underline"
                  title={a.file_name}
                >
                  {a.file_name}
                </button>
                <div className="text-[11px] text-muted">
                  {humanSize(a.size)}
                  {a.created_at ? ` · ${a.created_at.slice(0, 10)}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => download(a)}
                  className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-brand"
                >
                  ดาวน์โหลด
                </button>
                <button
                  onClick={() => remove(a)}
                  className="rounded border border-line px-2 py-0.5 text-[11px] text-red-600 hover:border-red-400"
                >
                  ลบ
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
