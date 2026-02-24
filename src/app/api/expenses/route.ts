import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import type { Expense } from '@/types/database'

const ALLOWED_SORT_COLUMNS = [
  'amount',
  'issue_date',
  'decision_type',
  'beneficiary_name',
  'created_at',
]
const ALLOWED_ORDERS = ['asc', 'desc']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10))
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)))
    const directOnly = searchParams.get('direct_only') === 'true'
    const year = searchParams.get('year') || ''
    const minAmount = searchParams.get('min_amount') || ''
    const maxAmount = searchParams.get('max_amount') || ''
    const beneficiary = searchParams.get('beneficiary') || ''
    const sortRaw = searchParams.get('sort') || 'amount'
    const orderRaw = (searchParams.get('order') || 'desc').toLowerCase()

    const sort = ALLOWED_SORT_COLUMNS.includes(sortRaw) ? sortRaw : 'amount'
    const order = ALLOWED_ORDERS.includes(orderRaw) ? orderRaw : 'desc'

    const conditions: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (directOnly) {
      conditions.push('is_direct_assignment = TRUE')
    }

    if (year) {
      const yearNum = parseInt(year, 10)
      if (!isNaN(yearNum)) {
        conditions.push(`EXTRACT(YEAR FROM issue_date) = $${paramIndex++}`)
        params.push(yearNum)
      }
    }

    if (minAmount) {
      const min = parseFloat(minAmount)
      if (!isNaN(min)) {
        conditions.push(`amount >= $${paramIndex++}`)
        params.push(min)
      }
    }

    if (maxAmount) {
      const max = parseFloat(maxAmount)
      if (!isNaN(max)) {
        conditions.push(`amount <= $${paramIndex++}`)
        params.push(max)
      }
    }

    if (beneficiary) {
      conditions.push(
        `(beneficiary_name ILIKE $${paramIndex} OR beneficiary_afm = $${paramIndex + 1})`
      )
      params.push(`%${beneficiary}%`, beneficiary)
      paramIndex += 2
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Count query
    const countResult = await queryOne<{ total: number }>(
      `SELECT COUNT(*)::integer AS total FROM expenses ${whereClause}`,
      params
    )

    // Data query
    const offset = page * size
    const expenses = await query<Expense>(
      `SELECT * FROM expenses
       ${whereClause}
       ORDER BY ${sort} ${order} NULLS LAST
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, size, offset]
    )

    return NextResponse.json({
      data: expenses,
      total: countResult?.total ?? 0,
      page,
      size,
    })
  } catch (error) {
    console.error('Expenses API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}
