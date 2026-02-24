"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix default marker icon paths for Leaflet in bundled environments.
// The default icons fail to load in webpack/Next.js, so we point to the
// CDN-hosted copies that match the installed leaflet version.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

interface LeafletMapInnerProps {
  center: [number, number]
  zoom: number
  popupContent: string
}

export function LeafletMapInner({
  center,
  zoom,
  popupContent,
}: LeafletMapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current).setView(center, zoom)
    mapRef.current = map

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker(center).addTo(map)
    marker.bindPopup(popupContent)

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update popup content when it changes
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        layer.setPopupContent(popupContent)
      }
    })
  }, [popupContent])

  return <div ref={containerRef} className="h-full w-full" />
}
