'use client';

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, LogOut, Store, DollarSign, Tag } from "lucide-react";

import Image from "next/image"

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'vendor' && user.role !== 'admin') {
        router.push('/');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !isAuthorized) {
    return <div className="flex items-center justify-center min-h-screen">Loading Vendor Panel...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm hidden md:flex flex-col">
        <div className="p-6 border-b">
          <Link href="/vendor" className="flex items-center gap-2 font-bold text-xl text-purple-700">
            <div className="relative h-14 w-36">
                <Image 
                    src="/logo2.png" 
                    alt="Purple Bite" 
                    fill 
                    className="object-contain"
                />
            </div>
            <span>Vendor Panel</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/vendor/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/vendor/orders">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Package className="h-4 w-4" />
              Orders / Deliveries
            </Button>
          </Link>
          <Link href="/vendor/products">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Package className="h-4 w-4" />
              Products / Combos
            </Button>
          </Link>
          <Link href="/vendor/categories">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Tag className="h-4 w-4" />
              Categories
            </Button>
          </Link>
          <Link href="/vendor/financial">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <DollarSign className="h-4 w-4" />
              Financial
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t">
          <div className="mb-4 px-2">
            <p className="font-medium text-sm">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <Button variant="outline" className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
            {children}
        </div>
      </main>
    </div>
  );
}
