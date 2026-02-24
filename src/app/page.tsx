'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { YearSelect } from '@/components/shared/year-select'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { SpendingChart } from '@/components/dashboard/spending-chart'
import { SpendingByType } from '@/components/dashboard/spending-by-type'
import { RecentDecisions } from '@/components/dashboard/recent-decisions'
import { SignersTable } from '@/components/dashboard/signers-table'
import { Skeleton } from '@/components/ui/skeleton'

interface Signer {
  signer_id: string
  first_name: string
  last_name: string
  position: string | null
  decision_count: number
  total_amount: number
}

interface StatsData {
  total_spent: number
  decision_count: number
  direct_assignment_pct: number
  avg_decision_amount: number
  monthly_spending: Array<{ month: string; total: number }>
  spending_by_type: Array<{
    decision_type: string
    total: number
    count: number
  }>
  yearly_totals: Array<{ year: number; total: number }>
  recent_decisions: Array<{
    ada: string
    subject: string
    issue_date: string
    amount: number
    decision_type: string
  }>
}

export default function HomePage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [data, setData] = useState<StatsData | null>(null)
  const [prevData, setPrevData] = useState<StatsData | null>(null)
  const [signers, setSigners] = useState<Signer[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, prevStatsRes, signersRes] = await Promise.all([
        fetch(`/api/stats?year=${year}`),
        fetch(`/api/stats?year=${year - 1}`),
        fetch(`/api/signers?year=${year}`),
      ])
      const statsJson = await statsRes.json()
      const prevStatsJson = await prevStatsRes.json()
      const signersJson = await signersRes.json()
      setData(statsJson)
      setPrevData(
        Number(prevStatsJson.decision_count) > 0 ? prevStatsJson : null
      )
      setSigners(signersJson.data ?? [])
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Επισκόπηση Δαπανών"
        subtitle="Δήμος Καρδίτσας — Στοιχεία Διαύγειας"
        actions={<YearSelect value={year} onChange={setYear} />}
      />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <section className="animate-slide-up">
            <StatsCards
              totalSpent={data.total_spent}
              decisionCount={data.decision_count}
              directPct={data.direct_assignment_pct}
              avgAmount={data.avg_decision_amount}
              prevTotalSpent={prevData?.total_spent}
              prevDecisionCount={prevData?.decision_count}
              prevDirectPct={prevData?.direct_assignment_pct}
              prevAvgAmount={prevData?.avg_decision_amount}
            />
          </section>

          <section className="animate-slide-up stagger-2 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SpendingChart data={data.monthly_spending} />
            </div>
            <div>
              <SpendingByType data={data.spending_by_type} />
            </div>
          </section>

          <section className="animate-slide-up stagger-3 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {data.recent_decisions && data.recent_decisions.length > 0 && (
              <RecentDecisions data={data.recent_decisions} />
            )}
            {signers.length > 0 && (
              <SignersTable data={signers} />
            )}
          </section>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">
          Δεν βρέθηκαν δεδομένα για το {year}.
        </p>
      )}
    </div>
  )
}
