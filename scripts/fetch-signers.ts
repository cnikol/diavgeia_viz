import { Pool } from 'pg'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })

async function main() {
  // Create signers table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS signers (
      id          TEXT PRIMARY KEY,
      first_name  TEXT,
      last_name   TEXT,
      org_id      TEXT,
      position    TEXT,
      fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  console.log('Signers table created/verified')

  // Get all unique signer IDs from decisions
  const result = await pool.query(`
    SELECT unnest(signer_ids) as signer_id, COUNT(*) as cnt
    FROM decisions
    GROUP BY 1
    ORDER BY cnt DESC
  `)

  console.log(`Found ${result.rows.length} unique signers to fetch`)

  for (const row of result.rows) {
    try {
      const res = await fetch(
        `https://diavgeia.gov.gr/opendata/signers/${row.signer_id}.json`
      )
      if (res.status !== 200) {
        console.log(`  Skip ${row.signer_id} (status ${res.status})`)
        continue
      }
      const data = await res.json()
      await pool.query(
        `INSERT INTO signers (id, first_name, last_name, org_id, position)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           position = EXCLUDED.position`,
        [
          row.signer_id,
          data.firstName ?? null,
          data.lastName ?? null,
          data.organizationId ?? null,
          data.position ?? null,
        ]
      )
      console.log(`  ${data.firstName} ${data.lastName} (${row.cnt} decisions)`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`  Error fetching ${row.signer_id}: ${msg}`)
    }
  }

  console.log('Done')
  await pool.end()
}

main()
