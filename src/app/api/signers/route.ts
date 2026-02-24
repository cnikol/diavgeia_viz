import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || ''

    const yearFilter = year && year !== '0'
      ? 'WHERE EXTRACT(YEAR FROM d.issue_date) = $1'
      : ''
    const params = yearFilter ? [parseInt(year, 10)] : []

    const signers = await query<{
      signer_id: string
      first_name: string
      last_name: string
      position: string | null
      decision_count: number
      total_amount: number
    }>(
      `SELECT
         s.id AS signer_id,
         s.first_name,
         s.last_name,
         s.position,
         COUNT(DISTINCT d.id)::integer AS decision_count,
         COALESCE(SUM(e.amount), 0)::numeric AS total_amount
       FROM decisions d
       JOIN signers s ON s.id = ANY(d.signer_ids)
       LEFT JOIN expenses e ON e.decision_id = d.id
       ${yearFilter}
       GROUP BY s.id, s.first_name, s.last_name, s.position
       ORDER BY decision_count DESC`,
      params
    )

    return NextResponse.json({ data: signers })
  } catch (error) {
    console.error('Signers API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signers' },
      { status: 500 }
    )
  }
}
