'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createStoreAction, updateStoreAction } from "@/app/admin/stores/actions"
import { useState, useRef } from "react"
import { Upload, X, MapPin, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface StoreFormProps {
  store?: any
  vendors: {id: string, name: string, email: string}[]
}

export function StoreForm({ store, vendors }: StoreFormProps) {
  const isEditing = !!store
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoPath, setPhotoPath] = useState<string>(store?.photo || '')
  const [address, setAddress] = useState<string>(store?.address || '')
  const [lat, setLat] = useState<string>(store?.lat?.toString() || '')
  const [lng, setLng] = useState<string>(store?.lng?.toString() || '')
  const [geocoding, setGeocoding] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/upload/image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.path) {
        setPhotoPath(data.path)
        toast.success('Photo uploaded!')
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch {
      toast.error('Upload error')
    } finally {
      setUploading(false)
    }
  }

  const handleGeocode = async () => {
    if (!address.trim()) {
      toast.error('Please enter an address first')
      return
    }
    setGeocoding(true)
    try {
      const query = encodeURIComponent(address.trim())
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const results = await res.json()
      if (results && results.length > 0) {
        setLat(parseFloat(results[0].lat).toFixed(6))
        setLng(parseFloat(results[0].lon).toFixed(6))
        toast.success('Coordinates fetched! You can fine-tune them below.')
      } else {
        toast.error('Could not find this address. Try being more specific or adjust coordinates manually.')
      }
    } catch {
      toast.error('Geocoding failed. Please enter coordinates manually.')
    } finally {
      setGeocoding(false)
    }
  }

  return (
    <form action={isEditing ? updateStoreAction.bind(null, store.id) : createStoreAction} className="space-y-6 max-w-2xl bg-white p-8 rounded-xl shadow-sm">
      {/* Hidden fields */}
      <input type="hidden" name="photo" value={photoPath} />
      <input type="hidden" name="lat" value={lat} />
      <input type="hidden" name="lng" value={lng} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Store Name</Label>
          <Input id="name" name="name" defaultValue={store?.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vendorId">Assign Vendor</Label>
          <Select name="vendorId" defaultValue={store?.vendorId?.id || store?.vendorId || (vendors.length > 0 ? vendors[0].id : '')}>
            <SelectTrigger>
              <SelectValue placeholder="Select vendor" />
            </SelectTrigger>
            <SelectContent>
                {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>{vendor.name} ({vendor.email})</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Address + Geocoding */}
      <div className="space-y-3 p-4 border rounded-lg bg-blue-50/50">
        <div className="space-y-2">
          <Label htmlFor="address" className="text-base font-semibold text-blue-900">Store Address</Label>
          <div className="flex gap-2">
            <Input
              id="address"
              name="address"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Full address, e.g. 123 Main St, Chandigarh, India"
              required
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleGeocode}
              disabled={geocoding}
              className="whitespace-nowrap border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {geocoding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <MapPin className="h-4 w-4 mr-1" />}
              Get Coordinates
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="lat-input" className="text-sm font-medium">Latitude</Label>
            <Input
              id="lat-input"
              type="number"
              step="0.000001"
              placeholder="e.g. 30.7333"
              value={lat}
              onChange={e => setLat(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lng-input" className="text-sm font-medium">Longitude</Label>
            <Input
              id="lng-input"
              type="number"
              step="0.000001"
              placeholder="e.g. 76.7794"
              value={lng}
              onChange={e => setLng(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-blue-600">
          💡 Click "Get Coordinates" to auto-fill from the address. For Maximum Precision, <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="underline font-bold">Open Google Maps</a>, right-click your exact store building, click the coordinates to copy them, and paste them here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="opensAt">Opens At (Time)</Label>
          <Input id="opensAt" name="opensAt" type="time" defaultValue={store?.opensAt || "09:00"} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="closesAt">Closes At (Time)</Label>
          <Input id="closesAt" name="closesAt" type="time" defaultValue={store?.closesAt || "22:00"} required />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="deliveryTime">Delivery Time (e.g. "30-45 min")</Label>
          <Input id="deliveryTime" name="deliveryTime" placeholder="e.g. 30-45 min" defaultValue={store?.deliveryTime || ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rating">Rating (0-5)</Label>
          <Input id="rating" name="rating" type="number" step="0.1" min="0" max="5" defaultValue={store?.rating || 5} required />
        </div>
      </div>

      <div className="space-y-4 border p-4 rounded-lg bg-indigo-50/50">
        <div className="space-y-1">
          <Label htmlFor="adminCutPercentage" className="text-base font-semibold text-indigo-900">Admin Cut Percentage (%)</Label>
          <p className="text-xs text-indigo-700">The percentage of each sale from this store that the Admin keeps. (e.g., 30 for 30%)</p>
        </div>
        <Input id="adminCutPercentage" name="adminCutPercentage" type="number" step="0.1" min="0" max="100" defaultValue={store?.adminCutPercentage || 0} required className="max-w-xs" />
      </div>

      {/* Store Photo Upload */}
      <div className="space-y-3">
        <Label>Store Photo</Label>

        {photoPath ? (
          <div className="relative w-full h-48 rounded-xl overflow-hidden border bg-gray-50">
            <img
              src={photoPath.startsWith('http') ? photoPath : `/api/uploads/${photoPath}`}
              alt="Store photo"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => setPhotoPath('')}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 h-40 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
          >
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload store photo'}</p>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
          disabled={uploading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={store?.description} />
      </div>

      <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg border">
        <Switch id="isListedOnHome" name="isListedOnHome" defaultChecked={store ? store.isListedOnHome : true} value="true" />
        <Label htmlFor="isListedOnHome">List this store on the Home Page</Label>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="submit" size="lg" disabled={loading || uploading}>
          {isEditing ? "Update Store" : "Create Store"}
        </Button>
      </div>
    </form>
  )
}
