'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const SECTIONS = [
  { key: 'about', label: 'About Us' },
  { key: 'terms', label: 'Terms & Conditions' },
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'support', label: 'Support & Contact' },
  { key: 'faq', label: 'FAQs' },
  { key: 'refund', label: 'Refund Policy' },
];

export default function ContentManagementPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    meta: {} as any
  });

  useEffect(() => {
    if (token && activeTab) {
      fetchContent(activeTab);
    }
  }, [token, activeTab]);

  const fetchContent = async (key: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/${key}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        setFormData({
          title: data.data.title || getContentTitle(key),
          content: data.data.content || '',
          meta: data.data.meta || {}
        });
      } else {
        // Reset if no content
        setFormData({
          title: getContentTitle(key),
          content: '',
          meta: {}
        });
      }
    } catch (error) {
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/content/${activeTab}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(`${getContentLabel(activeTab)} updated successfully`);
      } else {
        toast.error(data.error || "Failed to update content");
      }
    } catch (error) {
      toast.error("Error saving content");
    } finally {
      setSaving(false);
    }
  };

  const getContentLabel = (key: string) => SECTIONS.find(s => s.key === key)?.label || key;
  
  const getContentTitle = (key: string) => {
      switch(key) {
          case 'about': return 'About Purple Bite';
          case 'terms': return 'Terms and Conditions';
          case 'privacy': return 'Privacy Policy';
          case 'support': return 'Support & Contact';
          case 'faq': return 'Frequently Asked Questions';
          case 'refund': return 'Refund Policy';
          default: return '';
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
           <p className="text-muted-foreground">Manage static pages like About Us, Terms, and Support.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <Card className="md:w-64 h-fit border-none shadow-sm">
            <CardContent className="p-4">
                <nav className="flex flex-col space-y-1">
                    {SECTIONS.map((section) => (
                        <Button
                            key={section.key}
                            variant={activeTab === section.key ? "secondary" : "ghost"}
                            className="justify-start font-medium"
                            onClick={() => setActiveTab(section.key)}
                        >
                            {section.label}
                        </Button>
                    ))}
                </nav>
            </CardContent>
        </Card>

        {/* Editor Area */}
        <Card className="flex-1 border-none shadow-sm">
            <CardHeader>
                <CardTitle>{getContentLabel(activeTab)}</CardTitle>
                <CardDescription>
                    Edit the content visible to users on the {getContentLabel(activeTab)} page.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Page Title</label>
                            <Input 
                                value={formData.title} 
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="Page Header Title"
                            />
                        </div>

                        {/* Support Page Specific Fields */}
                        {activeTab === 'support' && (
                            <div className="grid gap-4 p-4 bg-gray-50 rounded-lg border">
                                <h3 className="font-semibold text-sm">Contact Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium">Phone Number</label>
                                        <Input 
                                            value={formData.meta?.phone || ''}
                                            onChange={(e) => setFormData({
                                                ...formData, 
                                                meta: { ...formData.meta, phone: e.target.value } 
                                            })}
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium">Email Address</label>
                                        <Input 
                                            value={formData.meta?.email || ''}
                                            onChange={(e) => setFormData({
                                                ...formData, 
                                                meta: { ...formData.meta, email: e.target.value } 
                                            })}
                                            placeholder="support@example.com"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-medium">Operational Hours</label>
                                        <Input 
                                            value={typeof formData.meta?.hours === 'string' ? formData.meta.hours : ''}
                                            onChange={(e) => setFormData({
                                                ...formData, 
                                                meta: { ...formData.meta, hours: e.target.value } 
                                            })}
                                            placeholder="e.g. Daily: 9 AM - 10 PM"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Content (HTML Supported)</label>
                            <Textarea 
                                value={formData.content} 
                                onChange={(e) => setFormData({...formData, content: e.target.value})}
                                className="min-h-[400px] font-mono text-sm"
                                placeholder="Enter page content here..."
                            />
                            <p className="text-xs text-muted-foreground">
                                You can use basic HTML tags for formatting (e.g., &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;).
                            </p>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
