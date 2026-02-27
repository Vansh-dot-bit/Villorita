'use server'

import { addProduct, deleteProduct, updateProduct } from "@/lib/products"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function vendorCreateProductAction(formData: FormData) {
  const name = formData.get("name") as string
  const price = parseFloat(formData.get("price") as string)
  const category = formData.get("category") as string
  const image = formData.get("image") as string || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80"
  const type = formData.get("type") as string
  const description = formData.get("description") as string
  const costPrice = parseFloat(formData.get("costPrice") as string) || 0
  const storeId = formData.get("storeId") as string
  const isCombo = formData.get("isCombo") === "true"
  
  let weights = [];
  try {
    const weightsJson = formData.get("weights") as string;
    if (weightsJson) weights = JSON.parse(weightsJson);
  } catch (e) {
    console.error("Failed to parse weights", e);
  }

  let derivedPrice = price;
  let derivedCostPrice = costPrice;
  if (weights.length > 0) {
      derivedPrice = weights[0].price;
      derivedCostPrice = weights[0].costPrice;
  }

  if (!name || !category || !storeId) {
    throw new Error("Missing required fields")
  }

  await addProduct({
    name,
    price: derivedPrice,
    category,
    image,
    type, 
    description,
    costPrice: derivedCostPrice,
    weights,
    isActive: true,
    storeId,
    isCombo,
  } as any)

  revalidatePath("/vendor/products")
  revalidatePath("/")
  redirect("/vendor/products")
}

export async function vendorUpdateProductAction(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const price = parseFloat(formData.get("price") as string)
  const category = formData.get("category") as string
  const image = formData.get("image") as string
  const type = formData.get("type") as string
  const description = formData.get("description") as string
  const costPrice = parseFloat(formData.get("costPrice") as string) || 0
  const isCombo = formData.get("isCombo") === "true"
  
  let weights = [];
  try {
    const weightsJson = formData.get("weights") as string;
    if (weightsJson) weights = JSON.parse(weightsJson);
  } catch (e) {
    console.error("Failed to parse weights", e);
  }

  let derivedPrice = price;
  let derivedCostPrice = costPrice;
  if (weights.length > 0) {
      derivedPrice = weights[0].price;
      derivedCostPrice = weights[0].costPrice;
  }
  
  await updateProduct(id, {
    name,
    price: derivedPrice,
    category,
    image,
    type,
    description,
    costPrice: derivedCostPrice,
    weights,
    isCombo,
  } as any)

  revalidatePath("/vendor/products")
  revalidatePath("/")
  redirect("/vendor/products")
}

export async function vendorDeleteProductAction(id: string) {
  await deleteProduct(id)
  revalidatePath("/vendor/products")
  revalidatePath("/")
}
