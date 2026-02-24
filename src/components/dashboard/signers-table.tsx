'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatEUR, formatNumber } from '@/lib/formatters'

interface Signer {
  signer_id: string
  first_name: string
  last_name: string
  position: string | null
  decision_count: number
  total_amount: number
}

interface SignersTableProps {
  data: Signer[]
}

export function SignersTable({ data }: SignersTableProps) {
  if (!data || data.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Υπογράφοντες</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Όνομα</TableHead>
              <TableHead className="text-right">Αποφάσεις</TableHead>
              <TableHead className="text-right">Συνολικό Ποσό</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((signer, idx) => (
              <TableRow key={signer.signer_id}>
                <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="font-medium">
                  {signer.first_name} {signer.last_name}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(Number(signer.decision_count))}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right font-medium">
                  {formatEUR(Number(signer.total_amount))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
