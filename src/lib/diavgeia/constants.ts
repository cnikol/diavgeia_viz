export const API_BASE = 'https://diavgeia.gov.gr/opendata'
export const ORG_ID = '6135' // Δήμος Καρδίτσας

export const DECISION_TYPES = {
  ASSIGNMENT: 'Δ.1',      // ΑΝΑΘΕΣΗ ΕΡΓΩΝ/ΠΡΟΜΗΘΕΙΩΝ/ΥΠΗΡΕΣΙΩΝ
  PAYMENT: 'Β.2.2',       // ΟΡΙΣΤΙΚΟΠΟΙΗΣΗ ΠΛΗΡΩΜΗΣ
  OBLIGATION: 'Β.1.3',    // ΑΝΑΛΗΨΗ ΥΠΟΧΡΕΩΣΗΣ
} as const

export type DecisionTypeKey = keyof typeof DECISION_TYPES
export type DecisionTypeValue = typeof DECISION_TYPES[DecisionTypeKey]

export const DECISION_TYPE_LABELS: Record<string, string> = {
  'Δ.1': 'Ανάθεση Έργων/Προμηθειών/Υπηρεσιών',
  'Β.2.2': 'Οριστικοποίηση Πληρωμής',
  'Β.1.3': 'Ανάληψη Υποχρέωσης',
}

// Municipality's own AFM — used to filter out self-referencing tenders
export const MUNICIPALITY_AFM = '997648454'

export const BACKFILL_START_DATE = '2019-01-01'
export const MAX_PAGE_SIZE = 500
export const WINDOW_MONTHS = 6
export const REQUEST_DELAY_MS = 200
