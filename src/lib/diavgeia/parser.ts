import { DiavgeiaDecision, ParsedExpense } from './types'
import { DECISION_TYPES, MUNICIPALITY_AFM } from './constants'

/**
 * Detect if a Δ.1 decision is a tender/announcement rather than an actual award.
 * Tenders list the municipality itself as the "person" (contracting authority).
 */
function isTenderNotAward(decision: DiavgeiaDecision): boolean {
  const person = decision.extraFieldValues.person?.[0]
  if (person?.afm === MUNICIPALITY_AFM) return true
  const subject = (decision.subject || '').toUpperCase()
  return (
    subject.includes('ΠΡΟΚΗΡΥΞΗ') ||
    subject.includes('ΔΙΑΚΗΡΥΞΗ') ||
    subject.includes('ΠΡΟΚΗΡΥΞ')
  )
}

function isDirectAssignment(decision: DiavgeiaDecision): boolean {
  if (decision.decisionTypeId === DECISION_TYPES.ASSIGNMENT) return true
  const subject = (decision.subject || '').toUpperCase()
  return (
    subject.includes('ΑΠΕΥΘΕΙΑΣ ΑΝΑΘΕΣΗ') ||
    subject.includes("ΑΠ' ΕΥΘΕΙΑΣ ΑΝΑΘΕΣΗ") ||
    subject.includes('ΑΠΕΥΘΕΙΑΣ ΑΝΑΘΕΣ') ||
    subject.includes('ΑΠΕΥΘΕΊΑΣ ΑΝΆΘΕΣΗ')
  )
}

function parseAssignment(decision: DiavgeiaDecision): ParsedExpense[] {
  const extra = decision.extraFieldValues
  const amount = extra.awardAmount?.amount
  if (!amount || amount <= 0) return []

  // Skip tenders/announcements — these aren't actual expenses
  if (isTenderNotAward(decision)) return []

  const person = extra.person?.[0]
  const cpvCodes = extra.cpv?.map((c) => c.cpvCode) ?? []

  return [
    {
      ada: decision.ada,
      decision_type: decision.decisionTypeId,
      issue_date: new Date(decision.issueDate).toISOString(),
      financial_year: extra.financialYear ?? null,
      amount,
      currency: extra.awardAmount?.currency ?? 'EUR',
      kae: null,
      description: decision.subject,
      assignment_type: extra.assignmentType ?? null,
      is_direct_assignment: true,
      cpv_codes: cpvCodes,
      beneficiary_afm: person?.afm ?? null,
      beneficiary_name: person?.name ?? null,
    },
  ]
}

function parsePayment(decision: DiavgeiaDecision): ParsedExpense[] {
  const extra = decision.extraFieldValues
  const sponsors = extra.sponsor
  if (!sponsors || sponsors.length === 0) return []

  return sponsors
    .filter((s) => s.expenseAmount?.amount && s.expenseAmount.amount > 0)
    .map((s) => ({
      ada: decision.ada,
      decision_type: decision.decisionTypeId,
      issue_date: new Date(decision.issueDate).toISOString(),
      financial_year: extra.financialYear ?? null,
      amount: s.expenseAmount!.amount,
      currency: s.expenseAmount?.currency ?? 'EUR',
      kae: s.kae ?? null,
      description: decision.subject,
      assignment_type: null,
      is_direct_assignment: isDirectAssignment(decision),
      cpv_codes: [],
      beneficiary_afm: s.sponsorAFMName?.afm ?? null,
      beneficiary_name: s.sponsorAFMName?.name ?? null,
    }))
}

function parseObligation(decision: DiavgeiaDecision): ParsedExpense[] {
  const extra = decision.extraFieldValues
  const amount = extra.amountWithVAT?.amount
  if (!amount || amount <= 0) return []

  const kae = extra.amountWithKae?.[0]?.kae ?? null

  return [
    {
      ada: decision.ada,
      decision_type: decision.decisionTypeId,
      issue_date: new Date(decision.issueDate).toISOString(),
      financial_year: extra.financialYear ?? null,
      amount,
      currency: extra.amountWithVAT?.currency ?? 'EUR',
      kae,
      description: decision.subject,
      assignment_type: null,
      is_direct_assignment: isDirectAssignment(decision),
      cpv_codes: [],
      beneficiary_afm: null,
      beneficiary_name: null,
    },
  ]
}

export function parseDecisionToExpenses(
  decision: DiavgeiaDecision
): ParsedExpense[] {
  switch (decision.decisionTypeId) {
    case DECISION_TYPES.ASSIGNMENT:
      return parseAssignment(decision)
    case DECISION_TYPES.PAYMENT:
      return parsePayment(decision)
    case DECISION_TYPES.OBLIGATION:
      return parseObligation(decision)
    default:
      return []
  }
}
