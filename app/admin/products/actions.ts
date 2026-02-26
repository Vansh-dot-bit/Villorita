'use server'

import { addProduct, deleteProduct, updateProduct, getProductById } from "@/lib/products"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createProductAction(formData: FormData) {
  const name = formData.get("name") as string
  const price = parseFloat(formData.get("price") as string)
  const category = formData.get("category") as string
  const image = formData.get("image") as string || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80" // Default image if none
  const type = formData.get("type") as string
  const description = formData.get("description") as string
  const preparingTime = parseInt(formData.get("preparingTime") as string) || 60
  const ratingAvg = parseFloat(formData.get("rating") as string) || 0;
  let weights = [];

  try {
    const weightsJson = formData.get("weights") as string;
    if (weightsJson) weights = JSON.parse(weightsJson);
  } catch (e) {
    console.error("Failed to parse weights", e);
  }

  // Auto-set main price from first weight if available
  let derivedPrice = price;
  if (weights.length > 0) {
      derivedPrice = weights[0].price;
  }

  if (!name || !category) {
    throw new Error("Missing required fields")
  }

  await addProduct({
    name,
    price: derivedPrice,
    category,
    image,
    type, 
    description,
    preparingTime,
    weights,
    rating: {
      average: ratingAvg,
      count: 0
    },
    isActive: true,
  } as any)

  revalidatePath("/admin/products")
  revalidatePath("/")
  revalidatePath(`/category/${category.toLowerCase()}`)
  redirect("/admin/products")
}

export async function updateProductAction(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const price = parseFloat(formData.get("price") as string)
  const category = formData.get("category") as string
  const image = formData.get("image") as string
  const type = formData.get("type") as string
  const description = formData.get("description") as string
  const preparingTime = parseInt(formData.get("preparingTime") as string) || 60
  const ratingAvg = parseFloat(formData.get("rating") as string) || 0;
  const ratingCount = parseInt(formData.get("ratingCount") as string) || 0;
  let weights = [];

  try {
    const weightsJson = formData.get("weights") as string;
    if (weightsJson) weights = JSON.parse(weightsJson);
  } catch (e) {
    console.error("Failed to parse weights", e);
  }

  // Auto-set main price from first weight if available
  let derivedPrice = price;
  if (weights.length > 0) {
      derivedPrice = weights[0].price;
  }
  
  await updateProduct(id, {
    name,
    price: derivedPrice,
    category,
    image,
    type,
    description,
    preparingTime,
    weights,
    rating: {
      average: ratingAvg,
      count: ratingCount
    }
  } as any)

  revalidatePath("/admin/products")
  revalidatePath("/")
  revalidatePath(`/category/${category.toLowerCase()}`)
  redirect("/admin/products")
}

export async function deleteProductAction(id: string) {
  await deleteProduct(id)
  revalidatePath("/admin/products")
  revalidatePath("/")
}

export async function toggleProductAvailability(id: string, isAvailable: boolean) {
  console.log(`[ACTION] Toggling product ${id} availability to ${isAvailable}`);
  const result = await updateProduct(id, { isAvailable });
  console.log(`[ACTION] Update result:`, result?.isAvailable);
  revalidatePath("/admin/products")
  revalidatePath("/")
  revalidatePath("/products")
}
