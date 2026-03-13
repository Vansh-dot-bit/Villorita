'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, PieChart, Info, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';

interface Fee {
  _id: string;
  name: string;
  type: 'charge' | 'tax';
  description: string;
  value: number;
  applicableOn: string[];
  isActive: boolean;
}

export default function AdminFeesPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);
  const { token } = useAuth();

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'charge' | 'tax'>('charge');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [applicableOn, setApplicableOn] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const fetchFees = async () => {
      try {
          const res = await fetch('/api/admin/fees', {
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });
          const data = await res.json();
          if (data.success) {
              setFees(data.fees);
          }
      } catch (e) {
          toast.error("Failed to load fees");
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchFees();
  }, []);

  const resetForm = () => {
      setName('');
      setType('charge');
      setDescription('');
      setValue('');
      setApplicableOn([]);
      setIsActive(true);
      setEditingFee(null);
  };

  const handleEdit = (fee: Fee) => {
      setEditingFee(fee);
      setName(fee.name);
      setType(fee.type);
      setDescription(fee.description);
      setValue(fee.value.toString());
      setApplicableOn(fee.applicableOn || []);
      setIsActive(fee.isActive);
      setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!name || !description || !value) {
          toast.error("Please fill all required fields");
          return;
      }

      if (type === 'tax' && applicableOn.length === 0) {
          toast.error("Taxes must be applicable to at least one component (e.g. Subtotal)");
          return;
      }

      const payload = {
          name,
          type,
          description,
          value: parseFloat(value),
          applicableOn: type === 'tax' ? applicableOn : [],
          isActive
      };

      try {
          let res;
          if (editingFee) {
              res = await fetch(`/api/admin/fees/${editingFee._id}`, {
                  method: 'PATCH',
                  headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(payload)
              });
          } else {
              res = await fetch(`/api/admin/fees`, {
                  method: 'POST',
                  headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(payload)
              });
          }

          const data = await res.json();
          if (data.success) {
              toast.success(`Fee ${editingFee ? 'updated' : 'created'} successfully`);
              setIsDialogOpen(false);
              fetchFees();
              resetForm();
          } else {
              toast.error(data.error);
          }
      } catch (err) {
          toast.error("An error occurred");
      }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, feeType: string) => {
      try {
          const res = await fetch(`/api/admin/fees/${id}`, {
              method: 'PATCH',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ type: feeType, isActive: !currentStatus }) // send type back to pass backend validation skips
          });
          const data = await res.json();
          if (data.success) {
              toast.success("Status updated");
              fetchFees();
          } else {
              toast.error(data.error);
          }
      } catch (err) {
          toast.error("An error occurred toggling status");
      }
  };

  const handleDelete = async (id: string) => {
      if (!confirm("Are you sure you want to delete this fee entirely?")) return;
      try {
          const res = await fetch(`/api/admin/fees/${id}`, { 
              method: 'DELETE',
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });
          const data = await res.json();
          if (data.success) {
              toast.success("Fee deleted");
              fetchFees();
          } else {
              toast.error(data.error);
          }
      } catch (err) {
          toast.error("An error occurred deleting fee");
      }
  };

  const toggleApplicable = (component: string) => {
      setApplicableOn(prev => 
          prev.includes(component) ? prev.filter(c => c !== component) : [...prev, component]
      );
  };

  return (
      <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                  <h1 className="text-3xl font-bold tracking-tight">Taxes & Charges</h1>
                  <p className="text-muted-foreground">Manage dynamic fees applied at checkout across the platform.</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
              }}>
                  <DialogTrigger asChild>
                      <Button className="gap-2 shrink-0">
                          <Plus className="h-4 w-4" /> Add New Fee
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                      <DialogHeader>
                          <DialogTitle>{editingFee ? 'Edit Fee' : 'Create New Fee'}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                          <div className="space-y-2">
                              <Label>Name</Label>
                              <Input placeholder="e.g. GST or Platform Fee" value={name} onChange={e => setName(e.target.value)} required />
                          </div>
                          
                          <div className="space-y-2">
                              <Label>Description (Visible to user on hover)</Label>
                              <Textarea 
                                  placeholder="e.g. Mandatory 5% Government Services Tax" 
                                  value={description} 
                                  onChange={e => setDescription(e.target.value)} 
                                  required 
                                  className="h-20"
                              />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label>Fee Type</Label>
                                  <Select value={type} onValueChange={(val: 'tax'|'charge') => setType(val)}>
                                      <SelectTrigger>
                                          <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="charge">Flat Charge (₹)</SelectItem>
                                          <SelectItem value="tax">Percentage Tax (%)</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-2">
                                  <Label>{type === 'tax' ? 'Percentage (%)' : 'Amount (₹)'}</Label>
                                  <Input 
                                      type="number" 
                                      step={type === 'tax' ? "0.1" : "1"} 
                                      min="0"
                                      placeholder={type === 'tax' ? "e.g. 5" : "e.g. 20"} 
                                      value={value} 
                                      onChange={e => setValue(e.target.value)} 
                                      required 
                                  />
                              </div>
                          </div>

                          {type === 'tax' && (
                              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                                  <Label className="text-sm font-semibold text-primary">Apply tax to which components?</Label>
                                  <p className="text-xs text-muted-foreground mb-2">Select the price components this percentage will be calculated from.</p>
                                  <div className="grid gap-3">
                                      <div className="flex items-center space-x-2">
                                          <Checkbox id="chk-subtotal" checked={applicableOn.includes('subtotal')} onCheckedChange={() => toggleApplicable('subtotal')} />
                                          <label htmlFor="chk-subtotal" className="text-sm font-medium leading-none cursor-pointer">Cart Subtotal (Base price of items)</label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                          <Checkbox id="chk-delivery" checked={applicableOn.includes('delivery')} onCheckedChange={() => toggleApplicable('delivery')} />
                                          <label htmlFor="chk-delivery" className="text-sm font-medium leading-none cursor-pointer">Delivery Charges</label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                          <Checkbox id="chk-addons" checked={applicableOn.includes('addons')} onCheckedChange={() => toggleApplicable('addons')} />
                                          <label htmlFor="chk-addons" className="text-sm font-medium leading-none cursor-pointer">Add-ons Total</label>
                                      </div>
                                  </div>
                              </div>
                          )}

                          <div className="flex items-center space-x-2 pt-2">
                              <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
                              <Label htmlFor="is-active">Active immediately</Label>
                          </div>

                          <DialogFooter className="pt-4">
                              <Button type="submit" className="w-full">{editingFee ? 'Save Changes' : 'Create Fee'}</Button>
                          </DialogFooter>
                      </form>
                  </DialogContent>
              </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                  <p className="text-muted-foreground">Loading fees...</p>
              ) : fees.length === 0 ? (
                  <div className="col-span-full border-2 border-dashed rounded-xl p-12 text-center bg-gray-50/50">
                      <PieChart className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-semibold text-gray-900 mb-1">No Custom Fees Found</h3>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto">Create flat platform charges or percentage-based tax logic that applies dynamically to orders.</p>
                  </div>
              ) : (
                  fees.map(fee => (
                      <Card key={fee._id} className={`border-2 transition-all ${fee.isActive ? 'border-primary/20 bg-primary/5 shadow-md shadow-primary/5' : 'border-gray-200 bg-gray-50 opacity-80'}`}>
                          <CardHeader className="pb-3 flex flex-row items-start justify-between">
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <CardTitle className="text-lg">{fee.name}</CardTitle>
                                      <Badge variant={fee.type === 'tax' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                                          {fee.type === 'tax' ? 'TAX %' : 'FLAT ₹'}
                                      </Badge>
                                  </div>
                                  <CardDescription className="flex items-start gap-1 text-xs max-w-[200px]">
                                      <Info className="h-3 w-3 shrink-0 mt-0.5" />
                                      {fee.description}
                                  </CardDescription>
                              </div>
                              <div className="text-right">
                                  <p className="text-2xl font-bold text-primary">
                                      {fee.type === 'tax' ? `${fee.value}%` : `₹${fee.value}`}
                                  </p>
                              </div>
                          </CardHeader>
                          <CardContent>
                              {fee.type === 'tax' && (
                                  <div className="mb-4">
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Applied To</p>
                                      <div className="flex flex-wrap gap-1.5">
                                          {fee.applicableOn.length === 0 ? (
                                              <Badge variant="outline" className="text-xs text-red-500 border-red-200 bg-red-50">Invalid: Needs Component</Badge>
                                          ) : (
                                              fee.applicableOn.map(c => (
                                                  <Badge key={c} variant="outline" className="text-[10px] uppercase bg-white">
                                                      {c}
                                                  </Badge>
                                              ))
                                          )}
                                      </div>
                                  </div>
                              )}
                              
                              <div className="flex items-center justify-between pt-4 border-t border-primary/10">
                                  <div className="flex items-center gap-2">
                                      <Switch 
                                          checked={fee.isActive} 
                                          onCheckedChange={() => handleToggleActive(fee._id, fee.isActive, fee.type)}
                                      />
                                      <span className="text-sm font-medium text-muted-foreground">
                                          {fee.isActive ? 'Active' : 'Disabled'}
                                      </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="icon" onClick={() => handleEdit(fee)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                          <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => handleDelete(fee._id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                  </div>
                              </div>
                          </CardContent>
                      </Card>
                  ))
              )}
          </div>
      </div>
  );
}
