"use client"

import { Euro, FileText, TrendingUp, Calculator } from "lucide-react"
import { StatCard } from "@/components/shared/stat-card"
import { formatEUR, formatNumber } from "@/lib/formatters"

interface StatsCardsProps {
  totalSpent: number
  decisionCount: number
  directPct: number
  avgAmount: number
  prevTotalSpent?: number
  prevDecisionCount?: number
  prevDirectPct?: number
  prevAvgAmount?: number
}

function computeDelta(
  current: number,
  prev: number | undefined
): { delta: string; deltaType: "increase" | "decrease" | "neutral" } | null {
  if (prev === undefined || prev === 0) return null
  const pct = ((current - prev) / prev) * 100
  if (Math.abs(pct) < 1) return { delta: "~0%", deltaType: "neutral" }
  const sign = pct > 0 ? "+" : ""
  return {
    delta: `${pct > 0 ? "▲" : "▼"} ${sign}${pct.toFixed(1)}%`,
    deltaType: pct > 0 ? "increase" : "decrease",
  }
}

export function StatsCards({
  totalSpent,
  decisionCount,
  directPct,
  avgAmount,
  prevTotalSpent,
  prevDecisionCount,
  prevDirectPct,
  prevAvgAmount,
}: StatsCardsProps) {
  const spentDelta = computeDelta(Number(totalSpent), prevTotalSpent !== undefined ? Number(prevTotalSpent) : undefined)
  const countDelta = computeDelta(Number(decisionCount), prevDecisionCount !== undefined ? Number(prevDecisionCount) : undefined)
  const directDelta = computeDelta(Number(directPct), prevDirectPct !== undefined ? Number(prevDirectPct) : undefined)
  const avgDelta = computeDelta(Number(avgAmount), prevAvgAmount !== undefined ? Number(prevAvgAmount) : undefined)

  const cards = [
    {
      title: "Συνολική Δαπάνη",
      value: formatEUR(Number(totalSpent)),
      icon: <Euro className="h-5 w-5 text-blue-600" />,
      borderColor: "border-l-blue-500",
      iconBg: "bg-blue-50",
      ...(spentDelta ?? {}),
    },
    {
      title: "Αποφάσεις",
      value: formatNumber(Number(decisionCount)),
      icon: <FileText className="h-5 w-5 text-emerald-600" />,
      borderColor: "border-l-emerald-500",
      iconBg: "bg-emerald-50",
      delta: countDelta?.delta,
      deltaType: countDelta ? "neutral" as const : undefined,
    },
    {
      title: "Απευθείας Αναθέσεις",
      value: `${Number(directPct).toFixed(1)}%`,
      icon: <TrendingUp className="h-5 w-5 text-orange-600" />,
      borderColor: "border-l-orange-500",
      iconBg: "bg-orange-50",
      ...(directDelta ?? {}),
    },
    {
      title: "Μέσο Ποσό",
      value: formatEUR(Number(avgAmount)),
      icon: <Calculator className="h-5 w-5 text-purple-600" />,
      borderColor: "border-l-purple-500",
      iconBg: "bg-purple-50",
      ...(avgDelta ?? {}),
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <div key={card.title} className={`animate-slide-up stagger-${i + 1}`}>
          <StatCard
            title={card.title}
            value={card.value}
            icon={card.icon}
            borderColor={card.borderColor}
            iconBg={card.iconBg}
            delta={card.delta}
            deltaType={card.deltaType}
          />
        </div>
      ))}
    </div>
  )
}
