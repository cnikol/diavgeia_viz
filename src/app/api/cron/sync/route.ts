import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, pool } from '@/lib/db'
import { fetchDecisionsSince } from '@/lib/diavgeia/client'
import { parseDecisionToExpenses } from '@/lib/diavgeia/parser'
import { DECISION_TYPES } from '@/lib/diavgeia/constants'
import type { SyncLog } from '@/types/database'
import type { DiavgeiaDecision } from '@/lib/diavgeia/types'

// Vercel crons send GET requests
export async function GET(request: NextRequest) {
  return handleSync(request)
}

export async function POST(request: NextRequest) {
  return handleSync(request)
}

async function handleSync(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const startedAt = new Date().toISOString()
  let syncLogId: number | null = null

  try {
    // Create sync log entry
    const logEntry = await queryOne<SyncLog>(
      `INSERT INTO sync_log (sync_type, status, started_at)
       VALUES ('cron', 'running', $1)
       RETURNING *`,
      [startedAt]
    )
    syncLogId = logEntry?.id ?? null

    // Get last successful sync date
    const lastSync = await queryOne<{ to_date: string }>(
      `SELECT to_date FROM sync_log
       WHERE status = 'success' AND to_date IS NOT NULL
       ORDER BY completed_at DESC
       LIMIT 1`
    )

    // Default to 7 days ago if no previous sync; otherwise last sync minus 2 days overlap
    const now = new Date()
    let fromDate: Date
    if (lastSync?.to_date) {
      fromDate = new Date(lastSync.to_date)
      fromDate.setDate(fromDate.getDate() - 2) // 2-day overlap to catch late publications
    } else {
      fromDate = new Date(now)
      fromDate.setDate(fromDate.getDate() - 7)
    }

    const fromDateStr = fromDate.toISOString().split('T')[0]
    const toDateStr = now.toISOString().split('T')[0]

    console.log(`Sync: fetching decisions from ${fromDateStr} to ${toDateStr}`)

    // Fetch decisions for all 3 types
    const allDecisions: DiavgeiaDecision[] = []
    const decisionTypes = Object.values(DECISION_TYPES)

    for (const type of decisionTypes) {
      console.log(`Sync: fetching type ${type}...`)
      const decisions = await fetchDecisionsSince(type, fromDateStr)
      allDecisions.push(...decisions)
      console.log(`Sync: fetched ${decisions.length} decisions for type ${type}`)
    }

    console.log(`Sync: total fetched ${allDecisions.length} decisions`)

    // Upsert into database using a transaction
    const client = await pool.connect()
    let recordsInserted = 0

    try {
      await client.query('BEGIN')

      for (const decision of allDecisions) {
        // Upsert decision
        const decisionResult = await client.query(
          `INSERT INTO decisions (
             ada, protocol_number, subject, decision_type,
             issue_date, publish_date, organization_id, status,
             url, document_url, signer_ids, unit_ids,
             thematic_category_ids, extra_fields, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now())
           ON CONFLICT (ada) DO UPDATE SET
             subject = EXCLUDED.subject,
             status = EXCLUDED.status,
             url = EXCLUDED.url,
             document_url = EXCLUDED.document_url,
             extra_fields = EXCLUDED.extra_fields,
             updated_at = now()
           RETURNING id`,
          [
            decision.ada,
            decision.protocolNumber ?? null,
            decision.subject,
            decision.decisionTypeId,
            new Date(decision.issueDate).toISOString(),
            decision.publishDate
              ? new Date(decision.publishDate).toISOString()
              : null,
            decision.organizationId,
            decision.status,
            decision.url,
            decision.documentUrl ?? null,
            decision.signerIds ?? null,
            decision.unitIds ?? null,
            decision.thematicCategoryIds ?? null,
            JSON.stringify(decision.extraFieldValues),
          ]
        )

        const decisionId = decisionResult.rows[0]?.id
        if (!decisionId) continue

        // Parse and upsert expenses
        const expenses = parseDecisionToExpenses(decision)
        for (const exp of expenses) {
          await client.query(
            `INSERT INTO expenses (
               decision_id, ada, decision_type, issue_date,
               financial_year, amount, currency, kae, description,
               assignment_type, is_direct_assignment, cpv_codes,
               beneficiary_afm, beneficiary_name
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (ada, beneficiary_afm, kae, amount) DO UPDATE SET
               description = EXCLUDED.description,
               is_direct_assignment = EXCLUDED.is_direct_assignment`,
            [
              decisionId,
              exp.ada,
              exp.decision_type,
              exp.issue_date,
              exp.financial_year,
              exp.amount,
              exp.currency,
              exp.kae,
              exp.description,
              exp.assignment_type,
              exp.is_direct_assignment,
              exp.cpv_codes,
              exp.beneficiary_afm,
              exp.beneficiary_name,
            ]
          )
          recordsInserted++
        }
      }

      await client.query('COMMIT')
    } catch (txError) {
      await client.query('ROLLBACK')
      throw txError
    } finally {
      client.release()
    }

    // Refresh materialized views outside the transaction
    console.log('Sync: refreshing materialized views...')
    const mvClient = await pool.connect()
    try {
      await mvClient.query(
        'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_spending'
      )
      await mvClient.query(
        'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_beneficiaries'
      )
    } finally {
      mvClient.release()
    }
    console.log('Sync: materialized views refreshed.')

    // Update sync log with success
    if (syncLogId) {
      await query(
        `UPDATE sync_log SET
           status = 'success',
           records_fetched = $1,
           records_inserted = $2,
           from_date = $3,
           to_date = $4,
           completed_at = now()
         WHERE id = $5`,
        [allDecisions.length, recordsInserted, fromDateStr, toDateStr, syncLogId]
      )
    }

    console.log(
      `Sync complete: ${allDecisions.length} fetched, ${recordsInserted} upserted.`
    )

    return NextResponse.json({
      success: true,
      records_fetched: allDecisions.length,
      records_inserted: recordsInserted,
      from_date: fromDateStr,
      to_date: toDateStr,
    })
  } catch (error) {
    console.error('Sync error:', error)

    // Log failure
    if (syncLogId) {
      try {
        await query(
          `UPDATE sync_log SET
             status = 'error',
             error_message = $1,
             completed_at = now()
           WHERE id = $2`,
          [
            error instanceof Error ? error.message : 'Unknown error',
            syncLogId,
          ]
        )
      } catch (logError) {
        console.error('Failed to update sync log:', logError)
      }
    }

    return NextResponse.json(
      {
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
