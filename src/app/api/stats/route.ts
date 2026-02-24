import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import type { DashboardStats } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(
      searchParams.get('year') || String(new Date().getFullYear()),
      10
    )

    if (isNaN(year)) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      )
    }

    // year=0 means all-time stats
    const yearParams = year === 0 ? [] : [year]
    // Payments only for monetary stats (Β.2.2 = actual payments)
    const paymentFilter = year === 0
      ? "WHERE decision_type = 'Β.2.2'"
      : "WHERE decision_type = 'Β.2.2' AND EXTRACT(YEAR FROM issue_date) = $1"

    // Core aggregate stats — only actual payments (Β.2.2) to avoid
    // double-counting with budget commitments (Β.1.3) and assignments (Δ.1)
    const stats = await queryOne<DashboardStats>(
      `SELECT
         COALESCE(SUM(amount), 0)::numeric            AS total_spent,
         COUNT(DISTINCT ada)                           AS decision_count,
         COALESCE(
           ROUND(
             100.0 * SUM(CASE WHEN is_direct_assignment THEN amount ELSE 0 END)
             / NULLIF(SUM(amount), 0),
             2
           ), 0
         )::numeric                                    AS direct_assignment_pct,
         COALESCE(
           ROUND(SUM(amount) / NULLIF(COUNT(DISTINCT ada), 0), 2),
           0
         )::numeric                                    AS avg_decision_amount
       FROM expenses
       ${paymentFilter}`,
      yearParams
    )

    // Monthly spending — aggregate to one row per month, payments only
    const mvPaymentFilter = year === 0
      ? "WHERE decision_type = 'Β.2.2'"
      : "WHERE decision_type = 'Β.2.2' AND EXTRACT(YEAR FROM month) = $1"
    const monthly_spending = await query<{ month: string; total: number }>(
      `SELECT month, SUM(total)::numeric AS total
       FROM mv_monthly_spending
       ${mvPaymentFilter}
       GROUP BY month
       ORDER BY month ASC`,
      yearParams
    )

    // Spending grouped by decision type for the year (payments only)
    const spendingByTypeFilter = year === 0
      ? "WHERE decision_type = 'Β.2.2'"
      : "WHERE decision_type = 'Β.2.2' AND EXTRACT(YEAR FROM issue_date) = $1"
    const spending_by_type = await query<{
      decision_type: string
      total: number
      count: number
    }>(
      `SELECT COALESCE(NULLIF(assignment_type, ''), 'Λοιπά') AS decision_type,
              SUM(amount)::numeric AS total,
              COUNT(*)::integer    AS count
       FROM expenses
       ${spendingByTypeFilter}
       GROUP BY 1
       ORDER BY total DESC`,
      yearParams
    )

    // Year-over-year totals across all years (payments only)
    const yearly_totals = await query<{ year: number; total: number }>(
      `SELECT EXTRACT(YEAR FROM issue_date)::integer AS year,
              SUM(amount)::numeric                   AS total
       FROM expenses
       WHERE decision_type = 'Β.2.2'
       GROUP BY 1
       ORDER BY 1`
    )

    // Recent decisions for the year (payments only)
    const recentFilter = year === 0
      ? "WHERE e.decision_type = 'Β.2.2'"
      : "WHERE e.decision_type = 'Β.2.2' AND EXTRACT(YEAR FROM e.issue_date) = $1"
    const recent_decisions = await query<{
      ada: string
      subject: string
      issue_date: string
      amount: number
      decision_type: string
    }>(
      `SELECT e.ada, e.description AS subject, e.issue_date,
              e.amount, e.decision_type
       FROM expenses e
       ${recentFilter}
       ORDER BY e.issue_date DESC
       LIMIT 5`,
      yearParams
    )

    return NextResponse.json({
      total_spent: stats?.total_spent ?? 0,
      decision_count: stats?.decision_count ?? 0,
      direct_assignment_pct: stats?.direct_assignment_pct ?? 0,
      avg_decision_amount: stats?.avg_decision_amount ?? 0,
      year,
      monthly_spending,
      spending_by_type,
      yearly_totals,
      recent_decisions,
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
