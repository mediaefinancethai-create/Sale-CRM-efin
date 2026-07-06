import type { Source, Stage, Subset } from "@/lib/constants";

export type Role = "admin" | "staff";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  legacy_id: string | null;
  name: string;
  symbol: string | null;
  segment: string | null;
  tier: string | null;
  city: string | null;
  status: string;
  owner: string | null;
  owner_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  legacy_id: string | null;
  deal_no: number | null;
  account_id: string | null;
  account_name: string | null;
  owner: string | null;
  owner_id: string | null;
  segment: string | null;
  product: string | null;
  source: Source | null;
  subset: Subset | null;
  stage: Stage;
  amount: number;
  probability: number | null;
  forecast: string | null;
  month: string | null;
  week: string | null;
  close_date: string | null;
  next_action_date: string | null;
  next_action: string | null;
  qt_no: string | null;
  so_no: string | null;
  support_owner: string | null;
  campaign_owner: string | null;
  invoice_status: string | null;
  invoice_no: string | null;
  invoice_date: string | null;
  payment_status: string | null;
  paid_date: string | null;
  accounting_owner: string | null;
  accounting_note: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountContact {
  id: string;
  account_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  line: string | null;
  is_primary: boolean;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountNote {
  id: string;
  account_id: string;
  owner: string | null;
  owner_id: string | null;
  note_date: string;
  type: string | null;
  note: string | null;
  next_follow_up: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  legacy_id: string | null;
  name: string;
  source: Source | null;
  subset: Subset | null;
  list_price: number | null;
  components: string | null;
  best_for: string | null;
  angle: string | null;
  tier: string | null;
  owner: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IdeaPackage {
  id: string;
  legacy_id: string | null;
  name: string;
  price: number | null;
  components: string | null;
  best_for: string | null;
  owner: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  account_id: string | null;
  file_name: string;
  storage_path: string;
  content_type: string | null;
  size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  legacy_id: string | null;
  company: string;
  market: string | null;
  segment: string | null;
  client_status: string | null;
  relationship_level: string | null;
  listed_active: number;
  ipo_bond_pipeline: number;
  profitable: number;
  research_source: string | null;
  sale_action: string | null;
  fit: string | null;
  owner: string | null;
  owner_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
