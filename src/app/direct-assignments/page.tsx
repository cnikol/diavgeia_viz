'use client'

import { useEffect, useState, useCallback } from 'react'
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
import { YearSelect } from '@/components/shared/year-select'
import { SearchInput } from '@/components/shared/search-input'
import { Pagination } from '@/components/shared/pagination'
import { StatCard } from '@/components/shared/stat-card'
import { formatEUR, formatDate, formatNumber } from '@/lib/formatters'
import { FileText, Euro } from 'lucide-react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'

interface Expense {
  id: number
  ada: string
  decision_type: string
  issue_date: string
  amount: number
  description: string | null
  assignment_type: string | null
  beneficiary_afm: string | null
  beneficiary_name: string | null
  cpv_codes: string[] | null
}

interface ExpenseResponse {
  data: Expense[]
  total: number
  page: number
  size: number
}

function SortIcon({ column, activeSort, activeOrder }: { column: string; activeSort: string; activeOrder: 'asc' | 'desc' }) {
  if (activeSort !== column) return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 text-muted-foreground/50" />
  return activeOrder === 'asc'
    ? <ArrowUp className="ml-1 inline h-3.5 w-3.5" />
    : <ArrowDown className="ml-1 inline h-3.5 w-3.5" />
}

export default function DirectAssignmentsPage() {
  const [data, setData] = useState<ExpenseResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [year, setYear] = useState(new Date().getFullYear())
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('issue_date')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const size = 20

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      direct_only: 'true',
      year: String(year),
      sort,
      order,
    })
    if (search) params.set('beneficiary', search)

    try {
      const res = await fetch(`/api/expenses?${params}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }, [page, year, search, sort, order])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalPages = data ? Math.ceil(data.total / size) : 0

  const toggleSort = (col: string) => {
    if (sort === col) {
      setOrder(order === 'asc' ? 'desc' : 'asc')
    } else {
      setSort(col)
      setOrder('desc')
    }
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Απευθείας Αναθέσεις"
        subtitle="Όλες οι απευθείας αναθέσεις έργων, προμηθειών και υπηρεσιών"
      />

      {/* Filter bar */}
      <Card className="mb-6 animate-slide-up">
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <YearSelect
            value={year}
            onChange={(y) => { setYear(y); setPage(0) }}
          />
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(0) }}
            placeholder="Αναζήτηση δικαιούχου..."
            className="w-full max-w-xs"
          />
          {data && (
            <Badge variant="secondary" className="ml-auto">
              {formatNumber(data.total)} αποτελέσματα
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {data && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 animate-slide-up stagger-2">
          <StatCard
            title={`Αποφάσεις (${year})`}
            value={formatNumber(data.total)}
            icon={<FileText className="h-5 w-5 text-blue-600" />}
            borderColor="border-l-blue-500"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="Σύνολο Σελίδας"
            value={formatEUR(data.data.reduce((sum, e) => sum + Number(e.amount), 0))}
            icon={<Euro className="h-5 w-5 text-emerald-600" />}
            borderColor="border-l-emerald-500"
            iconBg="bg-emerald-50"
          />
        </div>
      )}

      {/* Table */}
      <Card className="animate-slide-up stagger-3">
        <CardHeader>
          <CardTitle>Αποτελέσματα</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 rounded bg-muted" />
              ))}
            </div>
          ) : data && data.data.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none hover:text-foreground"
                      onClick={() => toggleSort('issue_date')}
                    >
                      Ημ/νία <SortIcon column="issue_date" activeSort={sort} activeOrder={order} />
                    </TableHead>
                    <TableHead>ΑΔΑ</TableHead>
                    <TableHead className="hidden md:table-cell">Περιγραφή</TableHead>
                    <TableHead>Δικαιούχος</TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right hover:text-foreground"
                      onClick={() => toggleSort('amount')}
                    >
                      Ποσό <SortIcon column="amount" activeSort={sort} activeOrder={order} />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((exp) => (
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
                      <TableCell className="hidden max-w-xs truncate md:table-cell" title={exp.description ?? ''}>
                        {exp.description ?? '—'}
                      </TableCell>
                      <TableCell>
                        {exp.beneficiary_afm ? (
                          <Link
                            href={`/beneficiaries/${exp.beneficiary_afm}`}
                            className="text-primary hover:underline"
                          >
                            {exp.beneficiary_name ?? exp.beneficiary_afm}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-medium">
                        {formatEUR(exp.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Δεν βρέθηκαν αποτελέσματα.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
