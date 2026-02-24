"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { formatEUR } from "@/lib/formatters"

interface ExpenseMapProps {
  totalSpending?: number
}

// Karditsa coordinates
const KARDITSA_CENTER: [number, number] = [39.3656, 21.9217]
const DEFAULT_ZOOM = 12

// Loading placeholder while Leaflet loads
function MapSkeleton() {
  return (
    <Skeleton className="h-[500px] w-full rounded-xl" />
  )
}

// The actual map component (loaded dynamically to avoid SSR issues)
const LeafletMap = dynamic(
  () => import("./leaflet-map-inner").then((mod) => mod.LeafletMapInner),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
)

export function ExpenseMap({ totalSpending }: ExpenseMapProps) {
  const popupContent = useMemo(() => {
    if (totalSpending != null) {
      return `<div><strong>Δήμος Καρδίτσας</strong><br/>Συνολική Δαπάνη: ${formatEUR(totalSpending)}</div>`
    }
    return `<div><strong>Δήμος Καρδίτσας</strong></div>`
  }, [totalSpending])

  return (
    <div className="h-[500px] w-full overflow-hidden rounded-xl border">
      <LeafletMap
        center={KARDITSA_CENTER}
        zoom={DEFAULT_ZOOM}
        popupContent={popupContent}
      />
    </div>
  )
}
