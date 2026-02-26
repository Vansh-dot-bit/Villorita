'use client';

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Mail, Phone, Calendar, Wallet, Truck } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { useAuth } from "@/context/auth-context"

interface Address {
  addressLine1: string;
  city: string;
  pincode: string;
  [key: string]: any;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
  addresses?: Address[];
  walletBalance?: number;
  [key: string]: any;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  const fetchCustomers = useCallback(async () => {
      // Wait for token to be available if it's not yet
      if (!token) return;

      try {
          const res = await fetch('/api/users', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          const data = await res.json()
          
          if (data.success) {
              // Show all registered users
              setCustomers(data.users)
          } else {
             toast.error(data.error || "Failed to fetch customers")
          }
      } catch (error) {
          toast.error("Failed to fetch customers")
      } finally {
          setLoading(false)
      }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchCustomers()
    }
  }, [token, fetchCustomers])

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Customers
            </h1>
            <p className="text-muted-foreground">View all registered customers.</p>
          </div>
          <Button variant="outline" onClick={fetchCustomers}>Refresh</Button>
      </div>

      {loading ? (
          <div className="text-center py-12">Loading customers...</div>
      ) : customers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-bold text-lg">No Customers Yet</h3>
              <p className="text-muted-foreground">Customers will appear here once they register.</p>
          </div>
      ) : (
          <div className="grid gap-4">
              {customers.map((customer) => (
                  <Card key={customer._id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                              <div className="space-y-3 flex-1">
                                  <div>
                                      <h3 className="font-bold text-lg">{customer.name}</h3>
                                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                                          {customer.email && (
                                              <div className="flex items-center gap-1">
                                                  <Mail className="h-4 w-4" />
                                                  <span>{customer.email}</span>
                                              </div>
                                          )}
                                          {customer.phone && (
                                              <div className="flex items-center gap-1">
                                                  <Phone className="h-4 w-4" />
                                                  <span>{customer.phone}</span>
                                              </div>
                                          )}
                                          {/* Wallet Balance */}
                                          <div className="flex items-center gap-1">
                                              <Wallet className="h-4 w-4 text-purple-600" />
                                              <span className="font-semibold text-purple-600">
                                                  ₹{customer.walletBalance?.toLocaleString() || 0}
                                              </span>
                                          </div>
                                      </div>
                                  </div>
                                  
                                  {customer.addresses && customer.addresses.length > 0 && (
                                      <div className="pt-2 border-t">
                                          <p className="text-xs font-semibold text-muted-foreground mb-1">Saved Addresses:</p>
                                          {customer.addresses.map((addr, idx) => (
                                              <div key={idx} className="text-sm text-muted-foreground">
                                                  {addr.addressLine1}, {addr.city} - {addr.pincode}
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>

                              <div className="text-right space-y-2">
                                  <div className="flex flex-col gap-2">
                                    <Badge variant="outline" className={`${
                                        customer.role === 'admin' ? 'bg-red-50 text-red-600' :
                                        customer.role === 'vendor' ? 'bg-purple-50 text-purple-600' :
                                        customer.role === 'delivery_agent' ? 'bg-teal-50 text-teal-600' :
                                        'bg-blue-50 text-blue-600'
                                    }`}>
                                        {customer.role === 'delivery_agent' ? 'Delivery Agent' : customer.role.charAt(0).toUpperCase() + customer.role.slice(1)}
                                    </Badge>
                                    {customer.role !== 'admin' && (
                                      <>
                                        {/* Make Vendor / Remove Vendor */}
                                        <Button 
                                          size="sm"
                                          variant={customer.role === 'vendor' ? 'outline' : 'default'}
                                          className={customer.role === 'vendor' ? 'text-xs' : 'text-xs bg-purple-600 hover:bg-purple-700'}
                                          onClick={async () => {
                                            try {
                                              const newRole = customer.role === 'vendor' ? 'user' : 'vendor';
                                              const res = await fetch(`/api/users/${customer._id}`, {
                                                method: 'PATCH',
                                                headers: {
                                                  'Content-Type': 'application/json',
                                                  'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify({ role: newRole })
                                              });
                                              const data = await res.json();
                                              if (data.success) {
                                                toast.success(`User ${customer.role === 'vendor' ? 'demoted from' : 'promoted to'} vendor`);
                                                fetchCustomers();
                                              } else {
                                                toast.error(data.error || 'Failed to update role');
                                              }
                                            } catch {
                                              toast.error('Failed to update role');
                                            }
                                          }}
                                        >
                                          {customer.role === 'vendor' ? 'Remove Vendor' : 'Make Vendor'}
                                        </Button>
                                        {/* Make Delivery Agent / Remove Agent */}
                                        <Button 
                                          size="sm"
                                          variant="outline"
                                          className={`text-xs flex items-center gap-1 ${
                                            customer.role === 'delivery_agent' 
                                              ? 'border-teal-300 text-teal-600 hover:bg-teal-50' 
                                              : 'border-teal-300 text-teal-600 hover:bg-teal-50'
                                          }`}
                                          onClick={async () => {
                                            try {
                                              const newRole = customer.role === 'delivery_agent' ? 'user' : 'delivery_agent';
                                              const res = await fetch(`/api/users/${customer._id}`, {
                                                method: 'PATCH',
                                                headers: {
                                                  'Content-Type': 'application/json',
                                                  'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify({ role: newRole })
                                              });
                                              const data = await res.json();
                                              if (data.success) {
                                                toast.success(
                                                  customer.role === 'delivery_agent'
                                                    ? 'Delivery agent role removed'
                                                    : 'User is now a Delivery Agent'
                                                );
                                                fetchCustomers();
                                              } else {
                                                toast.error(data.error || 'Failed to update role');
                                              }
                                            } catch {
                                              toast.error('Failed to update role');
                                            }
                                          }}
                                        >
                                          <Truck className="h-3 w-3" />
                                          {customer.role === 'delivery_agent' ? 'Remove Agent' : 'Make Agent'}
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                  {customer.createdAt && (
                                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          <span>Joined {format(new Date(customer.createdAt), "PPP")}</span>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </CardContent>
                  </Card>
              ))}
          </div>
      )}
    </div>
  )
}
