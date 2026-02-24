"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Search, X } from "lucide-react"

interface BeneficiaryResult {
  beneficiary_afm: string
  beneficiary_name: string
  total_amount: number
}

interface DecisionResult {
  ada: string
  subject: string
  total_amount: number
}

export function GlobalSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryResult[]>([])
  const [decisions, setDecisions] = useState<DecisionResult[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const AFM_PATTERN = /^\d{9}$/
  const ADA_PATTERN = /^[A-ZΑ-Ω0-9]{5,}[-/]?[A-ZΑ-Ω0-9]*$/i

  const clearResults = useCallback(() => {
    setBeneficiaries([])
    setDecisions([])
    setOpen(false)
  }, [])

  const close = useCallback(() => {
    setQuery("")
    clearResults()
    setMobileOpen(false)
  }, [clearResults])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      clearResults()
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const [benRes, decRes] = await Promise.all([
          fetch(`/api/beneficiaries?search=${encodeURIComponent(trimmed)}&size=3`),
          fetch(`/api/decisions?search=${encodeURIComponent(trimmed)}&size=3`),
        ])
        const benJson = await benRes.json()
        const decJson = await decRes.json()
        setBeneficiaries(benJson.data ?? [])
        setDecisions(decJson.data ?? [])
        setOpen(true)
      } catch {
        clearResults()
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, clearResults])

  // Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === "Escape") {
        close()
        inputRef.current?.blur()
        mobileInputRef.current?.blur()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [close])

  // Click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Close search on route change
  useEffect(() => {
    close()
  }, [pathname, close])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    if (AFM_PATTERN.test(trimmed)) {
      router.push(`/beneficiaries/${trimmed}`)
    } else if (ADA_PATTERN.test(trimmed) && /\d/.test(trimmed) && /[A-ZΑ-Ωa-zα-ω]/.test(trimmed)) {
      router.push(`/decisions/${encodeURIComponent(trimmed)}`)
    } else {
      router.push(`/beneficiaries?search=${encodeURIComponent(trimmed)}`)
    }
    close()
  }

  function navigateTo(href: string) {
    router.push(href)
    close()
  }

  const hasResults = beneficiaries.length > 0 || decisions.length > 0

  const dropdown = open && hasResults && (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
      {beneficiaries.length > 0 && (
        <div>
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Δικαιούχοι
          </p>
          {beneficiaries.map((b) => (
            <button
              key={b.beneficiary_afm}
              onClick={() => navigateTo(`/beneficiaries/${b.beneficiary_afm}`)}
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50"
            >
              <span className="font-mono text-xs text-gray-400">{b.beneficiary_afm}</span>
              <span className="truncate">{b.beneficiary_name}</span>
            </button>
          ))}
        </div>
      )}
      {decisions.length > 0 && (
        <div>
          <p className="border-t border-gray-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Αποφάσεις
          </p>
          {decisions.map((d) => (
            <button
              key={d.ada}
              onClick={() => navigateTo(`/decisions/${encodeURIComponent(d.ada)}`)}
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50"
            >
              <span className="font-mono text-xs text-gray-400">{d.ada}</span>
              <span className="truncate">{d.subject}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div ref={containerRef} className="relative flex flex-1 items-center md:justify-center">
      {/* Desktop search */}
      <form onSubmit={handleSubmit} className="relative hidden w-full max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-200" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Αναζήτηση ΑΦΜ, ΑΔΑ, δικαιούχου…"
          className="h-9 w-full rounded-lg border-0 bg-white/15 pl-9 pr-16 text-sm text-white placeholder:text-blue-200 focus:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-blue-300/30 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-200">
          Ctrl K
        </kbd>
        {dropdown}
      </form>

      {/* Mobile search toggle */}
      <button
        type="button"
        className="ml-auto inline-flex items-center justify-center rounded-md p-2 text-blue-100 hover:bg-white/10 hover:text-white md:hidden"
        onClick={() => {
          setMobileOpen((v) => !v)
          setTimeout(() => mobileInputRef.current?.focus(), 100)
        }}
        aria-label="Toggle search"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
      </button>

      {/* Mobile search bar */}
      {mobileOpen && (
        <div className="fixed left-0 right-0 top-16 z-50 border-b border-blue-600 bg-blue-600 px-4 py-2 md:hidden">
          <form onSubmit={handleSubmit} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-200" />
            <input
              ref={mobileInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Αναζήτηση ΑΦΜ, ΑΔΑ, δικαιούχου…"
              className="h-10 w-full rounded-lg border-0 bg-white/15 pl-9 pr-4 text-sm text-white placeholder:text-blue-200 focus:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-transparent" />
              </div>
            )}
          </form>
          {open && hasResults && (
            <div className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-white shadow-xl">
              {beneficiaries.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Δικαιούχοι
                  </p>
                  {beneficiaries.map((b) => (
                    <button
                      key={b.beneficiary_afm}
                      onClick={() => navigateTo(`/beneficiaries/${b.beneficiary_afm}`)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50"
                    >
                      <span className="font-mono text-xs text-gray-400">{b.beneficiary_afm}</span>
                      <span className="truncate">{b.beneficiary_name}</span>
                    </button>
                  ))}
                </div>
              )}
              {decisions.length > 0 && (
                <div>
                  <p className="border-t border-gray-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Αποφάσεις
                  </p>
                  {decisions.map((d) => (
                    <button
                      key={d.ada}
                      onClick={() => navigateTo(`/decisions/${encodeURIComponent(d.ada)}`)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50"
                    >
                      <span className="font-mono text-xs text-gray-400">{d.ada}</span>
                      <span className="truncate">{d.subject}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
