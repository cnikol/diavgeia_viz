"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatEUR, formatDate } from "@/lib/formatters"
import { DECISION_TYPE_LABELS } from "@/lib/diavgeia/constants"

interface DecisionRow {
  ada: string
  subject: string
  issue_date: string
  amount: number
  decision_type: string
  beneficiary_afm?: string | null
  beneficiary_name?: string | null
}

interface ColumnConfig {
  key: keyof DecisionRow
  label: string
  sortable?: boolean
  className?: string
}

interface DecisionTableProps {
  data: DecisionRow[]
  columns?: ColumnConfig[]
  pageSize?: number
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "ada", label: "ΑΔΑ", sortable: true },
  { key: "subject", label: "Θέμα", sortable: false, className: "hidden md:table-cell" },
  { key: "decision_type", label: "Τύπος", sortable: true },
  { key: "beneficiary_name", label: "Δικαιούχος", sortable: true, className: "hidden lg:table-cell" },
  { key: "issue_date", label: "Ημερομηνία", sortable: true },
  { key: "amount", label: "Ποσό", sortable: true, className: "text-right" },
]

type SortDirection = "asc" | "desc"

export function DecisionTable({
  data,
  columns = DEFAULT_COLUMNS,
  pageSize = 20,
}: DecisionTableProps) {
  const [sortKey, setSortKey] = useState<keyof DecisionRow>("issue_date")
  const [sortDir, setSortDir] = useState<SortDirection>("desc")
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    const copy = [...data]
    copy.sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      let cmp: number
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal
      } else {
        cmp = String(aVal).localeCompare(String(bVal), "el")
      }
      return sortDir === "asc" ? cmp : -cmp
    })
    return copy
  }, [data, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)

  function handleSort(key: keyof DecisionRow) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
    setPage(0)
  }

  function renderCell(row: DecisionRow, col: ColumnConfig) {
    const value = row[col.key]

    switch (col.key) {
      case "ada":
        return (
          <Link
            href={`/decisions/${row.ada}`}
            className="font-medium text-blue-600 hover:underline"
          >
            {row.ada}
          </Link>
        )
      case "subject":
        return (
          <span className="line-clamp-1 max-w-[300px]" title={row.subject}>
            {row.subject}
          </span>
        )
      case "decision_type":
        return (
          <Badge variant="secondary" className="whitespace-nowrap text-xs">
            {DECISION_TYPE_LABELS[row.decision_type] || row.decision_type}
          </Badge>
        )
      case "beneficiary_name":
        if (!row.beneficiary_afm) {
          return <span className="text-muted-foreground">-</span>
        }
        return (
          <Link
            href={`/beneficiaries/${row.beneficiary_afm}`}
            className="text-blue-600 hover:underline"
          >
            {row.beneficiary_name || row.beneficiary_afm}
          </Link>
        )
      case "issue_date":
        return (
          <span className="whitespace-nowrap">
            {formatDate(value as string)}
          </span>
        )
      case "amount":
        return (
          <span className="whitespace-nowrap font-medium">
            {formatEUR(value as number)}
          </span>
        )
      default:
        return String(value ?? "-")
    }
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.sortable ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  col.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((row) => (
            <TableRow key={row.ada}>
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {renderCell(row, col)}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {paged.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-muted-foreground"
              >
                Δεν βρέθηκαν αποτελέσματα.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t px-2 py-4">
        <p className="text-sm text-muted-foreground">
          {sorted.length === 0
            ? "0 αποτελέσματα"
            : `${page * pageSize + 1} - ${Math.min(
                (page + 1) * pageSize,
                sorted.length
              )} από ${sorted.length}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Προηγ.
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Επόμ.
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
