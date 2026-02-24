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
import { SearchInput } from '@/components/shared/search-input'
import { Pagination } from '@/components/shared/pagination'
import { formatEUR, formatDate, formatNumber } from '@/lib/formatters'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'

interface Beneficiary {
  beneficiary_afm: string
  beneficiary_name: string
  contract_count: number
  total_amount: number
  first_seen: string
  last_seen: string
}

interface BeneficiaryResponse {
  data: Beneficiary[]
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

export default function BeneficiariesPage() {
  const [data, setData] = useState<BeneficiaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('total_amount')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const size = 20

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort,
      order,
    })
    if (search) params.set('search', search)

    try {
      const res = await fetch(`/api/beneficiaries?${params}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, sort, order])

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
        title="Δικαιούχοι"
        subtitle="Κατάταξη δικαιούχων βάσει συνολικών ποσών"
      />

      {/* Filter bar */}
      <Card className="mb-6 animate-slide-up">
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(0) }}
            placeholder="Αναζήτηση με όνομα ή ΑΦΜ..."
            className="w-full max-w-sm"
          />
          {data && (
            <Badge variant="secondary" className="ml-auto">
              {formatNumber(data.total)} δικαιούχοι
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card className="animate-slide-up stagger-2">
        <CardHeader>
          <CardTitle>Κατάταξη Δικαιούχων</CardTitle>
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
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Δικαιούχος</TableHead>
                    <TableHead className="hidden sm:table-cell">ΑΦΜ</TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right hover:text-foreground"
                      onClick={() => toggleSort('total_amount')}
                    >
                      Συνολικό Ποσό <SortIcon column="total_amount" activeSort={sort} activeOrder={order} />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right hover:text-foreground"
                      onClick={() => toggleSort('contract_count')}
                    >
                      Συμβάσεις <SortIcon column="contract_count" activeSort={sort} activeOrder={order} />
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Πρώτη</TableHead>
                    <TableHead className="hidden lg:table-cell">Τελευταία</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((b, idx) => (
                    <TableRow key={b.beneficiary_afm}>
                      <TableCell className="text-muted-foreground">
                        {page * size + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/beneficiaries/${b.beneficiary_afm}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {b.beneficiary_name || '—'}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs sm:table-cell">
                        {b.beneficiary_afm}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-medium">
                        {formatEUR(Number(b.total_amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(b.contract_count)}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap lg:table-cell">
                        {formatDate(b.first_seen)}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap lg:table-cell">
                        {formatDate(b.last_seen)}
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
              Δεν βρέθηκαν δικαιούχοι.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
