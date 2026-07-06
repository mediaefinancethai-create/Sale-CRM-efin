"use client";

import { useMemo, useState } from "react";
import { baht } from "@/lib/constants";
import { Card, Kpi } from "@/components/ui";

type WonLite = { amount: number; close_date: string | null; month: string | null };

const MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];
const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function yearMonth(o: WonLite): { year: number; month: number } | null {
  if (o.close_date && /^\d{4}-\d{2}/.test(o.close_date)) {
    return { year: +o.close_date.slice(0, 4), month: +o.close_date.slice(5, 7) - 1 };
  }
  if (o.month) {
    const [mon, yr] = o.month.split("-");
    const mi = MONTH_ABBR.indexOf(mon);
    if (mi >= 0 && yr) return { year: +yr, month: mi };
  }
  return null;
}

export function RevenueDashboard({ won }: { won: WonLite[] }) {
  const [view, setView] = useState<"month" | "year">("month");

  const { years, byYear } = useMemo(() => {
    const byYear = new Map<number, number[]>(); // year -> 12 months
    for (const o of won) {
      const ym = yearMonth(o);
      if (!ym) continue;
      const arr = byYear.get(ym.year) ?? new Array(12).fill(0);
      arr[ym.month] += Number(o.amount || 0);
      byYear.set(ym.year, arr);
    }
    const years = [...byYear.keys()].sort((a, b) => b - a);
    return { years, byYear };
  }, [won]);

  const [year, setYear] = useState<number | null>(null);
  const activeYear = year ?? years[0] ?? null;

  // build the bar series for the current view
  const series = useMemo(() => {
    if (view === "year") {
      return years
        .slice()
        .sort((a, b) => a - b)
        .map((y) => ({
          label: String(y),
          value: (byYear.get(y) ?? []).reduce((s, v) => s + v, 0),
        }));
    }
    const months = activeYear ? byYear.get(activeYear) ?? new Array(12).fill(0) : [];
    return MONTHS.map((m, i) => ({ label: m, value: months[i] ?? 0 }));
  }, [view, years, byYear, activeYear]);

  const total = series.reduce((s, x) => s + x.value, 0);
  const max = Math.max(...series.map((s) => s.value), 1);
  const dealCount = won.filter((o) => {
    const ym = yearMonth(o);
    if (view === "year") return true;
    return ym && activeYear != null && ym.year === activeYear;
  }).length;
  const best = series.reduce(
    (b, x) => (x.value > b.value ? x : b),
    { label: "—", value: 0 }
  );

  return (
    <Card
      title="รายได้ (Closed Won)"
      pill={view === "month" ? `รายเดือน${activeYear ? ` · ปี ${activeYear}` : ""}` : "รายปี"}
    >
      {/* filter controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-line p-0.5 text-xs">
          <button
            onClick={() => setView("month")}
            className={`rounded-md px-3 py-1.5 font-medium ${
              view === "month" ? "bg-brand text-white" : "text-muted"
            }`}
          >
            รายเดือน
          </button>
          <button
            onClick={() => setView("year")}
            className={`rounded-md px-3 py-1.5 font-medium ${
              view === "year" ? "bg-brand text-white" : "text-muted"
            }`}
          >
            รายปี
          </button>
        </div>
        {view === "month" && years.length > 0 && (
          <select
            value={activeYear ?? ""}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                ปี {y}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* KPI row */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi
          label={view === "month" ? `รายได้รวมปี ${activeYear ?? "—"}` : "รายได้รวมทุกปี"}
          value={`฿${baht(total)}`}
          note={`${dealCount} ดีล`}
        />
        <Kpi
          label={view === "month" ? "เดือนที่ทำได้สูงสุด" : "ปีที่ทำได้สูงสุด"}
          value={best.label}
          note={`฿${baht(best.value)}`}
        />
        <Kpi
          label="เฉลี่ยต่อดีล"
          value={`฿${baht(dealCount ? total / dealCount : 0)}`}
          note="Closed Won"
        />
      </div>

      {/* vertical bar chart */}
      {total === 0 ? (
        <p className="text-sm text-muted">ยังไม่มีข้อมูลรายได้ในช่วงที่เลือก</p>
      ) : (
        <div className="flex items-end gap-1.5 overflow-x-auto pb-1 sm:gap-2">
          {series.map((s) => (
            <div
              key={s.label}
              className="flex min-w-[36px] flex-1 flex-col items-center gap-1"
            >
              <span className="text-[10px] font-medium text-navy">
                {s.value > 0 ? baht(Math.round(s.value / 1000)) + "k" : ""}
              </span>
              <div className="flex h-40 w-full items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-navy to-brand transition-all"
                  style={{ height: `${Math.max((s.value / max) * 100, s.value > 0 ? 4 : 0)}%` }}
                  title={`${s.label}: ฿${baht(s.value)}`}
                />
              </div>
              <span className="text-[10px] text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
