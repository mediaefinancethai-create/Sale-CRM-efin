"use client";

import { useMemo, useState, useTransition } from "react";
import { SUBSETS, baht } from "@/lib/constants";
import { canModify } from "@/lib/rbac";
import type { IdeaPackage, Opportunity, Package, Profile } from "@/lib/types";
import { Card } from "@/components/ui";
import {
  addIdeaPackage,
  deleteIdeaPackage,
  type IdeaInput,
} from "@/app/(app)/packages/actions";

type WonLite = Pick<Opportunity, "product" | "amount" | "account_name" | "subset">;

export function PackagesView({
  profile,
  packages,
  ideas,
  wonOpps,
}: {
  profile: Profile;
  packages: Package[];
  ideas: IdeaPackage[];
  wonOpps: WonLite[];
}) {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-bold text-navy">Package Library</h1>
        <p className="text-sm text-muted">
          ช่วย AE จัดแพ็กเกจ — งบ · ยอดนิยม · ไอเดียใหม่
        </p>
      </header>

      <BudgetFinder packages={packages} wonOpps={wonOpps} />
      <Catalog packages={packages} />
      <IdeaPackages profile={profile} ideas={ideas} />
    </div>
  );
}

// ---------- 1) Budget Finder ----------

function BudgetFinder({
  packages,
  wonOpps,
}: {
  packages: Package[];
  wonOpps: WonLite[];
}) {
  const [budget, setBudget] = useState("");
  const [submitted, setSubmitted] = useState<number | null>(null);

  const result = useMemo(() => {
    if (submitted === null || submitted <= 0) return null;
    const b = submitted;

    // packages within budget (allow +10%, per prototype)
    const fit = packages
      .filter((p) => (p.list_price ?? 0) <= b * 1.1)
      .sort((a, b2) => (b2.list_price ?? 0) - (a.list_price ?? 0));

    // what similar-budget customers bought (Closed Won amount in [b*0.6, b*1.4])
    const near = wonOpps.filter(
      (o) => Number(o.amount) >= b * 0.6 && Number(o.amount) <= b * 1.4
    );
    const byProduct = new Map<string, { count: number; total: number }>();
    for (const o of near) {
      const key = o.product || "ไม่ระบุ";
      const row = byProduct.get(key) ?? { count: 0, total: 0 };
      row.count += 1;
      row.total += Number(o.amount);
      byProduct.set(key, row);
    }
    const popular = [...byProduct.entries()]
      .map(([product, v]) => ({ product, ...v }))
      .sort((a, b2) => b2.count - a.count || b2.total - a.total);

    return { fit, popular, nearCount: near.length };
  }, [submitted, packages, wonOpps]);

  return (
    <Card title="Budget Finder" pill="ใส่งบ → แพ็กเกจที่เข้างบ + ยอดนิยม">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            งบประมาณ (บาท)
          </label>
          <input
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSubmitted(Number(budget));
            }}
            placeholder="เช่น 50000 / 100000 / 500000"
            className="w-56 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
        <button
          onClick={() => setSubmitted(Number(budget))}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          ค้นหา
        </button>
      </div>

      {result && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-bold text-navy">
              แพ็กเกจที่เข้างบ ({result.fit.length})
            </h3>
            {result.fit.length === 0 ? (
              <p className="text-sm text-muted">ไม่มีแพ็กเกจในงบนี้</p>
            ) : (
              <ul className="space-y-2">
                {result.fit.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-xl border border-line bg-bg p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{p.name}</span>
                      <span className="font-bold text-navy">
                        ฿{baht(p.list_price)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{p.components}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold text-navy">
              ลูกค้างบใกล้เคียงส่วนใหญ่ซื้ออะไร ({result.nearCount} ดีล)
            </h3>
            {result.popular.length === 0 ? (
              <p className="text-sm text-muted">
                ยังไม่มีข้อมูล Closed Won ในช่วงงบนี้
              </p>
            ) : (
              <ul className="space-y-2">
                {result.popular.map((p) => (
                  <li
                    key={p.product}
                    className="rounded-xl border border-line bg-bg p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{p.product}</span>
                      <span className="text-xs text-muted">
                        {p.count} ดีล · ฿{baht(p.total)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------- 2) Catalog ----------

function Catalog({ packages }: { packages: Package[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, Package[]>();
    for (const p of packages) {
      const key = p.subset ?? "อื่น ๆ";
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    // stable order following SUBSETS then any extras
    const order = [...SUBSETS, "อื่น ๆ"];
    return [...map.entries()].sort(
      (a, b) => order.indexOf(a[0]) - order.indexOf(b[0])
    );
  }, [packages]);

  return (
    <Card title="Package Catalog" pill={`${packages.length} แพ็กเกจ`}>
      <div className="space-y-4">
        {grouped.map(([subset, list]) => (
          <div key={subset}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand">
              {subset}
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-line bg-bg p-3 text-sm"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <span className="font-semibold">{p.name}</span>
                    <span className="whitespace-nowrap font-bold text-navy">
                      ฿{baht(p.list_price)}
                    </span>
                  </div>
                  <p className="text-xs text-muted">{p.components}</p>
                  {p.best_for && (
                    <p className="mt-1 text-xs">
                      <span className="text-muted">เหมาะกับ: </span>
                      {p.best_for}
                    </p>
                  )}
                  <div className="mt-2 flex gap-1.5">
                    {p.tier && (
                      <span className="rounded-full bg-soft px-2 py-0.5 text-[10px] text-navy">
                        {p.tier}
                      </span>
                    )}
                    <span className="rounded-full bg-soft px-2 py-0.5 text-[10px] text-navy">
                      {p.source}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------- 3) Idea Packages ----------

function IdeaPackages({
  profile,
  ideas,
}: {
  profile: Profile;
  ideas: IdeaPackage[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<IdeaInput>({
    name: "",
    price: 0,
    components: "",
    best_for: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await addIdeaPackage(form);
      if (res.error) setError(res.error);
      else setForm({ name: "", price: 0, components: "", best_for: "" });
    });
  }

  function onDelete(i: IdeaPackage) {
    if (!confirm(`ลบไอเดีย "${i.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteIdeaPackage(i.id);
      if (res.error) alert(`ลบไม่สำเร็จ: ${res.error}`);
    });
  }

  const input =
    "w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand";
  const label = "mb-1 block text-xs font-medium text-muted";

  return (
    <Card title="Idea Packages" pill={`${ideas.length} ไอเดีย`}>
      <form
        onSubmit={submit}
        className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-bg p-3 md:grid-cols-4"
      >
        <div>
          <label className={label}>ชื่อไอเดีย</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={input}
          />
        </div>
        <div>
          <label className={label}>ราคา (บาท)</label>
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) =>
              setForm((f) => ({ ...f, price: Number(e.target.value) }))
            }
            className={input}
          />
        </div>
        <div>
          <label className={label}>สิ่งที่รวม</label>
          <input
            value={form.components}
            onChange={(e) =>
              setForm((f) => ({ ...f, components: e.target.value }))
            }
            className={input}
          />
        </div>
        <div>
          <label className={label}>เหมาะกับใคร</label>
          <input
            value={form.best_for}
            onChange={(e) =>
              setForm((f) => ({ ...f, best_for: e.target.value }))
            }
            className={input}
          />
        </div>
        {error && (
          <p className="col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 md:col-span-4">
            {error}
          </p>
        )}
        <div className="col-span-2 md:col-span-4">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "กำลังเพิ่ม..." : "+ เพิ่มไอเดีย"}
          </button>
        </div>
      </form>

      {ideas.length === 0 ? (
        <p className="text-sm text-muted">ยังไม่มีไอเดียแพ็กเกจ</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {ideas.map((i) => (
            <div
              key={i.id}
              className="rounded-xl border border-line bg-bg p-3 text-sm"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <span className="font-semibold">{i.name}</span>
                <span className="whitespace-nowrap font-bold text-navy">
                  ฿{baht(i.price)}
                </span>
              </div>
              <p className="text-xs text-muted">{i.components}</p>
              {i.best_for && (
                <p className="mt-1 text-xs">
                  <span className="text-muted">เหมาะกับ: </span>
                  {i.best_for}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-muted">
                  {i.owner ? `โดย ${i.owner}` : ""}
                </span>
                {canModify(profile, i.created_by) && (
                  <button
                    onClick={() => onDelete(i)}
                    className="text-[11px] text-red-500 hover:underline"
                  >
                    ลบ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
