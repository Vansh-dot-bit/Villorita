'use client'

import { Navigation } from "lucide-react"
import { useGps } from "@/context/gps-context"
import { getDistanceKm } from "@/lib/haversine"
import { useMemo } from "react"

export function StoreDistanceBadge({ lat, lng }: { lat?: number, lng?: number }) {
  const { userLat, userLng } = useGps()

  const computedKm = useMemo(() => {
    if (userLat != null && userLng != null && lat != null && lng != null) {
      return getDistanceKm(userLat, userLng, lat, lng)
    }
    return null
  }, [userLat, userLng, lat, lng])

  if (computedKm === null) return null

  return (
    <>
      <span className="text-gray-400">|</span>
      <div className="flex items-center gap-1.5 text-black">
        <Navigation className="h-4 w-4 shrink-0" />
        <span>{computedKm} km</span>
      </div>
    </>
  )
}
