"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatEUR, formatNumber } from "@/lib/formatters"
import { DECISION_TYPE_LABELS } from "@/lib/diavgeia/constants"

interface SpendingByTypeProps {
  data: Array<{ decision_type: string; total: number; count: number }>
}

const COLORS = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#ea580c", // orange-600
  "#9333ea", // purple-600
  "#dc2626", // red-600
  "#0891b2", // cyan-600
  "#ca8a04", // yellow-600
]

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: { decision_type: string; total: number; count: number }
  }>
}) {
  if (!active || !payload || !payload.length) return null

  const entry = payload[0].payload
  const label =
    DECISION_TYPE_LABELS[entry.decision_type] || entry.decision_type

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">
        Ποσό: {formatEUR(entry.total)}
      </p>
      <p className="text-sm text-muted-foreground">
        Αποφάσεις: {formatNumber(entry.count)}
      </p>
    </div>
  )
}

function renderLegendText(value: string) {
  return (
    <span className="text-sm text-muted-foreground">{value}</span>
  )
}

export function SpendingByType({ data }: SpendingByTypeProps) {
  const chartData = data.map((item) => ({
    ...item,
    name: DECISION_TYPE_LABELS[item.decision_type] || item.decision_type,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Δαπάνη ανά Τύπο Απόφασης</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="total"
                nameKey="name"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={renderLegendText} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
