import Link from "next/link"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getStores } from "@/lib/stores"
// We'll create a delete action and status switch later if needed

export default async function AdminStoresPage() {
  const stores = await getStores()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Stores</h1>
           <p className="text-muted-foreground">Manage vendor stores</p>
        </div>
        <Link href="/admin/stores/add">
            <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add Store
            </Button>
        </Link>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="p-4 border-b">
             <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search stores..." className="pl-9" />
             </div>
        </div>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Photo</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Vendor</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Distance (km)</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Timings</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Listed on Home</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {stores.length === 0 && (
                <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">No stores found.</td>
                </tr>
              )}
              {stores.map((store) => (
                <tr key={store.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle">
                    <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted">
                        {store.photo ? (
                            <img 
                                src={store.photo.startsWith('http') ? store.photo : `/api/uploads/${store.photo}`} 
                                alt={store.name} 
                                className="h-full w-full object-cover" 
                            />
                        ) : (
                            <div className="h-full w-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">No Img</div>
                        )}
                    </div>
                  </td>
                  <td className="p-4 align-middle font-medium">{store.name}</td>
                  <td className="p-4 align-middle">
                    {store.vendorId?.name || 'Unknown'} <br/>
                    <span className="text-xs text-muted-foreground">{store.vendorId?.email}</span>
                  </td>
                  <td className="p-4 align-middle">{store.km} km</td>
                  <td className="p-4 align-middle text-xs">
                    {store.opensAt} - {store.closesAt}
                  </td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${store.isListedOnHome ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {store.isListedOnHome ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex justify-end gap-2">
                        <Link href={`/admin/stores/${store.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
