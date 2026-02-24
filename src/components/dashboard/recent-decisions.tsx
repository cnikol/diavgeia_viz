"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatEUR, formatDate } from "@/lib/formatters"
import { DECISION_TYPE_LABELS } from "@/lib/diavgeia/constants"

interface DecisionItem {
  ada: string
  subject: string
  issue_date: string
  amount: number
  decision_type: string
}

interface RecentDecisionsProps {
  data: DecisionItem[]
}

export function RecentDecisions({ data }: RecentDecisionsProps) {
  const decisions = data.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Πρόσφατες Αποφάσεις</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ΑΔΑ</TableHead>
              <TableHead className="hidden sm:table-cell">Θέμα</TableHead>
              <TableHead>Τύπος</TableHead>
              <TableHead>Ημερομηνία</TableHead>
              <TableHead className="text-right">Ποσό</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {decisions.map((decision) => (
              <TableRow key={decision.ada}>
                <TableCell>
                  <Link
                    href={`/decisions/${decision.ada}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {decision.ada}
                  </Link>
                </TableCell>
                <TableCell className="hidden max-w-[250px] truncate sm:table-cell">
                  {decision.subject}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="whitespace-nowrap text-xs">
                    {DECISION_TYPE_LABELS[decision.decision_type] ||
                      decision.decision_type}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(decision.issue_date)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right font-medium">
                  {formatEUR(decision.amount)}
                </TableCell>
              </TableRow>
            ))}
            {decisions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Δεν βρέθηκαν αποφάσεις.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
