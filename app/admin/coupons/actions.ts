'use server'

import dbConnect from "@/lib/mongodb"
import Coupon from "@/models/Coupon"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createCouponAction(formData: FormData) {
  try {
    await dbConnect()

    const code = formData.get("code") as string
    const discountType = formData.get("discountType") as string
    const discountValue = parseFloat(formData.get("discountValue") as string)
    const expiryDate = formData.get("expiryDate") as string
    const minOrderAmount = parseFloat(formData.get("minOrderAmount") as string) || 0
    
    // Parse limits correctly (empty string implies null/unlimited)
    const usageLimitStr = formData.get("usageLimit") as string
    const usageLimit = usageLimitStr ? parseInt(usageLimitStr) : null

    const usageLimitPerUserStr = formData.get("usageLimitPerUser") as string
    const usageLimitPerUser = usageLimitPerUserStr ? parseInt(usageLimitPerUserStr) : null
    
    if (!code || !discountType || !discountValue || !expiryDate) {
        throw new Error("Missing required fields")
    }

    await Coupon.create({
        code,
        discountType,
        discountValue,
        minOrderAmount,
        expiryDate: new Date(expiryDate),
        usageLimit,
        usageLimitPerUser,
        isActive: true
    })

    revalidatePath("/admin/coupons")
    redirect("/admin/coupons")
  } catch (error: any) {
    console.error('Error creating coupon:', error)
    throw error
  }
}

export async function deleteCouponAction(id: string) {
    await dbConnect()
    await Coupon.findByIdAndDelete(id)
    revalidatePath("/admin/coupons")
}
