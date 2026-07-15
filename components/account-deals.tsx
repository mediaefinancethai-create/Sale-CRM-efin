"use client";

import { useState } from "react";
import { baht } from "@/lib/constants";
import type { Opportunity, Profile } from "@/lib/types";
import { Card, Kpi, StagePill } from "@/components/ui";
import { OpportunityDetailModal } from "@/components/opportunity-detail-modal";

export function AccountDeals({
  profile,
  deals,
}: {
  profile: Profile;
  deals: Opportunity[];
}) {
  const [detailOpp, setDetailOpp] = useState<Opportunity | null>(null);

  const won = deals.filter((d) => d.stage === "Closed Won");
  const wonValue = won.reduce((s, d) => s + Number(d.amount || 0), 0);
  const openDeals = deals.filter(
    (d) => d.stage !== "Closed Won" && d.stage !== "Closed Lost"
  );
  const pipelineValue = openDeals.reduce((s, d) => s + Number(d.amount || 0), 0);

  return (
    <Card
      title="ดีล / ออเดอร์ / ใบเสนอราคา ทั้งหมดของบริษัทนี้"
      pill={`${deals.length} รายการ`}
    >
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi label="ดีลทั้งหมด" value={String(deals.length)} note="ทุก stage" />
        <Kpi label="Closed Won" value={`฿${baht(wonValue)}`} note={`${won.length} ออเดอร์`} />
        <Kpi label="Pipeline (เปิดอยู่)" value={`฿${baht(pipelineValue)}`} note={`${openDeals.length} ดีล`} />
      </div>

      {deals.length === 0 ? (
        <p className="text-sm text-muted">ยังไม่มีดีลของบริษัทนี้</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="pb-2 pr-2">#</th>
                <th className="pb-2 pr-2">สินค้า/แพ็ก</th>
                <th className="pb-2 pr-2">Stage</th>
                <th className="pb-2 pr-2 text-right">มูลค่า</th>
                <th className="pb-2 pr-2">QT No.</th>
                <th className="pb-2 pr-2">SO No.</th>
                <th className="pb-2 pr-2">วางบิล</th>
                <th className="pb-2 pr-2">ชำระเงิน</th>
                <th className="pb-2 pr-2">วันปิด</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id} className="border-b border-line/60 align-top">
                  <td className="py-2 pr-2 text-muted">{d.deal_no}</td>
                  <td className="py-2 pr-2 font-medium">{d.product || "—"}</td>
                  <td className="py-2 pr-2">
                    <StagePill stage={d.stage} />
                  </td>
                  <td className="py-2 pr-2 text-right font-medium">
                    ฿{baht(d.amount)}
                  </td>
                  <td className="py-2 pr-2 text-xs">{d.qt_no || "—"}</td>
                  <td className="py-2 pr-2 text-xs">{d.so_no || "—"}</td>
                  <td className="py-2 pr-2 text-xs text-muted">
                    {d.invoice_status || "—"}
                  </td>
                  <td className="py-2 pr-2 text-xs text-muted">
                    {d.payment_status || "—"}
                  </td>
                  <td className="py-2 pr-2 whitespace-nowrap text-xs">
                    {d.close_date || "—"}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => setDetailOpp(d)}
                      className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-brand"
                    >
                      รายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailOpp && (
        <OpportunityDetailModal
          opp={detailOpp}
          profile={profile}
          onClose={() => setDetailOpp(null)}
        />
      )}
    </Card>
  );
}
