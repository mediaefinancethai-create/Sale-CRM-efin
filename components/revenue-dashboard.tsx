"use client";

import { useMemo, useState } from "react";
import { baht } from "@/lib/constants";
import { Card, Kpi } from "@/components/ui";

type WonLite = {
  amount: number;
  created_at: string | null; // date the deal was keyed into the system
  product: string | null;
};

type View = "week" | "month" | "year";

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ISO week number from a Date
function isoWeek(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7
    );
  return { year: date.getUTCFullYear(), week };
}

// derive the period bucket {key, sort, label} from the record's entry date
// (created_at) at a given granularity
function bucketOf(o: WonLite, view: View): { key: string; sort: number; label: string } | null {
  if (!o.created_at) return null;
  const d = new Date(o.created_at);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = d.getMonth();

  if (view === "year") {
    return { key: `${year}`, sort: year, label: `${year}` };
  }

  if (view === "month") {
    const mm = String(month + 1).padStart(2, "0");
    return {
      key: `${year}-${mm}`,
      sort: year * 100 + month,
      label: `${MONTH_ABBR[month]} ${String(year).slice(2)}`,
    };
  }

  // week — ISO week of the entry date
  const { year: wy, week } = isoWeek(d);
  return {
    key: `${wy}-W${String(week).padStart(2, "0")}`,
    sort: wy * 100 + week,
    label: `W${week}/${String(wy).slice(2)}`,
  };
}

export function RevenueDashboard({ won }: { won: WonLite[] }) {
  const [view, setView] = useState<View>("month");
  const [selected, setSelected] = useState<string | null>(null);

  const buckets = useMemo(() => {
    const map = new Map<
      string,
      { label: string; sort: number; total: number; opps: WonLite[] }
    >();
    for (const o of won) {
      const b = bucketOf(o, view);
      if (!b) continue;
      const row = map.get(b.key) ?? { label: b.label, sort: b.sort, total: 0, opps: [] };
      row.total += Number(o.amount || 0);
      row.opps.push(o);
      map.set(b.key, row);
    }
    return [...map.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.sort - b.sort);
  }, [won, view]);

  // default selection = most recent bucket; reset when the view changes
  const activeKey =
    selected && buckets.some((b) => b.key === selected)
      ? selected
      : buckets.length
        ? buckets[buckets.length - 1].key
        : null;
  const active = buckets.find((b) => b.key === activeKey) ?? null;

  const total = buckets.reduce((s, b) => s + b.total, 0);
  const max = Math.max(...buckets.map((b) => b.total), 1);
  const best = buckets.reduce(
    (b, x) => (x.total > b.total ? x : b),
    { label: "—", total: 0 } as { label: string; total: number }
  );

  // product breakdown for the selected period
  const breakdown = useMemo(() => {
    if (!active) return [];
    const map = new Map<string, { count: number; total: number }>();
    for (const o of active.opps) {
      const key = o.product || "ไม่ระบุ";
      const r = map.get(key) ?? { count: 0, total: 0 };
      r.count += 1;
      r.total += Number(o.amount || 0);
      map.set(key, r);
    }
    return [...map.entries()]
      .map(([product, v]) => ({ product, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [active]);

  const viewLabel = { week: "รายวีค", month: "รายเดือน", year: "รายปี" }[view];

  return (
    <Card title="รายได้ (Closed Won)" pill={viewLabel}>
      {/* granularity toggle */}
      <div className="mb-4 inline-flex rounded-lg border border-line p-0.5 text-xs">
        {(["week", "month", "year"] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => {
              setView(v);
              setSelected(null);
            }}
            className={`rounded-md px-3 py-1.5 font-medium ${
              view === v ? "bg-brand text-white" : "text-muted"
            }`}
          >
            {{ week: "รายวีค", month: "รายเดือน", year: "รายปี" }[v]}
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi label="รายได้รวม (ทุกช่วง)" value={`฿${baht(total)}`} note={`${buckets.length} ช่วงเวลา`} />
        <Kpi label={`${viewLabel}ที่สูงสุด`} value={best.label} note={`฿${baht(best.total)}`} />
        <Kpi
          label={`ช่วงที่เลือก: ${active?.label ?? "—"}`}
          value={`฿${baht(active?.total ?? 0)}`}
          note={`${active?.opps.length ?? 0} ดีล`}
        />
      </div>

      {buckets.length === 0 ? (
        <p className="text-sm text-muted">ยังไม่มีข้อมูลรายได้</p>
      ) : (
        <>
          {/* clickable bar chart */}
          <div className="flex items-end gap-1.5 overflow-x-auto pb-1 sm:gap-2">
            {buckets.map((b) => {
              const on = b.key === activeKey;
              return (
                <button
                  key={b.key}
                  onClick={() => setSelected(b.key)}
                  className="flex min-w-[38px] flex-1 flex-col items-center gap-1"
                  title={`${b.label}: ฿${baht(b.total)} (คลิกเพื่อดูรายการ)`}
                >
                  <span className="text-[10px] font-medium text-navy">
                    {b.total > 0 ? baht(Math.round(b.total / 1000)) + "k" : ""}
                  </span>
                  <div className="flex h-40 w-full items-end">
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        on
                          ? "bg-gradient-to-t from-navy to-brand ring-2 ring-brand"
                          : "bg-gradient-to-t from-navy/60 to-brand/60 hover:from-navy hover:to-brand"
                      }`}
                      style={{ height: `${Math.max((b.total / max) * 100, b.total > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] ${on ? "font-bold text-navy" : "text-muted"}`}>
                    {b.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* product breakdown for the selected period */}
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-bold text-navy">
              แพ็ก/สินค้าที่ขายได้ในช่วง {active?.label ?? "—"}
            </h3>
            {breakdown.length === 0 ? (
              <p className="text-sm text-muted">ไม่มีรายการขายในช่วงนี้</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-muted">
                      <th className="pb-2 pr-2">แพ็ก / สินค้า</th>
                      <th className="pb-2 pr-2 text-right">จำนวนดีล</th>
                      <th className="pb-2 text-right">มูลค่ารวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((r) => (
                      <tr key={r.product} className="border-b border-line/60">
                        <td className="py-2 pr-2 font-medium">{r.product}</td>
                        <td className="py-2 pr-2 text-right">{r.count}</td>
                        <td className="py-2 text-right font-medium text-navy">
                          ฿{baht(r.total)}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="pt-2 font-bold">รวม</td>
                      <td className="pt-2 text-right font-bold">
                        {active?.opps.length ?? 0}
                      </td>
                      <td className="pt-2 text-right font-bold text-navy">
                        ฿{baht(active?.total ?? 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
