export interface Decision {
  id: number
  ada: string
  protocol_number: string | null
  subject: string
  decision_type: string
  issue_date: string
  publish_date: string | null
  organization_id: string
  status: string
  url: string | null
  document_url: string | null
  signer_ids: string[] | null
  unit_ids: string[] | null
  thematic_category_ids: string[] | null
  extra_fields: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Expense {
  id: number
  decision_id: number
  ada: string
  decision_type: string
  issue_date: string
  financial_year: number | null
  amount: number
  currency: string
  kae: string | null
  description: string | null
  assignment_type: string | null
  is_direct_assignment: boolean
  cpv_codes: string[] | null
  beneficiary_afm: string | null
  beneficiary_name: string | null
  created_at: string
}

export interface SyncLog {
  id: number
  sync_type: string
  status: string
  records_fetched: number
  records_inserted: number
  from_date: string | null
  to_date: string | null
  error_message: string | null
  started_at: string
  completed_at: string | null
}

export interface MonthlySpending {
  month: string
  decision_type: string
  is_direct_assignment: boolean
  tx_count: number
  total: number
}

export interface TopBeneficiary {
  beneficiary_afm: string
  beneficiary_name: string
  contract_count: number
  total_amount: number
  first_seen: string
  last_seen: string
}

export interface DashboardStats {
  total_spent: number
  decision_count: number
  direct_assignment_pct: number
  avg_decision_amount: number
  year: number
}
