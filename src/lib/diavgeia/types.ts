export interface DiavgeiaSearchResponse {
  info: {
    total: number
    page: number
    size: number
    actualSize: number
    query: string
  }
  decisions: DiavgeiaDecision[]
}

export interface DiavgeiaDecision {
  ada: string
  protocolNumber?: string
  subject: string
  decisionTypeId: string
  issueDate: number // epoch ms
  publishDate?: number
  organizationId: string
  status: string
  url: string
  documentUrl?: string
  signerIds?: string[]
  unitIds?: string[]
  thematicCategoryIds?: string[]
  extraFieldValues: ExtraFieldValues
}

export interface ExtraFieldValues {
  // Δ.1 (Assignment)
  awardAmount?: { amount: number; currency: string }
  person?: Array<{
    afm?: string
    name?: string
    afmType?: string
    afmCountry?: string
  }>
  assignmentType?: string
  cpv?: Array<{ cpvCode: string; cpvDescription?: string }>

  // Β.2.2 (Payment)
  sponsor?: Array<{
    expenseAmount?: { amount: number; currency: string }
    sponsorAFMName?: { afm?: string; name?: string }
    kae?: string
  }>

  // Β.1.3 (Obligation)
  amountWithVAT?: { amount: number; currency: string }
  amountWithKae?: Array<{
    kae?: string
    amountWithVAT?: number
  }>

  // Generic
  financialYear?: number

  // Allow extra keys
  [key: string]: unknown
}

export interface ParsedExpense {
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
  cpv_codes: string[]
  beneficiary_afm: string | null
  beneficiary_name: string | null
}
