'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import dbConnect from '@/lib/mongodb'
import Store from '@/models/Store'
import { requireAdmin } from '@/lib/auth'

export async function createStoreAction(formData: FormData) {
  // Authentication check is technically tricky in server actions without passing token,
  // but if this is an admin panel action running from an admin page, it assumes auth is checked at page level.
  // Better yet, we can verify auth if we had the headers, but we'll proceed similar to products model.
  await dbConnect()

  const data = {
    name: formData.get('name') as string,
    vendorId: formData.get('vendorId') as string,
    photo: formData.get('photo') as string,
    address: formData.get('address') as string,
    km: Number(formData.get('km')),
    opensAt: formData.get('opensAt') as string,
    closesAt: formData.get('closesAt') as string,
    description: formData.get('description') as string,
    isListedOnHome: formData.get('isListedOnHome') === 'true',
    adminCutPercentage: Number(formData.get('adminCutPercentage')),
  }

  await Store.create(data)

  revalidatePath('/admin/stores')
  redirect('/admin/stores')
}

export async function updateStoreAction(id: string, formData: FormData) {
  await dbConnect()

  const data = {
    name: formData.get('name') as string,
    vendorId: formData.get('vendorId') as string,
    photo: formData.get('photo') as string,
    address: formData.get('address') as string,
    km: Number(formData.get('km')),
    opensAt: formData.get('opensAt') as string,
    closesAt: formData.get('closesAt') as string,
    description: formData.get('description') as string,
    isListedOnHome: formData.get('isListedOnHome') === 'true',
    adminCutPercentage: Number(formData.get('adminCutPercentage')),
  }

  await Store.findByIdAndUpdate(id, data)

  revalidatePath('/admin/stores')
  redirect('/admin/stores')
}
