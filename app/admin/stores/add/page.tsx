import { StoreForm } from "@/components/admin/store-form"
import { getVendors } from "@/lib/users"

export default async function AddStorePage() {
  const vendors = await getVendors()

  return (
    <div className="space-y-6">
      <div>
         <h1 className="text-3xl font-bold tracking-tight">Add Store</h1>
         <p className="text-muted-foreground">Create a new vendor store</p>
      </div>
      <StoreForm vendors={vendors} />
    </div>
  )
}
