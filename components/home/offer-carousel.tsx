"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import useEmblaCarousel from "embla-carousel-react"
import { Button } from "@/components/ui/button"
import { ChevronRight, Copy, Check } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface Banner {
  _id: string;
  title: string;
  description: string;
  code: string;
  cta: string;
  link: string;
  gradient: string;
  textColor: string;
  image?: string;
}

export function OfferCarousel() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: true }),
  ])
  
  useEffect(() => {
      const fetchBanners = async () => {
          try {
              const res = await fetch('/api/banners');
              const data = await res.json();
              if (data.success && data.banners.length > 0) {
                  setBanners(data.banners);
              }
          } catch (error) {
              console.error("Failed to load banners", error);
          } finally {
              setLoading(false);
          }
      }
      fetchBanners();
  }, [])

  const copyToClipboard = (code: string) => {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`Coupon code ${code} copied!`);
      setTimeout(() => setCopiedCode(null), 2000);
  }

  if (loading) return <div className="h-48 rounded-3xl bg-gray-100 animate-pulse mb-4" />
  
  if (banners.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-3xl shadow-md mb-2" ref={emblaRef}>
      <div className="flex">
        {banners.map((offer, index) => (
          <div key={index} className="flex-[0_0_100%] min-w-0">
            <Link href={offer.link || '/'} className="block">
              <div className={`relative overflow-hidden p-6 md:px-8 md:py-6 ${offer.textColor}`}>
              
              {/* Background Layers */}
              {!offer.image && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${offer.gradient || 'from-gray-800 to-gray-900'} z-0`} />
              )}
              {offer.image && (
                 <img 
                    src={offer.image.startsWith('http') ? offer.image : `/api/uploads/${offer.image}`}
                    alt={offer.title || "Offer Background"}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                 />
              )}
              {/* Only dim if we have an image AND text to display */}
              {offer.image && (offer.title || offer.description) && (
                  <div className="absolute inset-0 bg-black/40 z-0" />
              )}

              {/* Content Front Layer */}
              <div className="relative z-10 max-w-xl">
                 <div className="flex flex-col items-start gap-3">
                    <div>
                        {offer.title && <h3 className="text-2xl md:text-3xl font-bold mb-1">{offer.title}</h3>}
                        {offer.description && <p className="text-base opacity-90 mb-1">{offer.description}</p>}
                        
                        {offer.code && (
                            <div 
                                className="flex items-center gap-2 mt-2 font-mono text-sm bg-black/20 px-3 py-1 rounded cursor-pointer hover:bg-black/30 transition-colors border border-white/20 inline-flex"
                                onClick={(e) => { e.preventDefault(); copyToClipboard(offer.code); }}
                                title="Click to copy"
                            >
                                <span>Code: </span>
                                <span className="font-bold tracking-wide">{offer.code}</span>
                                {copiedCode === offer.code ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3 opacity-70" />}
                            </div>
                        )}
                    </div>
                    {offer.cta && (
                        <span className="inline-flex items-center gap-2 mt-1 bg-white/20 hover:bg-white/30 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors border border-white/30">
                            {offer.cta} <ChevronRight className="h-4 w-4" />
                        </span>
                    )}
                 </div>
              </div>
            </div>
          </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
