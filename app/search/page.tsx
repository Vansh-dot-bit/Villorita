'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { ProductCard } from '@/components/product/product-card'
import { Search, X, Loader2 } from 'lucide-react'

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''

  const [query, setQuery] = useState(q)
  const [results, setResults] = useState<any[]>([])
  const [fallbackProducts, setFallbackProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    setIsLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`)
      const data = await res.json()
      if (data.success) {
        setResults(data.products)
        // If no exact results, load all products as fallback suggestions
        if (data.products.length === 0) {
          const fallbackRes = await fetch('/api/products')
          const fallbackData = await fallbackRes.json()
          if (fallbackData.success) setFallbackProducts(fallbackData.products.slice(0, 8))
        } else {
          setFallbackProducts([])
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Run search when query param changes (from header)
  useEffect(() => {
    if (q) {
      setQuery(q)
      performSearch(q)
    }
  }, [q, performSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-5xl">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative mb-10 max-w-xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for cakes, flavors, occasions..."
          className="w-full h-14 rounded-2xl border-2 border-primary/20 bg-white pl-12 pr-12 text-base shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setSearched(false) }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Results */}
      {!isLoading && searched && (
        <>
          {results.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-6">{results.length} result{results.length !== 1 ? 's' : ''} for "{q}"</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((product: any) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">No exact match for "{q}"</p>
              {fallbackProducts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {fallbackProducts.map((product: any) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Idle state (no search yet) */}
      {!isLoading && !searched && (
        <div className="text-center py-20">
          <Search className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Find your perfect cake</h2>
          <p className="text-muted-foreground">Search by name, flavour, occasion, or keywords</p>
        </div>
      )}
    </main>
  )
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      <Suspense fallback={
        <div className="flex justify-center items-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <SearchResults />
      </Suspense>
    </div>
  )
}
