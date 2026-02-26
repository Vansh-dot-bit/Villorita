
import Link from "next/link"
import { LayoutDashboard, ShoppingBag, Users, Settings, LogOut, Package, Tag, MapPin, CheckCircle, Layers, Megaphone, FileText, ClipboardList, Store as StoreIcon } from "lucide-react"

import Image from "next/image"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-secondary/30">
      {/* Admin Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white flex flex-col">
        <div className="px-6 py-6">
            <div className="flex items-center gap-2">
                <div className="relative h-14 w-36">
                    <Image 
                        src="/logo2.png" 
                        alt="Purple Bite" 
                        fill 
                        className="object-contain"
                    />
                </div>
                <span className="text-xl font-bold tracking-tight text-primary">Admin Panel</span>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
            <nav className="flex flex-col gap-2">
                {[
                    { name: "Dashboard", icon: LayoutDashboard, href: "/admin", active: true },
                    { name: "Verify Orders", icon: CheckCircle, href: "/admin/verify-orders" },
                    { name: "Orders", icon: ShoppingBag, href: "/admin/orders" },
                    { name: "Products", icon: Package, href: "/admin/products" },
                    { name: "Customers", icon: Users, href: "/admin/customers" },
                    { name: "Partners", icon: Users, href: "/admin/partner" },
                    { name: "Categories", icon: Tag, href: "/admin/categories" },
                    { name: "Sections", icon: Layers, href: "/admin/sections" },
                    { name: "Banners", icon: Megaphone, href: "/admin/banners" },
                    { name: "Coupons", icon: Tag, href: "/admin/coupons" },
                    { name: "Add-ons", icon: Package, href: "/admin/addons" },
                    { name: "Stores", icon: StoreIcon, href: "/admin/stores" },
                    { name: "Applications", icon: ClipboardList, href: "/admin/applications" },
                    { name: "Content", icon: FileText, href: "/admin/content" },
                    { name: "Delivery Fees", icon: MapPin, href: "/admin/delivery-fees" },
                    { name: "Settings", icon: Settings, href: "/admin/settings" },
                ].map((item) => (
                    <Link 
                        key={item.name} 
                        href={item.href}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${item.active ? 'bg-primary text-primary-foreground shadow-lg shadow-purple-200' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                    </Link>
                ))}
            </nav>
        </div>

        <div className="p-4 border-t bg-gray-50/50">
             <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white shadow-lg">
                <p className="text-xs font-medium opacity-80">Logged in as</p>
                <p className="font-bold">Admin</p>
             </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
