"use client";

import Link from "next/link"
import { Search, MapPin, Package, X, User, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CartIndicator } from "@/components/layout/cart-indicator"
import { useAuth } from "@/context/auth-context"
import { UserMenu } from "@/components/layout/user-menu"
import { AuthModal } from "@/components/auth/auth-modal"
import { useState } from "react"
import { useLocation } from "@/context/location-context"
import { useRouter } from "next/navigation"
import Image from "next/image"

export function Header({ className }: { className?: string }) {
  const { user } = useAuth();
  const { selectedLocation, setSelectedLocation } = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const router = useRouter();

  const openLogin = () => {
    setAuthMode('login');
    setIsAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const openSignup = () => {
    setAuthMode('signup');
    setIsAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleChangeLocation = () => {
    setSelectedLocation(null);
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  return (
    <>
      <header className={`sticky top-0 z-50 w-full border-b backdrop-blur-xl shadow-md ${className || "bg-background/95 supports-[backdrop-filter]:bg-background/60"}`}>
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">

          {/* Left: Logo */}
          <div className="flex items-center gap-2">
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

          {/* Center: Search & Location — desktop only */}
          <div className="hidden flex-1 items-center justify-center gap-4 px-8 md:flex">
            <Button variant="outline" className="h-10 gap-2 rounded-full border-dashed px-4 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={handleChangeLocation}>
              <MapPin className="h-4 w-4" />
              <span>{selectedLocation ? selectedLocation.name : 'Select Location'}</span>
            </Button>
            <form className="relative w-full max-w-sm" onSubmit={handleSearch}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search for cakes, deliveries..."
                className="h-10 w-full rounded-full bg-muted pl-10 pr-4 text-sm focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-4">

            {/* Desktop: Login/Signup or UserMenu */}
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
                  <button onClick={openLogin} className="text-sm font-medium hover:text-primary transition-colors">Login</button>
                  <span className="text-muted-foreground">|</span>
                  <button onClick={openSignup} className="text-sm font-medium hover:text-primary transition-colors">Sign Up</button>
                </>
              )}
            </div>

            <CartIndicator />

            {/* Mobile: Search icon */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Mobile: Login/User avatar button */}
            {user ? (
              <button
                className="md:hidden flex items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-1 text-xs font-semibold"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shrink-0">
                  {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </div>
                <span className="max-w-[60px] truncate">Hello, {user.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                className="md:hidden text-xs font-semibold text-primary border border-primary rounded-full px-3 py-1"
                onClick={openLogin}
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar — drops down when search icon tapped */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 pb-3 pt-1 border-t bg-background/95 backdrop-blur-xl">
            <form className="relative w-full" onSubmit={handleSearch}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                type="search"
                placeholder="Search for cakes, deliveries..."
                className="h-10 w-full rounded-full bg-muted pl-10 pr-10 text-sm focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setMobileSearchOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* Mobile User Menu dropdown — shows when user icon tapped and logged in */}
        {mobileMenuOpen && user && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur-xl px-4 py-3 space-y-2">
            <Link href="/my-orders" onClick={() => setMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-muted transition-colors">
                <Package className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">My Orders</span>
              </div>
            </Link>
            <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-muted transition-colors">
                <User className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">My Profile</span>
              </div>
            </Link>
            <div className="pt-1 border-t">
              <UserMenu />
            </div>
          </div>
        )}
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  )
}
