'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEUR, formatNumber } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'

const ExpenseMap = dynamic(
  () => import('@/components/map/expense-map').then((mod) => mod.ExpenseMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[500px] w-full rounded-lg" />,
  }
)

interface MapStats {
  total_spent: number
  decision_count: number
}

export default function MapPage() {
  const [stats, setStats] = useState<MapStats | null>(null)

  useEffect(() => {
    fetch('/api/stats?year=0')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(console.error)
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Χάρτης</h1>
        <p className="mt-1 text-sm text-gray-500">
          Δήμος Καρδίτσας — Γεωγραφική Επισκόπηση
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Συνολική Δαπάνη (όλα τα έτη)</p>
            <p className="text-xl font-bold text-blue-600">
              {stats ? formatEUR(stats.total_spent) : '...'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Συνολικές Αποφάσεις</p>
            <p className="text-xl font-bold">
              {stats ? formatNumber(stats.decision_count) : '...'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Δήμος Καρδίτσας</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseMap
            totalSpending={stats?.total_spent ?? 0}
          />
        </CardContent>
      </Card>
    </div>
  )
}
