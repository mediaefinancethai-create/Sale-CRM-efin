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
  const winRate =
    won.length + lost.length > 0
      ? Math.round((won.length / (won.length + lost.length)) * 100)
      : 0;

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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
        <Card title="Revenue Subset Split" pill="เป้าหมายปีนี้">
          <BarRows
            rows={Object.entries(REVENUE_PLAN.subset).map(([label, v]) => ({
              label,
              value: v,
              display: `฿${baht(v)}`,
            }))}
          />
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
