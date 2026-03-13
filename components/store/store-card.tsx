"use client"

import { Link } from "next-view-transitions"
import { MapPin, Navigation, Star } from "lucide-react"
import { IStore as Store } from "@/models/Store"
import { useGps } from "@/context/gps-context"
import { getDistanceKm } from "@/lib/haversine"
import { useMemo } from "react"

interface StoreCardProps {
  store: Partial<Store> & { id?: string }
}

export function StoreCard({ store }: StoreCardProps) {
  const isUnavailable = store.isActive === false;
  const { userLat, userLng } = useGps();

  const computedKm = useMemo(() => {
    if (userLat != null && userLng != null && store.lat != null && store.lng != null) {
      return getDistanceKm(userLat, userLng, store.lat, store.lng);
    }
    return null;
  }, [userLat, userLng, store.lat, store.lng]);

  return (
    <Link href={`/store/${store._id || store.id}`} className={`group relative block overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200 aspect-[3/4] min-w-[180px] ${isUnavailable ? 'opacity-75' : ''}`}>
      {/* Full Image Background */}
      <img
        src={store.photo && store.photo.startsWith('http') ? store.photo : (store.photo ? `/api/uploads/${store.photo}` : '/cakes/c1.jpg')}
        alt={store.name}
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isUnavailable ? 'grayscale-[40%]' : ''}`}
        style={{ viewTransitionName: `store-image-${store._id || store.id}` }}
      />
      
      {/* Gradient Overlay for Text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Rating Badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-green-500/90 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-1 rounded-full shadow-md z-10">
        {store.rating || 5} <Star className="h-3 w-3 fill-current" />
      </div>

      {/* Closed badge — shown when store is unavailable */}
      {isUnavailable && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse inline-block" />
          Closed
        </div>
      )}

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-4">
        <div className="flex justify-between items-end gap-2">
            <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-white line-clamp-1 mb-1 shadow-sm">
                    {store.name}
                </h3>
                <div className="flex items-center text-xs font-medium text-gray-200 bg-black/20 backdrop-blur-sm px-2 py-1 rounded w-fit">
                    <MapPin className="mr-1 h-3 w-3 shrink-0" />
                    <span className="line-clamp-1">{store.address}</span>
                </div>
            </div>
            {computedKm !== null && (
                <div className="flex items-center text-xs font-bold text-white bg-purple-600/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shrink-0 shadow-sm">
                    <Navigation className="h-3 w-3 mr-1" />
                    {computedKm} km
                </div>
            )}
        </div>
      </div>
    </Link>
  )
}

