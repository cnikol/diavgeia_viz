export function formatEUR(amount: number): string {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`
  return amount.toFixed(0)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('el-GR').format(n)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('el-GR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

export function formatMonth(date: string | Date): string {
  return new Intl.DateTimeFormat('el-GR', {
    year: 'numeric',
    month: 'short',
  }).format(new Date(date))
}
