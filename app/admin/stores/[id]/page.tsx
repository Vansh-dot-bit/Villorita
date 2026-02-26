import { StoreForm } from "@/components/admin/store-form"
import { getVendors } from "@/lib/users"
import { getStoreById } from "@/lib/stores"
import { notFound } from "next/navigation"

export default async function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [vendors, store] = await Promise.all([
    getVendors(),
    getStoreById(id)
  ])

  if (!store) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
         <h1 className="text-3xl font-bold tracking-tight">Edit Store</h1>
         <p className="text-muted-foreground">Update vendor store details</p>
      </div>
      <StoreForm store={store} vendors={vendors} />
    </div>
  )
}
