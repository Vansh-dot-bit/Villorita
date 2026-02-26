import { Link } from "next-view-transitions"
import { MapPin, Clock, Navigation } from "lucide-react"
import { IStore as Store } from "@/models/Store"

interface StoreCardProps {
  store: Partial<Store> & { id?: string }
}

export function StoreCard({ store }: StoreCardProps) {
  return (
    <Link href={`/store/${store._id || store.id}`} className="group relative block overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200 aspect-[3/4] min-w-[180px]">
      {/* Full Image Background */}
      <img
        src={store.photo && store.photo.startsWith('http') ? store.photo : (store.photo ? `/api/uploads/${store.photo}` : '/cakes/c1.jpg')}
        alt={store.name}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        style={{ viewTransitionName: `store-image-${store._id || store.id}` }}
      />
      
      {/* Gradient Overlay for Text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

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
            {store.km && (
                <div className="flex items-center text-xs font-bold text-white bg-purple-600/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shrink-0 shadow-sm">
                    <Navigation className="h-3 w-3 mr-1" />
                    {store.km} km
                </div>
            )}
        </div>
      </div>
    </Link>
  )
}
