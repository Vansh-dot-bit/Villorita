'use client';

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Package, LogOut, Truck } from "lucide-react";
import Image from "next/image";

export default function DeliveryAgentLayout({
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
      } else if (user.role !== 'delivery_agent' && user.role !== 'admin') {
        router.push('/');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Truck className="h-10 w-10 text-orange-500 animate-bounce mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Loading Delivery Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm hidden md:flex flex-col">
        <div className="p-6 border-b">
          <Link href="/delivery-agent" className="flex items-center gap-2 font-bold text-xl text-orange-600">
            <div className="relative h-14 w-36">
              <Image 
                src="/logo2.png" 
                alt="Purple Bite" 
                fill 
                className="object-contain"
              />
            </div>
            <span className="text-sm font-semibold">Delivery Panel</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/delivery-agent/orders">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Package className="h-4 w-4" />
              My Deliveries
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t">
          <div className="mb-4 px-2">
            <p className="font-medium text-sm">{user?.name}</p>
            <p className="text-xs text-orange-500 font-semibold capitalize">Delivery Agent</p>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50" 
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-orange-600">🚚 Delivery Panel</span>
        <Button variant="ghost" size="sm" onClick={logout} className="text-red-600">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 pt-8 md:pt-8 mt-14 md:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
