"use client"

import { useState, useCallback } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectOption } from "@/components/ui/select"
import { DECISION_TYPE_LABELS } from "@/lib/diavgeia/constants"

export interface FilterState {
  year: string
  decisionType: string
  search: string
  amountMin: string
  amountMax: string
}

interface DecisionFiltersProps {
  onFilterChange: (filters: FilterState) => void
  initialFilters?: Partial<FilterState>
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: currentYear - 2018 }, (_, i) =>
  String(currentYear - i)
)

export function DecisionFilters({
  onFilterChange,
  initialFilters,
}: DecisionFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    year: initialFilters?.year ?? "",
    decisionType: initialFilters?.decisionType ?? "",
    search: initialFilters?.search ?? "",
    amountMin: initialFilters?.amountMin ?? "",
    amountMax: initialFilters?.amountMax ?? "",
  })

  const updateFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value }
        onFilterChange(next)
        return next
      })
    },
    [onFilterChange]
  )

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Year */}
      <div className="w-full sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Έτος
        </label>
        <Select
          value={filters.year}
          onChange={(e) => updateFilter("year", e.target.value)}
          className="w-full sm:w-[120px]"
        >
          <SelectOption value="">Όλα</SelectOption>
          {years.map((y) => (
            <SelectOption key={y} value={y}>
              {y}
            </SelectOption>
          ))}
        </Select>
      </div>

      {/* Decision Type */}
      <div className="w-full sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Τύπος Απόφασης
        </label>
        <Select
          value={filters.decisionType}
          onChange={(e) => updateFilter("decisionType", e.target.value)}
          className="w-full sm:w-[240px]"
        >
          <SelectOption value="">Όλοι</SelectOption>
          {Object.entries(DECISION_TYPE_LABELS).map(([code, label]) => (
            <SelectOption key={code} value={code}>
              {label}
            </SelectOption>
          ))}
        </Select>
      </div>

      {/* Search */}
      <div className="w-full sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Αναζήτηση
        </label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="ΑΔΑ, θέμα, δικαιούχος..."
            className="w-full pl-9 sm:w-[220px]"
          />
        </div>
      </div>

      {/* Amount Range */}
      <div className="w-full sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Ποσό (EUR)
        </label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={filters.amountMin}
            onChange={(e) => updateFilter("amountMin", e.target.value)}
            placeholder="Από"
            className="w-[100px]"
            min={0}
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            value={filters.amountMax}
            onChange={(e) => updateFilter("amountMax", e.target.value)}
            placeholder="Έως"
            className="w-[100px]"
            min={0}
          />
        </div>
      </div>
    </div>
  )
}
