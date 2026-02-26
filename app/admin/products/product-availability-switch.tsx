'use client'

import { Switch } from "@/components/ui/switch"
import { useState, useTransition } from "react"
import { toggleProductAvailability } from "@/app/admin/products/actions"
import { toast } from "sonner"

interface ProductAvailabilitySwitchProps {
  productId: string
  isAvailable: boolean
}

export function ProductAvailabilitySwitch({ productId, isAvailable }: ProductAvailabilitySwitchProps) {
  const [checked, setChecked] = useState(isAvailable)
  const [isPending, startTransition] = useTransition()

  const handleCheckedChange = (checked: boolean) => {
    setChecked(checked)
    startTransition(async () => {
      try {
        await toggleProductAvailability(productId, checked)
        toast.success(checked ? "Product marked as available" : "Product marked as unavailable")
      } catch (error) {
        setChecked(!checked) // Revert state on error
        toast.error("Failed to update product availability")
      }
    })
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={handleCheckedChange}
      disabled={isPending}
      className={checked ? "bg-green-600" : "bg-gray-200"}
    />
  )
}
