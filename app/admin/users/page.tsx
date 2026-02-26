'use client';

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Shield, Store, User as UserIcon } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
      try {
          const res = await fetch('/api/users')
          const data = await res.json()
          
          if (data.success) {
              setUsers(data.users)
          }
      } catch (error) {
          toast.error("Failed to fetch users")
      } finally {
          setLoading(false)
      }
  }

  useEffect(() => {
      fetchUsers()
  }, [])

  const handleRoleChange = async (userId: string, newRole: string) => {
      try {
          const res = await fetch(`/api/users/${userId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: newRole })
          })
          const data = await res.json()
          
          if (data.success) {
              toast.success(`User role updated to ${newRole}`)
              setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u))
          } else {
              toast.error(data.error || "Failed to update role")
          }
      } catch (error) {
          toast.error("Something went wrong")
      }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage users and assign roles.</p>
          </div>
          <Button variant="outline" onClick={fetchUsers}>Refresh</Button>
      </div>

      {loading ? (
          <div className="text-center py-12">Loading users...</div>
      ) : (
          <div className="grid gap-4">
              {users.map((user) => (
                  <Card key={user._id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                                  user.role === 'admin' ? 'bg-red-100 text-red-600' :
                                  user.role === 'vendor' ? 'bg-purple-100 text-purple-600' :
                                  'bg-blue-100 text-blue-600'
                              }`}>
                                  {user.role === 'admin' ? <Shield className="h-6 w-6" /> :
                                   user.role === 'vendor' ? <Store className="h-6 w-6" /> :
                                   <UserIcon className="h-6 w-6" />}
                              </div>
                              <div>
                                  <h3 className="font-bold">{user.name}</h3>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                  <div className="flex gap-2 mt-1">
                                      <Badge variant="outline">{user.role}</Badge>
                                      {user.phone && <span className="text-xs text-muted-foreground self-center">{user.phone}</span>}
                                  </div>
                              </div>
                          </div>

                          <div className="flex items-center gap-4">
                              <Select 
                                defaultValue={user.role} 
                                onValueChange={(val) => handleRoleChange(user._id, val)}
                              >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="vendor">Vendor</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                          </div>
                      </CardContent>
                  </Card>
              ))}
          </div>
      )}
    </div>
  )
}
