import dbConnect from "@/lib/mongodb"
import Store from "@/models/Store"
import Category from "@/models/Category"
import Product from "@/models/Product"
import { notFound } from "next/navigation"
import { Header } from "@/components/layout/header"
import { StoreProducts } from "@/components/store/store-products"
import { MapPin, Clock, Navigation } from "lucide-react"

export const revalidate = 60; // Revalidate every 60s

export default async function StorePage({ params }: { params: Promise<{ storeId: string }> }) {
  await dbConnect();
  
  const resolvedParams = await params;
  const storeId = resolvedParams.storeId;

  let store, categories, products;
  try {
      store = await Store.findById(storeId).lean();
      if (!store) return notFound();

      categories = await Category.find({ storeId: storeId }).sort({ createdAt: -1 }).lean();
      products = await Product.find({ storeId: storeId, isActive: true, isAvailable: true }).sort({ createdAt: -1 }).lean();
  } catch (error) {
      return notFound();
  }

  // Serialize data for Client Component
  // Use JSON stringify/parse to deep clone and convert all ObjectIds and Dates to primitive string values
  const serializedCategories = JSON.parse(JSON.stringify(categories));
  const serializedProducts = JSON.parse(JSON.stringify(products));

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      
      {/* Store Banner & Info */}
      <div className="container mx-auto px-4 mt-6 md:mt-8">
          <div className="bg-gray-200/80 backdrop-blur-sm rounded-[2rem] p-4 flex flex-col md:flex-row gap-6 items-center md:items-stretch shadow-sm border border-gray-100">
              <div 
                  className="w-full md:w-64 h-56 md:h-auto shrink-0 bg-black rounded-3xl overflow-hidden relative shadow-md"
                  style={{ viewTransitionName: `store-image-${store._id}` }}
              >
                  <img 
                      src={store.photo?.startsWith('http') ? store.photo : (store.photo ? `/api/uploads/${store.photo}` : 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80')}
                      alt={store.name}
                      className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
              </div>
              
              <div className="flex-1 py-4 md:py-6 flex flex-col justify-center text-center md:text-left">
                  <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">{store.name}</h1>
                  <p className="text-gray-700 max-w-2xl text-sm md:text-base mb-6 font-medium">
                      {store.description || "Premium cakes baked fresh daily."}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 md:gap-3 items-center justify-center md:justify-start text-xs md:text-sm text-gray-600 mt-auto font-medium">
                      <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="max-w-[150px] md:max-w-[200px] truncate">{store.address}</span>
                      </div>
                      <span className="text-gray-400">|</span>
                      <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>{store.opensAt} - {store.closesAt}</span>
                      </div>
                      {store.km && (
                          <>
                              <span className="text-gray-400">|</span>
                              <div className="flex items-center gap-1.5 text-black">
                                  <Navigation className="h-4 w-4 shrink-0" />
                                  <span>{store.km} km</span>
                              </div>
                          </>
                      )}
                  </div>
              </div>
          </div>
      </div>

      <main className="container mx-auto px-4 py-8 space-y-12">
        <StoreProducts 
          categories={serializedCategories} 
          products={serializedProducts} 
          storeId={store._id.toString()} 
        />
      </main>
    </div>
  )
}
