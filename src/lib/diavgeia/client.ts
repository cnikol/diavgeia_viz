import {
  API_BASE,
  ORG_ID,
  MAX_PAGE_SIZE,
  WINDOW_MONTHS,
  REQUEST_DELAY_MS,
  BACKFILL_START_DATE,
} from './constants'
import { DiavgeiaSearchResponse, DiavgeiaDecision } from './types'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function generateDateWindows(
  startDate: string = BACKFILL_START_DATE,
  endDate?: string
): Array<{ from: string; to: string }> {
  const windows: Array<{ from: string; to: string }> = []
  let current = new Date(startDate)
  const end = endDate ? new Date(endDate) : new Date()

  while (current < end) {
    const windowEnd = addMonths(current, WINDOW_MONTHS)
    const to = windowEnd > end ? end : windowEnd
    windows.push({
      from: formatDate(current),
      to: formatDate(to),
    })
    current = to
  }

  return windows
}

export async function fetchDecisionsPage(
  type: string,
  fromDate: string,
  toDate: string,
  page: number = 0,
  size: number = MAX_PAGE_SIZE
): Promise<DiavgeiaSearchResponse> {
  const url = `${API_BASE}/search.json?org=${ORG_ID}&type=${encodeURIComponent(type)}&from_issue_date=${fromDate}&to_issue_date=${toDate}&size=${size}&page=${page}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Diavgeia API error ${response.status}: ${response.statusText} for ${url}`)
  }

  return response.json()
}

export async function fetchAllDecisionsInWindow(
  type: string,
  fromDate: string,
  toDate: string,
  onPage?: (page: number, total: number, decisions: DiavgeiaDecision[]) => void
): Promise<DiavgeiaDecision[]> {
  // First fetch to get total count
  const firstPage = await fetchDecisionsPage(type, fromDate, toDate, 0, MAX_PAGE_SIZE)
  const total = firstPage.info.total
  const allDecisions: DiavgeiaDecision[] = [...firstPage.decisions]

  if (onPage) onPage(0, total, firstPage.decisions)

  const totalPages = Math.ceil(total / MAX_PAGE_SIZE)

  for (let page = 1; page < totalPages; page++) {
    await sleep(REQUEST_DELAY_MS)
    const result = await fetchDecisionsPage(type, fromDate, toDate, page, MAX_PAGE_SIZE)
    allDecisions.push(...result.decisions)
    if (onPage) onPage(page, total, result.decisions)
  }

  return allDecisions
}

export async function fetchDecisionsSince(
  type: string,
  sinceDate: string
): Promise<DiavgeiaDecision[]> {
  const today = formatDate(new Date())
  return fetchAllDecisionsInWindow(type, sinceDate, today)
}
