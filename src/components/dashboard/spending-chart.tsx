"use client"

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCompact, formatEUR, formatMonth } from "@/lib/formatters"

interface SpendingChartProps {
  data: Array<{ month: string; total: number }>
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="text-sm font-medium text-muted-foreground">
        {label ? formatMonth(label) : ""}
      </p>
      <p className="text-base font-bold">{formatEUR(payload[0].value)}</p>
    </div>
  )
}

export function SpendingChart({ data }: SpendingChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Μηνιαία Δαπάνη</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tickFormatter={(val: string) => formatMonth(val)}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={(val: number) => formatCompact(val)}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#spendingGradient)"
                dot={false}
                activeDot={{ r: 5, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
