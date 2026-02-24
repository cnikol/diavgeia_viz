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
import { Button } from "@/components/ui/button"
import { formatEUR, formatNumber, formatDate } from "@/lib/formatters"

interface BeneficiaryRow {
  beneficiary_afm: string
  beneficiary_name: string
  total_amount: number
  contract_count: number
  first_seen: string
  last_seen: string
}

interface BeneficiaryTableProps {
  data: BeneficiaryRow[]
  pageSize?: number
}

type SortKey = keyof BeneficiaryRow
type SortDirection = "asc" | "desc"

interface ColumnDef {
  key: SortKey
  label: string
  sortable: boolean
  className?: string
}

const COLUMNS: ColumnDef[] = [
  { key: "beneficiary_name", label: "Όνομα", sortable: true },
  { key: "beneficiary_afm", label: "ΑΦΜ", sortable: true },
  { key: "total_amount", label: "Συνολικό Ποσό", sortable: true, className: "text-right" },
  { key: "contract_count", label: "Συμβάσεις", sortable: true, className: "text-right" },
  { key: "first_seen", label: "Πρώτη Εμφάνιση", sortable: true, className: "hidden md:table-cell" },
  { key: "last_seen", label: "Τελευταία Εμφάνιση", sortable: true, className: "hidden md:table-cell" },
]

export function BeneficiaryTable({
  data,
  pageSize = 20,
}: BeneficiaryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("total_amount")
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

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
    setPage(0)
  }

  function renderCell(row: BeneficiaryRow, col: ColumnDef) {
    switch (col.key) {
      case "beneficiary_name":
        return (
          <Link
            href={`/beneficiaries/${row.beneficiary_afm}`}
            className="font-medium text-blue-600 hover:underline"
          >
            {row.beneficiary_name || row.beneficiary_afm}
          </Link>
        )
      case "beneficiary_afm":
        return <span className="font-mono text-sm">{row.beneficiary_afm}</span>
      case "total_amount":
        return (
          <span className="font-medium">{formatEUR(row.total_amount)}</span>
        )
      case "contract_count":
        return formatNumber(row.contract_count)
      case "first_seen":
        return (
          <span className="whitespace-nowrap">{formatDate(row.first_seen)}</span>
        )
      case "last_seen":
        return (
          <span className="whitespace-nowrap">{formatDate(row.last_seen)}</span>
        )
      default:
        return String(row[col.key] ?? "-")
    }
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
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
            <TableRow key={row.beneficiary_afm}>
              {COLUMNS.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {renderCell(row, col)}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {paged.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={COLUMNS.length}
                className="text-center text-muted-foreground"
              >
                Δεν βρέθηκαν δικαιούχοι.
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
