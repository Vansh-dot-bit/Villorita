'use client';

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"
import { UserCheck } from "lucide-react"

interface VendorAssignmentProps {
  orderId: string;
  currentVendorId?: string;
  currentVendorName?: string;
  onAssigned: () => void;
}

interface Vendor {
  _id: string;
  name: string;
  email: string;
}

export function VendorAssignment({ orderId, currentVendorId, currentVendorName, onAssigned }: VendorAssignmentProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendorId, setSelectedVendorId] = useState<string>(currentVendorId || "")
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const { token } = useAuth()

  useEffect(() => {
    const fetchVendors = async () => {
      if (!token) return;

      try {
        const res = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await res.json()
        
        if (data.success) {
          // Filter only vendors
          const vendorUsers = data.users.filter((u: any) => u.role === 'vendor')
          setVendors(vendorUsers)
        } else {
          toast.error(data.error || "Failed to fetch vendors")
        }
      } catch (error) {
        toast.error("Failed to fetch vendors")
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [token])

  const handleAssignVendor = async () => {
    if (!selectedVendorId || selectedVendorId === currentVendorId) return;

    setAssigning(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'assign_vendor',
          vendorId: selectedVendorId
        })
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success("Vendor assigned successfully")
        onAssigned()
      } else {
        toast.error(data.error || "Failed to assign vendor")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading vendors...</div>
  }

  if (vendors.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No vendors available. Promote users to vendor role in the Customers page.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Label>Assign to Vendor</Label>
      <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
        <SelectTrigger>
          <SelectValue placeholder="Select a vendor">
            {currentVendorName || "Select a vendor"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {vendors.map((vendor) => (
            <SelectItem key={vendor._id} value={vendor._id}>
              {vendor.name} ({vendor.email})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedVendorId && selectedVendorId !== currentVendorId && (
        <Button 
          className="w-full bg-purple-600 hover:bg-purple-700" 
          onClick={handleAssignVendor}
          disabled={assigning}
        >
          <UserCheck className="mr-2 h-4 w-4" />
          {assigning ? "Assigning..." : "Assign Vendor"}
        </Button>
      )}
      
      {currentVendorId && (
        <p className="text-xs text-muted-foreground">
          Currently assigned to: {currentVendorName}
        </p>
      )}
    </div>
  )
}
