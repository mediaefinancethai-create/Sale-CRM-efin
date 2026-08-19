import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { baht, REVENUE_PLAN } from "@/lib/constants";
import type { Opportunity } from "@/lib/types";
import { BarRows, Card, Kpi, StagePill } from "@/components/ui";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("opportunities")
    .select("*")
    .order("deal_no", { ascending: true });
  const opps = (data ?? []) as Opportunity[];

  const open = opps.filter(
    (o) => o.stage !== "Closed Won" && o.stage !== "Closed Lost"
  );
  const won = opps.filter((o) => o.stage === "Closed Won");
  const lost = opps.filter((o) => o.stage === "Closed Lost");
  const pipelineValue = open.reduce((s, o) => s + Number(o.amount || 0), 0);
  const wonValue = won.reduce((s, o) => s + Number(o.amount || 0), 0);
  const lostValue = lost.reduce((s, o) => s + Number(o.amount || 0), 0);
  const winRate =
    won.length + lost.length > 0
      ? Math.round((won.length / (won.length + lost.length)) * 100)
      : 0;

  // actual Closed Won per subset (for Actual vs Target)
  const wonBySubset: Record<string, number> = {};
  for (const o of won) {
    if (o.subset)
      wonBySubset[o.subset] = (wonBySubset[o.subset] ?? 0) + Number(o.amount || 0);
  }
  // pair actual subsets with REVENUE_PLAN targets (target key "media" = efinancethai)
  const subsetActualVsTarget = [
    { label: "better trade", actual: wonBySubset["better trade"] ?? 0, target: REVENUE_PLAN.subset["better trade"] },
    { label: "efinancethai (media)", actual: wonBySubset["efinancethai"] ?? 0, target: REVENUE_PLAN.subset["media"] },
    { label: "crypto", actual: wonBySubset["crypto"] ?? 0, target: REVENUE_PLAN.subset["crypto"] },
    { label: "esg", actual: wonBySubset["esg"] ?? 0, target: REVENUE_PLAN.subset["esg"] },
  ];

  // urgent: open deals with a next action due today or overdue
  const today = new Date().toLocaleDateString("en-CA");
  const urgent = open
    .filter((o) => o.next_action_date && o.next_action_date <= today)
    .sort((a, b) => (a.next_action_date! < b.next_action_date! ? -1 : 1))
    .slice(0, 8);

  // team overview per AE owner
  const byOwner = new Map<
    string,
    { deals: number; pipeline: number; won: number }
  >();
  for (const o of opps) {
    const key = o.owner || "—";
    const row = byOwner.get(key) ?? { deals: 0, pipeline: 0, won: 0 };
    row.deals += 1;
    if (o.stage === "Closed Won") row.won += Number(o.amount || 0);
    else if (o.stage !== "Closed Lost") row.pipeline += Number(o.amount || 0);
    byOwner.set(key, row);
  }
  const team = [...byOwner.entries()].sort((a, b) => b[1].won - a[1].won);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-lg font-bold text-navy">Home</h1>
        <p className="text-sm text-muted">
          รายได้ · pipeline · งานที่ต้องตามวันนี้
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi
          label="Pipeline (เปิดอยู่)"
          value={`฿${baht(pipelineValue)}`}
          note={`${open.length} ดีล`}
        />
        <Kpi
          label="Closed Won"
          value={`฿${baht(wonValue)}`}
          note={`${won.length} ดีล`}
        />
        <Kpi
          label="Closed Lost"
          value={`฿${baht(lostValue)}`}
          note={`${lost.length} ดีล`}
        />
        <Kpi label="Win Rate" value={`${winRate}%`} note="จากดีลที่ปิดแล้ว" />
        <Kpi label="ดีลทั้งหมด" value={String(opps.length)} note="ทุก stage" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Revenue Source Split" pill="เป้าหมาย (อ้างอิงปีก่อน)">
          <BarRows
            rows={Object.entries(REVENUE_PLAN.source).map(([label, v]) => ({
              label,
              value: v,
              display: `${v.toFixed(2)}%`,
            }))}
          />
        </Card>
        <Card title="Revenue Subset Split" pill="Actual เทียบ เป้าหมายปีนี้">
          <div className="space-y-3.5">
            {subsetActualVsTarget.map((r) => {
              const pct = r.target > 0 ? (r.actual / r.target) * 100 : 0;
              return (
                <div key={r.label}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-medium">{r.label}</span>
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
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-muted">
            แท่ง = สัดส่วน Actual (Closed Won) เทียบเป้าปีนี้ · target &quot;media&quot; = efinancethai
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="งานที่ต้องตามวันนี้" pill={`${urgent.length} รายการ`}>
          {urgent.length === 0 ? (
            <p className="text-sm text-muted">ไม่มีงานค้างถึงกำหนดวันนี้ 🎉</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="pb-2">ลูกค้า</th>
                  <th className="pb-2">Next Action</th>
                  <th className="pb-2">กำหนด</th>
                  <th className="pb-2">Stage</th>
                </tr>
              </thead>
              <tbody>
                {urgent.map((o) => (
                  <tr key={o.id} className="border-b border-line/60">
                    <td className="py-2 pr-2">
                      <Link
                        href="/opportunities"
                        className="font-medium hover:text-brand"
                      >
                        {o.account_name}
                      </Link>
                    </td>
                    <td className="py-2 pr-2 text-muted">
                      {o.next_action || "—"}
                    </td>
                    <td className="py-2 pr-2 whitespace-nowrap">
                      {o.next_action_date}
                    </td>
                    <td className="py-2">
                      <StagePill stage={o.stage} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Team Overview" pill={`${team.length} คน`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="pb-2">Owner</th>
                <th className="pb-2 text-right">ดีล</th>
                <th className="pb-2 text-right">Pipeline</th>
                <th className="pb-2 text-right">Closed Won</th>
              </tr>
            </thead>
            <tbody>
              {team.map(([owner, t]) => (
                <tr key={owner} className="border-b border-line/60">
                  <td className="py-2 font-medium">{owner}</td>
                  <td className="py-2 text-right">{t.deals}</td>
                  <td className="py-2 text-right">฿{baht(t.pipeline)}</td>
                  <td className="py-2 text-right">฿{baht(t.won)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
