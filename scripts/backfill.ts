import { Pool } from 'pg'
import { generateDateWindows, fetchAllDecisionsInWindow } from '../src/lib/diavgeia/client'
import { parseDecisionToExpenses } from '../src/lib/diavgeia/parser'
import { DECISION_TYPES, DECISION_TYPE_LABELS } from '../src/lib/diavgeia/constants'
import { DiavgeiaDecision } from '../src/lib/diavgeia/types'
import { runMigrations, refreshMaterializedViews } from '../src/lib/db/migrate'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })

async function upsertDecision(decision: DiavgeiaDecision): Promise<number | null> {
  const result = await pool.query(
    `INSERT INTO decisions (ada, protocol_number, subject, decision_type, issue_date, publish_date, organization_id, status, url, document_url, signer_ids, unit_ids, thematic_category_ids, extra_fields, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now())
     ON CONFLICT (ada) DO UPDATE SET
       subject = EXCLUDED.subject,
       extra_fields = EXCLUDED.extra_fields,
       updated_at = now()
     RETURNING id`,
    [
      decision.ada,
      decision.protocolNumber ?? null,
      decision.subject,
      decision.decisionTypeId,
      new Date(decision.issueDate).toISOString(),
      decision.publishDate ? new Date(decision.publishDate).toISOString() : null,
      decision.organizationId,
      decision.status,
      decision.url,
      decision.documentUrl ?? null,
      decision.signerIds ?? [],
      decision.unitIds ?? [],
      decision.thematicCategoryIds ?? [],
      JSON.stringify(decision.extraFieldValues),
    ]
  )
  return result.rows[0]?.id ?? null
}

async function upsertExpenses(decisionId: number, decision: DiavgeiaDecision): Promise<number> {
  const expenses = parseDecisionToExpenses(decision)
  let inserted = 0

  for (const exp of expenses) {
    try {
      await pool.query(
        `INSERT INTO expenses (decision_id, ada, decision_type, issue_date, financial_year, amount, currency, kae, description, assignment_type, is_direct_assignment, cpv_codes, beneficiary_afm, beneficiary_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (ada, beneficiary_afm, kae, amount) DO NOTHING`,
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
      inserted++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      // Skip duplicates silently, log other errors
      if (!msg.includes('duplicate key')) {
        console.error(`  Error inserting expense for ${exp.ada}: ${msg}`)
      }
    }
  }

  return inserted
}

async function backfill() {
  console.log('=== TransparencyGov Backfill ===')
  console.log()

  // Run migrations first
  await runMigrations()
  console.log()

  // Create sync log entry
  const syncResult = await pool.query(
    `INSERT INTO sync_log (sync_type, status, from_date, to_date)
     VALUES ('backfill', 'running', $1, $2) RETURNING id`,
    ['2019-01-01', new Date().toISOString()]
  )
  const syncId = syncResult.rows[0].id

  const windows = generateDateWindows()
  const types = Object.values(DECISION_TYPES)

  let totalFetched = 0
  let totalInserted = 0

  for (const type of types) {
    console.log(`\n--- Fetching type: ${type} (${DECISION_TYPE_LABELS[type]}) ---`)

    for (const window of windows) {
      process.stdout.write(`  Window ${window.from} → ${window.to}: `)

      try {
        const decisions = await fetchAllDecisionsInWindow(
          type,
          window.from,
          window.to,
          (page, total) => {
            if (page === 0) process.stdout.write(`${total} total, `)
          }
        )

        totalFetched += decisions.length
        let windowInserted = 0

        for (const decision of decisions) {
          const decisionId = await upsertDecision(decision)
          if (decisionId) {
            const count = await upsertExpenses(decisionId, decision)
            windowInserted += count
          }
        }

        totalInserted += windowInserted
        console.log(`${decisions.length} decisions, ${windowInserted} expenses inserted`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`ERROR: ${msg}`)
      }
    }
  }

  // Refresh materialized views
  console.log('\nRefreshing materialized views...')
  try {
    await refreshMaterializedViews()
  } catch {
    // Views might not have CONCURRENTLY support on first run
    console.log('Refreshing without CONCURRENTLY...')
    await pool.query('REFRESH MATERIALIZED VIEW mv_monthly_spending')
    await pool.query('REFRESH MATERIALIZED VIEW mv_top_beneficiaries')
    console.log('Materialized views refreshed.')
  }

  // Update sync log
  await pool.query(
    `UPDATE sync_log SET status = 'completed', records_fetched = $1, records_inserted = $2, completed_at = now() WHERE id = $3`,
    [totalFetched, totalInserted, syncId]
  )

  console.log(`\n=== Backfill Complete ===`)
  console.log(`Total decisions fetched: ${totalFetched}`)
  console.log(`Total expenses inserted: ${totalInserted}`)
}

backfill()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Backfill failed:', err)
    process.exit(1)
  })
