'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { formatEUR, formatDate, formatNumber } from '@/lib/formatters'
import { DECISION_TYPE_LABELS } from '@/lib/diavgeia/constants'
import { Euro, FileText, CalendarDays } from 'lucide-react'
import Link from 'next/link'

interface BeneficiaryDetail {
  beneficiary_afm: string
  beneficiary_name: string
  contract_count: number
  total_amount: number
  first_seen: string
  last_seen: string
}

interface Expense {
  id: number
  ada: string
  decision_type: string
  issue_date: string
  amount: number
  description: string | null
  is_direct_assignment: boolean
  kae: string | null
}

export default function BeneficiaryDetailPage() {
  const params = useParams()
  const afm = params.afm as string
  const [info, setInfo] = useState<BeneficiaryDetail | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/beneficiaries?afm=${afm}`)
        const json = await res.json()
        setInfo(json.info)
        setExpenses(json.expenses ?? [])
      } catch (err) {
        console.error('Failed to fetch beneficiary:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [afm])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted" />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-muted" />
        </div>
      </div>
    )
  }

  if (!info) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">Δεν βρέθηκε δικαιούχος με ΑΦΜ: {afm}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={info.beneficiary_name || 'Άγνωστος'}
        subtitle={`ΑΦΜ: ${info.beneficiary_afm}`}
        breadcrumbs={[
          { label: 'Επισκόπηση', href: '/' },
          { label: 'Δικαιούχοι', href: '/beneficiaries' },
          { label: info.beneficiary_name || afm },
        ]}
      />

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-slide-up">
        <StatCard
          title="Συνολικό Ποσό"
          value={formatEUR(Number(info.total_amount))}
          icon={<Euro className="h-5 w-5 text-blue-600" />}
          borderColor="border-l-blue-500"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Συμβάσεις"
          value={formatNumber(info.contract_count)}
          icon={<FileText className="h-5 w-5 text-emerald-600" />}
          borderColor="border-l-emerald-500"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Πρώτη Εμφάνιση"
          value={formatDate(info.first_seen)}
          icon={<CalendarDays className="h-5 w-5 text-orange-600" />}
          borderColor="border-l-orange-500"
          iconBg="bg-orange-50"
        />
        <StatCard
          title="Τελευταία Εμφάνιση"
          value={formatDate(info.last_seen)}
          icon={<CalendarDays className="h-5 w-5 text-purple-600" />}
          borderColor="border-l-purple-500"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Expenses list */}
      <Card className="animate-slide-up stagger-2">
        <CardHeader>
          <CardTitle>Όλες οι Συναλλαγές</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ημ/νία</TableHead>
                  <TableHead>ΑΔΑ</TableHead>
                  <TableHead>Τύπος</TableHead>
                  <TableHead className="hidden md:table-cell">Περιγραφή</TableHead>
                  <TableHead className="text-right">Ποσό</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(exp.issue_date)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/decisions/${exp.ada}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {exp.ada}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={exp.is_direct_assignment ? 'destructive' : 'secondary'}>
                        {DECISION_TYPE_LABELS[exp.decision_type] ?? exp.decision_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden max-w-xs truncate md:table-cell" title={exp.description ?? ''}>
                      {exp.description ?? '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-medium">
                      {formatEUR(exp.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Δεν βρέθηκαν συναλλαγές.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
