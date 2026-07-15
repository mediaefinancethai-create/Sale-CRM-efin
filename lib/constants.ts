// Single source of truth for domain constants — mirrors the prototype

export const STAGES = [
  "Prospecting",
  "Qualified",
  "Needs Analysis",
  "Proposal",
  "Negotiation",
  "Verbal Win",
  "Closed Won",
  "Closed Lost",
] as const;
export type Stage = (typeof STAGES)[number];

// Kanban lanes (subset of stages)
export const KANBAN_LANES: Stage[] = [
  "Prospecting",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Verbal Win",
  "Closed Won",
];

export const SOURCES = ["Event", "Media"] as const;
export type Source = (typeof SOURCES)[number];

// 'media' exists because 4 of 11 real packages + REVENUE_PLAN use it
export const SUBSETS = [
  "better trade",
  "efinancethai",
  "crypto",
  "esg",
  "media",
] as const;
export type Subset = (typeof SUBSETS)[number];

// mapping: better trade & esg → Event; efinancethai & crypto → Media
export const SUBSET_TO_SOURCE: Record<string, Source> = {
  "better trade": "Event",
  esg: "Event",
  efinancethai: "Media",
  crypto: "Media",
  media: "Media",
};

// AE roster from prototype — record-level owner labels (not login roles)
export const OWNERS = ["yok", "nueng", "fung", "chom", "lucky", "joy", "rung"];
export const SUPPORT_OWNERS = ["earn", "fon"];
export const CAMPAIGN_OWNERS = ["tak"];

export const FORECASTS = [
  "Pipeline",
  "Best Case",
  "Commit",
  "Closed Won",
  "Closed Lost",
];

export const NOTE_TYPES = ["Call", "Meeting", "Line", "Email"];

// Revenue plan (targets — NOT actuals). Do not recompute from deals.
export const REVENUE_PLAN = {
  source: { Event: 60, Media: 40 } as Record<Source, number>, // % reference from last year
  subset: {
    "better trade": 10_000_000,
    media: 5_000_000,
    crypto: 3_000_000,
    esg: 1_500_000,
  } as Record<string, number>, // THB targets this year
};

// Lead quality scoring options (from prototype leadScore())
export const CLIENT_STATUSES = [
  "New or no current purchase",
  "Old client / Not bought this year",
  "IR plus / efin tool only",
  "Unknown",
  "Old client / Bought this year",
] as const;

export const RELATIONSHIP_LEVELS = ["High", "Medium", "Low", "None"] as const;

export const SEGMENTS = [
  "Digital Asset",
  "Broker",
  "Asset Management",
  "Listed Company",
  "FinTech",
  "Banking",
  "Insurance",
  "ทั่วไป",
  "Other",
];

// THB formatter — comma thousands, 2 decimals when fractional
export function baht(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return v.toLocaleString("th-TH", {
    minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
