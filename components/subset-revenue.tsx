"use client";

import { useState } from "react";
import { baht, REVENUE_PLAN } from "@/lib/constants";
import { Card } from "@/components/ui";

type WonLite = {
  subset: string | null;
  product: string | null;
  amount: number;
};

// target key "media" aggregates the actual subset "efinancethai"
const ACTUAL_FOR: Record<string, string[]> = { media: ["efinancethai"] };
function actualSubsetsFor(key: string): string[] {
  return ACTUAL_FOR[key] ?? [key];
}

export function SubsetRevenue({ won }: { won: WonLite[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const rows = Object.entries(REVENUE_PLAN.subset).map(([key, target]) => {
    const subs = actualSubsetsFor(key);
    const deals = won.filter((w) => w.subset && subs.includes(w.subset));
    const actual = deals.reduce((s, w) => s + Number(w.amount || 0), 0);
    const byProduct = new Map<string, { count: number; total: number }>();
    for (const d of deals) {
      const p = d.product || "ไม่ระบุ";
      const r = byProduct.get(p) ?? { count: 0, total: 0 };
      r.count += 1;
      r.total += Number(d.amount || 0);
      byProduct.set(p, r);
    }
    const products = [...byProduct.entries()]
      .map(([product, v]) => ({ product, ...v }))
      .sort((a, b) => b.total - a.total);
    return { key, target, actual, products };
  });

  return (
    <Card
      title="Project Revenue"
      pill="Actual เทียบเป้าปีนี้ · คลิกดูรายละเอียด"
    >
      <div className="space-y-3">
        {rows.map((r) => {
          const pct = r.target > 0 ? (r.actual / r.target) * 100 : 0;
          const open = openKey === r.key;
          return (
            <div key={r.key}>
              <button
                onClick={() => setOpenKey(open ? null : r.key)}
                className="w-full text-left"
                title="คลิกเพื่อดูว่ารายได้มาจากแพ็กไหนบ้าง"
              >
                <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-medium">
                    <span className="mr-1 text-brand">{open ? "▾" : "▸"}</span>
                    {r.key}
                  </span>
                  <span className="text-muted">
                    ฿{baht(r.actual)} / ฿{baht(r.target)}{" "}
                    <span className="font-semibold text-navy">
                      ({pct.toFixed(2)}%)
                    </span>
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-soft">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </button>

              {open && (
                <div className="mt-2 rounded-xl bg-bg p-3">
                  {r.products.length === 0 ? (
                    <p className="text-xs text-muted">
                      ยังไม่มีรายได้ (Closed Won) ในงานนี้
                    </p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-line text-left text-muted">
                          <th className="pb-1">แพ็ก / สินค้า</th>
                          <th className="pb-1 text-right">ดีล</th>
                          <th className="pb-1 text-right">รายได้</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.products.map((p) => (
                          <tr key={p.product} className="border-b border-line/50">
                            <td className="py-1 font-medium">{p.product}</td>
                            <td className="py-1 text-right">{p.count}</td>
                            <td className="py-1 text-right font-medium text-navy">
                              ฿{baht(p.total)}
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td className="pt-1 font-bold">รวม</td>
                          <td className="pt-1 text-right font-bold">
                            {r.products.reduce((s, p) => s + p.count, 0)}
                          </td>
                          <td className="pt-1 text-right font-bold text-navy">
                            ฿{baht(r.actual)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
