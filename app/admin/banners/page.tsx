'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react"
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';
import { ImageUploadInput } from '@/components/ui/image-upload';

interface Banner {
  _id: string;
  title: string;
  description: string;
  code: string;
  cta: string;
  link: string;
  gradient: string;
  textColor: string;
  image?: string;
  isActive: boolean;
  order: number;
}

const DEFAULT_GRADIENTS = [
  { label: 'Purple to Pink', value: 'from-purple-500 to-pink-500' },
  { label: 'Blue to Indigo', value: 'from-blue-400 to-indigo-500' },
  { label: 'Amber to Orange', value: 'from-amber-400 to-orange-500' },
  { label: 'Emerald to Teal', value: 'from-emerald-400 to-teal-500' },
  { label: 'Rose to Red', value: 'from-rose-400 to-red-500' },
]

// Static pages in the website
const STATIC_LINKS = [
  { label: '🏠 Home', value: '/' },
  { label: '🛍️ All Products', value: '/category/all' },
  { label: '🔍 Search', value: '/search' },
  { label: '🤝 Become a Partner', value: '/partner' },
  { label: '📦 My Orders', value: '/my-orders' },
  { label: '🛒 Cart', value: '/cart' },
  { label: '🧁 Custom Order', value: '/custom-order' },
  { label: 'ℹ️ About Us', value: '/about-us' },
  { label: '❓ FAQs', value: '/faqs' },
  { label: '📋 Terms & Conditions', value: '/terms' },
  { label: '🔒 Privacy Policy', value: '/privacy' },
  { label: '💬 Support', value: '/support' },
]

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ name: string; slug?: string; _id?: string }[]>([]);
  const [stores, setStores] = useState<{ _id: string; name: string }[]>([]);
  const { token } = useAuth();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    cta: 'Shop Now',
    link: '/category/all',
    gradient: 'from-purple-500 to-pink-500',
    textColor: 'text-white',
    image: '',
    isActive: true,
    order: 0
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      // Need admin param to fetch all? check API route implementation.
      // API implementation: if type=all and auth admin -> returns all.
      // But passing auth token in server fetch is tricky without client side fetch.
      // Here we are client side.
      const res = await fetch('/api/banners?type=all', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setBanners(data.banners);
      } else {
        toast.error("Failed to fetch banners");
      }
    } catch (error) {
      toast.error("Error loading banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBanners();
  }, [token]);

  useEffect(() => {
    const fetchCategoriesAndStores = async () => {
      try {
        const [catRes, storeRes] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/stores')
        ]);
        
        const catData = await catRes.json();
        const storeData = await storeRes.json();
        
        if (catData.success) setCategories(catData.categories || []);
        if (storeData.success) setStores(storeData.stores || []);
      } catch (e) {
        console.error("Failed to fetch dropdown options", e);
      }
    };
    fetchCategoriesAndStores();
  }, []);

  const handleSubmit = async () => {
    if (!formData.title && !formData.image && !formData.gradient) {
        toast.error("Provide at least a Title, Image, or Gradient");
        return;
    }

    try {
        const url = editingBanner 
            ? `/api/banners/${editingBanner._id}` 
            : '/api/banners';
            
        const method = editingBanner ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await res.json();
        
        if (data.success) {
            toast.success(editingBanner ? "Banner updated" : "Banner created");
            setIsDialogOpen(false);
            setEditingBanner(null);
            resetForm();
            fetchBanners();
        } else {
            toast.error(data.error || "Operation failed");
        }
    } catch (error) {
        toast.error("Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
      if (!confirm("Are you sure you want to delete this banner?")) return;
      
      try {
          const res = await fetch(`/api/banners/${id}`, {
              method: 'DELETE',
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });
          const data = await res.json();
          if (data.success) {
              toast.success("Banner deleted");
              fetchBanners();
          } else {
              toast.error(data.error || "Failed to delete");
          }
      } catch (error) {
          toast.error("Error deleting banner");
      }
  };

  const openEdit = (banner: Banner) => {
      setEditingBanner(banner);
      setFormData({
          title: banner.title,
          description: banner.description,
          code: banner.code,
          cta: banner.cta,
          link: banner.link,
          gradient: banner.gradient,
          textColor: banner.textColor,
          image: banner.image || '',
          isActive: banner.isActive,
          order: banner.order
      });
      setIsDialogOpen(true);
  };

  const resetForm = () => {
      setFormData({
        title: '',
        description: '',
        code: '',
        cta: 'Shop Now',
        link: '/category/all',
        gradient: 'from-purple-500 to-pink-500',
        textColor: 'text-white',
        image: '',
        isActive: true,
        order: 0
      });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Banners Management</h1>
        <Button onClick={() => {
            setEditingBanner(null);
            resetForm();
            setIsDialogOpen(true);
        }}>
            <Plus className="mr-2 h-4 w-4" /> Add Banner
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle>{editingBanner ? 'Edit Banner' : 'Create New Banner'}</DialogTitle>
                  <DialogDescription>
                      Banners appear on the homepage carousel.
                  </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                      <Label>Title</Label>
                      <Input 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        placeholder="e.g. Flat 50% OFF"
                      />
                  </div>
                  <div className="grid gap-2">
                      <Label>Description</Label>
                      <Textarea 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Short description of the offer"
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                          <Label>Coupon Code</Label>
                          <Input 
                            value={formData.code} 
                            onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                            placeholder="CODE123"
                            className="uppercase"
                          />
                      </div>
                      <div className="grid gap-2">
                          <Label>Sort Order</Label>
                          <Input 
                            type="number"
                            value={formData.order} 
                            onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                          />
                      </div>
                  </div>
                  
                  <div className="grid gap-2">
                      <Label>Background Image (Optional)</Label>
                      {/* Using HTML input and custom state locally, or ImageUploadInput */}
                      {/* Let's see if ImageUploadInput works here - wait, we need to import it */}
                      <ImageUploadInput 
                        name="image" 
                        label="Upload Background Image" 
                        defaultValue={formData.image} 
                        onChange={(path) => setFormData({...formData, image: path})} 
                      />
                  </div>

                  {!formData.image && (
                      <div className="grid gap-2">
                          <Label>Gradient Style</Label>
                          <Select 
                            value={formData.gradient} 
                            onValueChange={val => setFormData({...formData, gradient: val})}
                          >
                              <SelectTrigger>
                                  <SelectValue placeholder="Select Gradient" />
                              </SelectTrigger>
                              <SelectContent>
                                  {DEFAULT_GRADIENTS.map(grad => (
                                      <SelectItem key={grad.value} value={grad.value}>
                                          <div className="flex items-center gap-2">
                                              <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${grad.value}`} />
                                              {grad.label}
                                          </div>
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                          <Label>Button Text</Label>
                          <Input 
                            value={formData.cta} 
                            onChange={e => setFormData({...formData, cta: e.target.value})}
                            placeholder="Shop Now"
                          />
                      </div>
                      <div className="grid gap-2">
                          <Label>Link Destination</Label>
                          <Select
                            value={formData.link}
                            onValueChange={val => setFormData({...formData, link: val})}
                          >
                              <SelectTrigger>
                                  <SelectValue placeholder="Select a page or category..." />
                              </SelectTrigger>
                              <SelectContent>
                                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pages</div>
                                  {STATIC_LINKS.map(link => (
                                      <SelectItem key={link.value} value={link.value}>{link.label}</SelectItem>
                                  ))}
                                  {categories.length > 0 && (
                                      <>
                                          <div className="px-2 py-1 mt-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t">Categories</div>
                                          {categories.map((cat: any) => (
                                              <SelectItem
                                                  key={`cat-${cat._id || cat.name}`}
                                                  value={`/category/${(cat.slug || cat.name).toLowerCase().replace(/\s+/g, '-')}`}
                                              >
                                                  🏷️ {cat.name}
                                              </SelectItem>
                                          ))}
                                      </>
                                  )}
                                  {stores.length > 0 && (
                                      <>
                                          <div className="px-2 py-1 mt-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t">Stores</div>
                                          {stores.map((store: any) => (
                                              <SelectItem
                                                  key={`store-${store._id}`}
                                                  value={`/store/${store._id}`}
                                              >
                                                  🏪 {store.name}
                                              </SelectItem>
                                          ))}
                                      </>
                                  )}
                              </SelectContent>
                          </Select>
                      </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                      <Switch 
                        checked={formData.isActive}
                        onCheckedChange={checked => setFormData({...formData, isActive: checked})}
                      />
                      <Label>Active Status</Label>
                  </div>
                  
                  {/* Preview */}
                  <div className="mt-4 p-6 rounded-xl text-white relative overflow-hidden h-40 flex items-center bg-gray-100">
                      {/* Gradient Fallback */}
                      {!formData.image && (
                          <div className={`absolute inset-0 bg-gradient-to-r ${formData.gradient} z-0`} />
                      )}
                      
                      {/* Image Layer */}
                      {formData.image && (
                          <img 
                            src={formData.image.startsWith('http') ? formData.image : `/api/uploads/${formData.image}`}
                            alt="Preview Background"
                            className="absolute inset-0 w-full h-full object-cover z-0"
                          />
                      )}
                      
                      {/* Dark overlay if we have text AND an image, to ensure readability */}
                      {formData.image && (formData.title || formData.description) && (
                          <div className="absolute inset-0 bg-black/40 z-0" />
                      )}

                      <div className={`relative z-10 ${formData.textColor}`}>
                          {formData.title && <h3 className="text-xl font-bold">{formData.title}</h3>}
                          {formData.description && <p className="text-sm opacity-90">{formData.description}</p>}
                          {formData.code && (
                              <div className="mt-2 text-xs bg-black/20 inline-block px-2 py-1 rounded font-mono border border-white/20">
                                  {formData.code}
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSubmit}>{editingBanner ? 'Update' : 'Create'}</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <div className="grid gap-4">
          {loading ? (
              <div className="text-center py-12">Loading banners...</div>
          ) : banners.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                  <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Banners Found</h3>
                  <p className="text-muted-foreground">Create your first banner to display on the homepage.</p>
              </div>
          ) : (
              <div className="rounded-md border bg-white">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Preview</TableHead>
                              <TableHead>Title</TableHead>
                              <TableHead>Code</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Order</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {banners.map(banner => (
                              <TableRow key={banner._id}>
                                  <TableCell>
                                      {banner.image ? (
                                        <div className="w-16 h-10 rounded-md overflow-hidden relative">
                                            <img src={banner.image.startsWith('http') ? banner.image : `/api/uploads/${banner.image}`} alt={banner.title} className="w-full h-full object-cover" />
                                        </div>
                                      ) : (
                                        <div className={`w-16 h-10 rounded-md bg-gradient-to-r ${banner.gradient}`} />
                                      )}
                                  </TableCell>
                                  <TableCell className="font-medium">{banner.title || <span className="text-muted-foreground italic">No Title</span>}</TableCell>
                                  <TableCell>
                                      {banner.code ? (
                                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">{banner.code}</code>
                                      ) : (
                                          <span className="text-muted-foreground text-xs italic">N/A</span>
                                      )}
                                  </TableCell>
                                  <TableCell>
                                      <div className={`w-2 h-2 rounded-full ${banner.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                                  </TableCell>
                                  <TableCell>{banner.order}</TableCell>
                                  <TableCell className="text-right">
                                      <Button variant="ghost" size="icon" onClick={() => openEdit(banner)}>
                                          <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(banner._id)}>
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
          )}
      </div>
    </div>
  )
}
