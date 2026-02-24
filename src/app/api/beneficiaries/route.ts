import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import type { TopBeneficiary, Expense } from '@/types/database'

const ALLOWED_SORT_COLUMNS = [
  'total_amount',
  'contract_count',
  'beneficiary_name',
  'first_seen',
  'last_seen',
]
const ALLOWED_ORDERS = ['asc', 'desc']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const afm = searchParams.get('afm') || ''

    // Single beneficiary detail mode
    if (afm) {
      // Stats from payments only (Β.2.2) to avoid double-counting
      const info = await queryOne<TopBeneficiary>(
        `SELECT beneficiary_afm, beneficiary_name,
                COUNT(DISTINCT ada)::integer AS contract_count,
                SUM(amount)::numeric AS total_amount,
                MIN(issue_date) AS first_seen,
                MAX(issue_date) AS last_seen
         FROM expenses
         WHERE beneficiary_afm = $1 AND decision_type = 'Β.2.2'
         GROUP BY beneficiary_afm, beneficiary_name`,
        [afm]
      )

      if (!info) {
        return NextResponse.json(
          { info: null, expenses: [] }
        )
      }

      const expenses = await query<Expense>(
        `SELECT * FROM expenses
         WHERE beneficiary_afm = $1
         ORDER BY issue_date DESC`,
        [afm]
      )

      return NextResponse.json({
        info,
        expenses,
      })
    }

    // List mode with pagination
    const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10))
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)))
    const search = searchParams.get('search') || ''
    const sortRaw = searchParams.get('sort') || 'total_amount'
    const orderRaw = (searchParams.get('order') || 'desc').toLowerCase()

    const sort = ALLOWED_SORT_COLUMNS.includes(sortRaw) ? sortRaw : 'total_amount'
    const order = ALLOWED_ORDERS.includes(orderRaw) ? orderRaw : 'desc'

    const conditions: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (search) {
      conditions.push(
        `(beneficiary_name ILIKE $${paramIndex} OR beneficiary_afm ILIKE $${paramIndex})`
      )
      params.push(`%${search}%`)
      paramIndex++
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Use a CTE to compute beneficiary stats from expenses directly
    // (avoids stale materialized view during backfill)
    const beneficiaryCTE = `
      WITH beneficiary_stats AS (
        SELECT beneficiary_afm, beneficiary_name,
               COUNT(DISTINCT ada)::integer AS contract_count,
               SUM(amount)::numeric AS total_amount,
               MIN(issue_date) AS first_seen,
               MAX(issue_date) AS last_seen
        FROM expenses
        WHERE beneficiary_afm IS NOT NULL AND decision_type = 'Β.2.2'
        GROUP BY beneficiary_afm, beneficiary_name
      )`

    // Count query
    const countResult = await queryOne<{ total: number }>(
      `${beneficiaryCTE}
       SELECT COUNT(*)::integer AS total
       FROM beneficiary_stats
       ${whereClause}`,
      params
    )

    // Data query
    const offset = page * size
    const beneficiaries = await query<TopBeneficiary>(
      `${beneficiaryCTE}
       SELECT beneficiary_afm, beneficiary_name,
              contract_count, total_amount,
              first_seen, last_seen
       FROM beneficiary_stats
       ${whereClause}
       ORDER BY ${sort} ${order} NULLS LAST
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, size, offset]
    )

    return NextResponse.json({
      data: beneficiaries,
      total: countResult?.total ?? 0,
      page,
      size,
    })
  } catch (error) {
    console.error('Beneficiaries API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch beneficiaries' },
      { status: 500 }
    )
  }
}
