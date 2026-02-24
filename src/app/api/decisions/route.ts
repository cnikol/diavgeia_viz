import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import type { Decision } from '@/types/database'

const ALLOWED_SORT_COLUMNS = [
  'issue_date',
  'publish_date',
  'subject',
  'decision_type',
  'amount',
]
const ALLOWED_ORDERS = ['asc', 'desc']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Single decision detail by ADA
    const ada = searchParams.get('ada')
    if (ada) {
      const decision = await queryOne<Decision>(
        `SELECT * FROM decisions WHERE ada = $1`,
        [ada]
      )
      if (!decision) {
        return NextResponse.json({ decision: null, expenses: [] })
      }
      const expenses = await query(
        `SELECT * FROM expenses WHERE ada = $1 ORDER BY amount DESC`,
        [ada]
      )
      return NextResponse.json({ decision, expenses })
    }

    const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10))
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)))
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''
    const year = searchParams.get('year') || ''
    const sortRaw = searchParams.get('sort') || 'issue_date'
    const orderRaw = (searchParams.get('order') || 'desc').toLowerCase()

    const sort = ALLOWED_SORT_COLUMNS.includes(sortRaw) ? sortRaw : 'issue_date'
    const order = ALLOWED_ORDERS.includes(orderRaw) ? orderRaw : 'desc'

    const conditions: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (type) {
      conditions.push(`d.decision_type = $${paramIndex++}`)
      params.push(type)
    }

    if (search) {
      conditions.push(`(d.subject ILIKE $${paramIndex} OR d.ada ILIKE $${paramIndex})`)
      params.push(`%${search}%`)
      paramIndex++
    }

    if (year) {
      const yearNum = parseInt(year, 10)
      if (!isNaN(yearNum)) {
        conditions.push(`EXTRACT(YEAR FROM d.issue_date) = $${paramIndex++}`)
        params.push(yearNum)
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Sort column mapping: "amount" lives on the expenses aggregate
    const sortColumn = sort === 'amount' ? 'total_amount' : `d.${sort}`

    // Count query
    const countResult = await queryOne<{ total: number }>(
      `SELECT COUNT(DISTINCT d.id)::integer AS total
       FROM decisions d
       ${whereClause}`,
      params
    )

    // Data query with expense aggregation
    const offset = page * size
    const decisions = await query<
      Decision & { total_amount: number; expense_count: number }
    >(
      `SELECT d.*,
              COALESCE(SUM(e.amount), 0)::numeric AS total_amount,
              COUNT(e.id)::integer                 AS expense_count
       FROM decisions d
       LEFT JOIN expenses e ON e.decision_id = d.id
       ${whereClause}
       GROUP BY d.id
       ORDER BY ${sortColumn} ${order} NULLS LAST
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, size, offset]
    )

    return NextResponse.json({
      data: decisions,
      total: countResult?.total ?? 0,
      page,
      size,
    })
  } catch (error) {
    console.error('Decisions API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch decisions' },
      { status: 500 }
    )
  }
}
