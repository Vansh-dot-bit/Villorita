"use client"

import { useState } from "react"
import { ProductCard } from "@/components/product/product-card"
import { Tag } from "lucide-react"

interface StoreProductsProps {
  categories: any[];
  products: any[];
  storeId: string;
}

export function StoreProducts({ categories, products, storeId }: StoreProductsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter products based on selected category
  const filteredProducts = selectedCategory
    ? products.filter(p => {
        // Handle cases where product category might or might not have storeId prefix
        const cleanProductCat = p.category ? p.category.replace(`${storeId} - `, '') : '';
        return cleanProductCat === selectedCategory;
      })
    : products;

  return (
    <>
      {/* Store Categories Overview */}
      {categories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {/* "All" category option */}
              <div 
                onClick={() => setSelectedCategory(null)}
                className="flex flex-col items-center gap-2 min-w-[100px] snap-center group cursor-pointer"
              >
                  <div className={`h-20 w-20 rounded-full overflow-hidden border-2 shadow-sm flex items-center justify-center p-1 transition-colors ${selectedCategory === null ? 'border-purple-500 bg-purple-50' : 'border-white bg-white group-hover:border-purple-200'}`}>
                      <span className={`text-sm font-bold ${selectedCategory === null ? 'text-purple-700' : 'text-gray-500'}`}>All</span>
                  </div>
                  <span className={`text-sm font-medium text-center transition-colors ${selectedCategory === null ? 'text-purple-700 font-bold' : 'text-gray-700 group-hover:text-purple-700'}`}>
                      View All
                  </span>
              </div>

              {categories.map((cat: any) => {
                  const cleanName = cat.name.replace(`${storeId} - `, '');
                  const isSelected = selectedCategory === cleanName;
                  
                  return (
                  <div 
                    key={cat._id.toString()} 
                    onClick={() => setSelectedCategory(cleanName)}
                    className="flex flex-col items-center gap-2 min-w-[100px] snap-center group cursor-pointer"
                  >
                      <div className={`h-20 w-20 rounded-full overflow-hidden border-2 shadow-sm flex items-center justify-center p-1 transition-colors ${isSelected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-white bg-white group-hover:border-purple-200'}`}>
                          {cat.image ? (
                              <img 
                                  src={cat.image?.startsWith('http') ? cat.image : `/api/uploads/${cat.image}`}
                                  alt={cleanName}
                                  className="h-full w-full object-cover rounded-full"
                              />
                          ) : (
                              <Tag className={`h-8 w-8 ${isSelected ? 'text-purple-500' : 'text-purple-300'}`} />
                          )}
                      </div>
                      <span className={`text-sm font-medium text-center transition-colors ${isSelected ? 'text-purple-700 font-bold' : 'text-gray-700 group-hover:text-purple-700'}`}>
                        {cleanName}
                      </span>
                  </div>
              )})}
          </div>
        </section>
      )}

      {/* Single Products Grid */}
      <section className="space-y-6">
          <div className="flex items-center justify-between pb-2">
              <h2 className="text-2xl font-bold tracking-tight">
                  {selectedCategory ? `${selectedCategory} Products` : 'All Products'}
              </h2>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">{filteredProducts.length} items</span>
          </div>
          
          {filteredProducts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product: any) => {
                      // Normalize the ID property for the ProductCard
                      const productObj = {
                          ...product,
                          id: product._id ? product._id.toString() : product.id,
                          _id: product._id ? product._id.toString() : product.id
                      };
                      return <ProductCard key={productObj.id} product={productObj as any} />
                  })}
              </div>
          ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed">
                  <p className="text-xl text-gray-500">No products found in this category.</p>
              </div>
          )}
      </section>
    </>
  )
}
