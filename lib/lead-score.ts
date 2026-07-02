import type { Lead } from "@/lib/types";

// Lead quality scoring — exact port of leadScore() from the prototype
export function leadScore(lead: Lead): number {
  const clientScore =
    {
      "New or no current purchase": 20,
      "Old client / Not bought this year": 18,
      "IR plus / efin tool only": 16,
      Unknown: 10,
      "Old client / Bought this year": 5,
    }[lead.client_status ?? ""] ?? 10;

  const relationshipScore =
    {
      High: 20,
      Medium: 14,
      Low: 7,
      None: 0,
    }[lead.relationship_level ?? ""] ?? 7;

  return Math.min(
    100,
    Number(lead.listed_active || 0) * 20 +
      Number(lead.ipo_bond_pipeline || 0) * 20 +
      Number(lead.profitable || 0) * 20 +
      clientScore +
      relationshipScore
  );
}

export function leadStatus(lead: Lead): "Qualified" | "Warm Lead" | "Watchlist" {
  const score = leadScore(lead);
  if (score >= 80) return "Qualified";
  if (score >= 65) return "Warm Lead";
  return "Watchlist";
}

// Suggested next action — port of leadSaleAction() from the prototype
export function leadSaleAction(lead: Lead): string {
  if (lead.sale_action) return lead.sale_action;
  const score = leadScore(lead);
  if (!Number(lead.listed_active || 0)) return "ตรวจข่าวย้อนหลัง 6 เดือนก่อน";
  if (!Number(lead.profitable || 0)) return "รอข้อมูลผลประกอบการ/งบล่าสุด";
  if (lead.client_status === "Old client / Bought this year")
    return "ดูแลความสัมพันธ์ / upsell package เสริม";
  if (score >= 80) return "มอบหมาย AE โทรนัดคุย และเสนอ Media/Event package";
  if (score >= 65) return "ให้ AE ส่ง intro + ขอ meeting";
  return "เก็บเป็น watchlist และหาหลักฐานเพิ่ม";
}
