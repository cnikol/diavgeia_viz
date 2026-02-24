'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { formatEUR, formatDate } from '@/lib/formatters'
import { DECISION_TYPE_LABELS } from '@/lib/diavgeia/constants'
import { ExternalLink, Download } from 'lucide-react'
import Link from 'next/link'

interface DecisionDetail {
  id: number
  ada: string
  protocol_number: string | null
  subject: string
  decision_type: string
  issue_date: string
  publish_date: string | null
  organization_id: string
  status: string
  url: string | null
  document_url: string | null
  extra_fields: Record<string, unknown>
}

interface Expense {
  id: number
  amount: number
  kae: string | null
  beneficiary_afm: string | null
  beneficiary_name: string | null
  is_direct_assignment: boolean
  assignment_type: string | null
  cpv_codes: string[] | null
}

export default function DecisionDetailPage() {
  const params = useParams()
  const ada = params.ada as string
  const [decision, setDecision] = useState<DecisionDetail | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/decisions?ada=${ada}`)
        const json = await res.json()
        setDecision(json.decision)
        setExpenses(json.expenses ?? [])
      } catch (err) {
        console.error('Failed to fetch decision:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [ada])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-96 rounded bg-muted" />
          <div className="h-48 rounded-xl bg-muted" />
        </div>
      </div>
    )
  }

  if (!decision) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">Δεν βρέθηκε απόφαση με ΑΔΑ: {ada}</p>
      </div>
    )
  }

  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={decision.subject}
        breadcrumbs={[
          { label: 'Επισκόπηση', href: '/' },
          { label: `ΑΔΑ: ${decision.ada}` },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 animate-slide-up">
          <Card>
            <CardHeader>
              <CardTitle>Στοιχεία Απόφασης</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">ΑΔΑ</dt>
                  <dd className="font-mono font-medium">{decision.ada}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Αρ. Πρωτοκόλλου</dt>
                  <dd>{decision.protocol_number ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Τύπος</dt>
                  <dd>
                    <Badge variant="secondary">
                      {DECISION_TYPE_LABELS[decision.decision_type] ?? decision.decision_type}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Κατάσταση</dt>
                  <dd>{decision.status}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Ημ/νία Έκδοσης</dt>
                  <dd>{formatDate(decision.issue_date)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Ημ/νία Ανάρτησης</dt>
                  <dd>{decision.publish_date ? formatDate(decision.publish_date) : '—'}</dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild>
                  <a
                    href={`https://diavgeia.gov.gr/decision/view/${decision.ada}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Προβολή στη Διαύγεια
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href={`https://diavgeia.gov.gr/doc/${decision.ada}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4" />
                    Λήψη Εγγράφου
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial summary */}
        <div className="animate-slide-up stagger-2">
          <Card>
            <CardHeader>
              <CardTitle>Οικονομικά Στοιχεία</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Συνολικό Ποσό</p>
                <p className="text-3xl font-bold tracking-tight text-primary">
                  {formatEUR(totalAmount)}
                </p>
              </div>

              {expenses.length > 0 && (
                <div className="space-y-3">
                  {expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="rounded-lg border bg-muted/50 p-3 text-sm transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {formatEUR(Number(exp.amount))}
                        </span>
                        {exp.is_direct_assignment && (
                          <Badge variant="destructive">Απευθείας</Badge>
                        )}
                      </div>
                      {exp.beneficiary_name && (
                        <p className="mt-1 text-muted-foreground">
                          <Link
                            href={`/beneficiaries/${exp.beneficiary_afm}`}
                            className="text-primary hover:underline"
                          >
                            {exp.beneficiary_name}
                          </Link>
                        </p>
                      )}
                      {exp.kae && (
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          ΚΑΕ: {exp.kae}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
