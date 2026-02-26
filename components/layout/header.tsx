"use client";

import Link from "next/link"
import { Menu, Search, MapPin, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CartIndicator } from "@/components/layout/cart-indicator"
import { useAuth } from "@/context/auth-context"
import { UserMenu } from "@/components/layout/user-menu"
import { AuthModal } from "@/components/auth/auth-modal"
import { useState, useRef } from "react"
import { useLocation } from "@/context/location-context"
import { useRouter } from "next/navigation"

import Image from "next/image"

export function Header({ className }: { className?: string }) {
  const { user } = useAuth();
  const { selectedLocation, setSelectedLocation } = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const openLogin = () => {
    setAuthMode('login');
    setIsAuthModalOpen(true);
  };

  const openSignup = () => {
    setAuthMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleChangeLocation = () => {
    setSelectedLocation(null); 
  };

  return (
    <header className={`sticky top-0 z-50 w-full border-b backdrop-blur-xl shadow-md ${className || "bg-background/95 supports-[backdrop-filter]:bg-background/60"}`}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left: Mobile Menu & Logo */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-16 w-40 md:h-20 md:w-48">
                <Image 
                    src="/logo2.png" 
                    alt="Villorita" 
                    fill 
                    className="object-contain"
                    priority
                />
            </div>
          </Link>
        </div>

        {/* Center: Search & Location */}
        <div className="hidden flex-1 items-center justify-center gap-4 px-8 md:flex">
             <Button variant="outline" className="h-10 gap-2 rounded-full border-dashed px-4 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={handleChangeLocation}>
                <MapPin className="h-4 w-4" />
                <span>{selectedLocation ? selectedLocation.name : 'Select Location'}</span>
             </Button>
             <form
               className="relative w-full max-w-sm"
               onSubmit={(e) => {
                 e.preventDefault()
                 if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
               }}
             >
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input 
                    type="search" 
                    placeholder="Search for cakes, deliveries..." 
                    className="h-10 w-full rounded-full bg-muted pl-10 pr-4 text-sm focus:outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                      }
                    }}
                />
             </form>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2">
                {user ? (
                  <>
                     <Link href="/my-orders">
                        <Button variant="ghost" className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-primary">
                            <Package className="h-5 w-5" />
                            <span className="font-medium">My Orders</span>
                        </Button>
                     </Link>
                     <UserMenu />
                  </>
                ) : (
                  <>
                    <button 
                      onClick={openLogin}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      Login
                    </button>
                    <span className="text-muted-foreground">|</span>
                    <button 
                      onClick={openSignup}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      Sign Up
                    </button>
                  </>
                )}
            </div>
            
            <CartIndicator />
            
             <Button variant="ghost" size="icon" className="md:hidden">
                <Search className="h-5 w-5" />
             </Button>
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authMode}
      />
    </header>
  )
}
