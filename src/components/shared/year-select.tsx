import { Calendar } from "lucide-react"

interface YearSelectProps {
  value: number
  onChange: (year: number) => void
  years?: number[]
}

export function YearSelect({ value, onChange, years }: YearSelectProps) {
  const currentYear = new Date().getFullYear()
  const yearList = years ?? Array.from({ length: currentYear - 2018 }, (_, i) => currentYear - i)

  return (
    <div className="relative inline-flex items-center">
      <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 appearance-none rounded-lg border border-input bg-card pl-9 pr-8 text-sm font-medium shadow-sm transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {yearList.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <ChevronIcon />
    </div>
  )
}

function ChevronIcon() {
  return (
    <svg
      className="pointer-events-none absolute right-2.5 h-4 w-4 text-muted-foreground"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}
