import { pool } from './index'

const migration1 = `
-- decisions: raw data from Diavgeia
CREATE TABLE IF NOT EXISTS decisions (
    id              BIGSERIAL PRIMARY KEY,
    ada             TEXT NOT NULL UNIQUE,
    protocol_number TEXT,
    subject         TEXT NOT NULL,
    decision_type   TEXT NOT NULL,
    issue_date      TIMESTAMPTZ NOT NULL,
    publish_date    TIMESTAMPTZ,
    organization_id TEXT NOT NULL DEFAULT '6135',
    status          TEXT NOT NULL DEFAULT 'PUBLISHED',
    url             TEXT,
    document_url    TEXT,
    signer_ids      TEXT[],
    unit_ids        TEXT[],
    thematic_category_ids TEXT[],
    extra_fields    JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decisions_type_date ON decisions(decision_type, issue_date);
CREATE INDEX IF NOT EXISTS idx_decisions_issue_date ON decisions(issue_date);
CREATE INDEX IF NOT EXISTS idx_decisions_extra ON decisions USING gin(extra_fields);

-- expenses: normalized financial records (1+ per decision)
CREATE TABLE IF NOT EXISTS expenses (
    id                   BIGSERIAL PRIMARY KEY,
    decision_id          BIGINT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    ada                  TEXT NOT NULL,
    decision_type        TEXT NOT NULL,
    issue_date           TIMESTAMPTZ NOT NULL,
    financial_year       INTEGER,
    amount               NUMERIC(15,2) NOT NULL,
    currency             TEXT NOT NULL DEFAULT 'EUR',
    kae                  TEXT,
    description          TEXT,
    assignment_type      TEXT,
    is_direct_assignment BOOLEAN NOT NULL DEFAULT FALSE,
    cpv_codes            TEXT[],
    beneficiary_afm      TEXT,
    beneficiary_name     TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(ada, beneficiary_afm, kae, amount)
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(issue_date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(decision_type);
CREATE INDEX IF NOT EXISTS idx_expenses_beneficiary ON expenses(beneficiary_afm);
CREATE INDEX IF NOT EXISTS idx_expenses_direct ON expenses(is_direct_assignment) WHERE is_direct_assignment;
CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(amount DESC);

-- sync_log: track import state
CREATE TABLE IF NOT EXISTS sync_log (
    id               BIGSERIAL PRIMARY KEY,
    sync_type        TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'running',
    records_fetched  INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    from_date        TIMESTAMPTZ,
    to_date          TIMESTAMPTZ,
    error_message    TEXT,
    started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at     TIMESTAMPTZ
);
`

const migration2 = `
-- Materialized views for fast dashboard queries
DROP MATERIALIZED VIEW IF EXISTS mv_monthly_spending;
CREATE MATERIALIZED VIEW mv_monthly_spending AS
SELECT date_trunc('month', issue_date) AS month,
       decision_type, is_direct_assignment,
       COUNT(*) AS tx_count, SUM(amount) AS total
FROM expenses GROUP BY 1,2,3;

DROP MATERIALIZED VIEW IF EXISTS mv_top_beneficiaries;
CREATE MATERIALIZED VIEW mv_top_beneficiaries AS
SELECT beneficiary_afm, beneficiary_name,
       COUNT(*) AS contract_count, SUM(amount) AS total_amount,
       MIN(issue_date) AS first_seen, MAX(issue_date) AS last_seen
FROM expenses WHERE beneficiary_afm IS NOT NULL
GROUP BY 1,2 ORDER BY total_amount DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_monthly ON mv_monthly_spending(month, decision_type, is_direct_assignment);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_beneficiaries ON mv_top_beneficiaries(beneficiary_afm, beneficiary_name);
`

export async function runMigrations() {
  const client = await pool.connect()
  try {
    console.log('Running migration 1: Core tables...')
    await client.query(migration1)
    console.log('Migration 1 complete.')

    console.log('Running migration 2: Materialized views...')
    await client.query(migration2)
    console.log('Migration 2 complete.')

    console.log('All migrations complete.')
  } finally {
    client.release()
  }
}

export async function refreshMaterializedViews() {
  const client = await pool.connect()
  try {
    await client.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_spending')
    await client.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_beneficiaries')
    console.log('Materialized views refreshed.')
  } finally {
    client.release()
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err)
      process.exit(1)
    })
}
