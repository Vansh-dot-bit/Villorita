'use client';

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package, User, MapPin, LogOut, ChevronRight, FileText, Shield, HelpCircle,
  Phone, Edit2, Save, X, Loader2, Mail, Wallet, Building2, ChevronDown, ChevronUp,
  CreditCard, ClipboardList, CheckCircle, Clock, XCircle
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"
import { useEffect, useState, useRef } from "react"

// ─── Types ───────────────────────────────────────────────
interface PartnerApplication {
  _id: string;
  bakeryName?: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// ─── Helper: labelled field ───────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Section accordion wrapper ────────────────────────────
function FormSection({
  title, icon: Icon, index, isOpen, onToggle, children
}: {
  title: string;
  icon: React.ElementType;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">{index}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{title}</span>
          </div>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {isOpen && (
        <div className="px-5 py-4 bg-white border-t border-gray-50 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Status Card ─────────────────────────────────────────
function ApplicationStatus({ app, onReapply }: { app: PartnerApplication; onReapply: () => void }) {
  const config = {
    pending: {
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      label: 'Under Review',
      msg: 'Your application is being reviewed by our team. We will notify you once a decision is made.'
    },
    approved: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      label: 'Approved!',
      msg: 'Congratulations! Your partnership application has been approved.'
    },
    rejected: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: 'Not Approved',
      msg: 'Unfortunately, your application was not approved at this time. You may reapply.'
    }
  };
  const c = config[app.status];
  const Icon = c.icon;

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-6`}>
      <div className="flex items-start gap-4">
        <div className={`h-12 w-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon className={`h-6 w-6 ${c.color}`} />
        </div>
        <div className="flex-1">
          <p className={`font-bold text-lg ${c.color}`}>{c.label}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{c.msg}</p>
          {app.bakeryName && (
            <p className="text-sm font-semibold mt-2">Bakery: {app.bakeryName}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Submitted on {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {app.status === 'rejected' && (
            <Button size="sm" className="mt-3" onClick={onReapply}>
              Reapply
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function ProfilePage() {
  const { user, logout, checkAuth } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Partner Application State
  const [existingApp, setExistingApp] = useState<PartnerApplication | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openSection, setOpenSection] = useState<number>(1);

  // Partner form fields
  const [partner, setPartner] = useState({
    bakeryName: '',
    address: '',
    preparationTime: '',
    openHour: '',
    openPeriod: 'AM',
    closeHour: '',
    closePeriod: 'PM',
    description: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    fssaiNumber: '',
    gstin: '',
    panCard: '',
    bankName: '',
    accountHolderName: '',
    ifscCode: '',
    accountType: 'savings',
  });
  const [fssaiDoc, setFssaiDoc] = useState<File | null>(null);
  const [gstinDoc, setGstinDoc] = useState<File | null>(null);
  const [panDoc, setPanDoc] = useState<File | null>(null);

  const fssaiRef = useRef<HTMLInputElement>(null);
  const gstinRef = useRef<HTMLInputElement>(null);
  const panRef = useRef<HTMLInputElement>(null);

  // ── Profile load ─────────────────────────────────────
  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || '', phone: user.phone || '', email: user.email || '' });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetch('/api/orders')
        .then(r => r.json())
        .then(d => { if (d.success) setOrders(d.orders); })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  // ── Fetch existing partner application ───────────────
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    fetch('/api/partner-application', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) setExistingApp(d.application);
      })
      .catch(console.error)
      .finally(() => setAppLoading(false));
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!formData.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const emailChanged = formData.email !== user.email;

      // First update name and phone
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: formData.name, phone: formData.phone }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to update profile details");
        setSaving(false);
        return;
      }

      if (emailChanged) {
        // Send OTP to new email
        const otpRes = await fetch('/api/user/profile/email-otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ newEmail: formData.email }),
        });
        const otpData = await otpRes.json();
        if (otpData.success) {
          setShowEmailOtp(true);
          toast.success("Profile details saved. OTP sent to new email for verification");
        } else {
          toast.error(otpData.error || "Failed to send OTP for new email");
        }
      } else {
        toast.success("Profile updated successfully");
        await checkAuth();
        setIsEditing(false);
      }
    } catch {
      toast.error("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    setVerifyingOtp(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/profile/email-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newEmail: formData.email, otp: emailOtp }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Email updated successfully");
        setShowEmailOtp(false);
        setEmailOtp('');
        await checkAuth();
        setIsEditing(false);
      } else {
        toast.error(data.error || "Failed to verify OTP");
      }
    } catch {
      toast.error("Error verifying OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleLogout = () => { logout(); window.location.href = '/'; };

  // ── Submit partner application ────────────────────────
  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner.description.trim()) {
      toast.error('Description is required');
      setOpenSection(1);
      return;
    }
    if (partner.fssaiNumber && partner.fssaiNumber.length !== 14) {
      toast.error('FSSAI license number must be exactly 14 digits');
      setOpenSection(3);
      return;
    }
    if (partner.gstin && partner.gstin.length !== 15) {
      toast.error('GSTIN must be exactly 15 characters');
      setOpenSection(3);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();

      // Append all text fields
      Object.entries(partner).forEach(([key, val]) => { if (val) fd.append(key, val); });
      if (fssaiDoc) fd.append('fssaiDoc', fssaiDoc);
      if (gstinDoc) fd.append('gstinDoc', gstinDoc);
      if (panDoc) fd.append('panDoc', panDoc);

      const res = await fetch('/api/partner-application', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Application submitted successfully!');
        setExistingApp(data.application);
        setShowPartnerForm(false);
      } else {
        toast.error(data.error || 'Submission failed');
      }
    } catch {
      toast.error('Error submitting application');
    } finally {
      setSubmitting(false);
    }
  };

  const pf = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setPartner(p => ({ ...p, [field]: e.target.value }));

  const handleFileChange = (setter: (f: File | null) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        return;
      }
      setter(file || null);
    };

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <p>Please login to view your profile.</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 md:flex-row">

          {/* ── Sidebar ── */}
          <aside className="w-full md:w-64 space-y-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-6 flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden relative group">
                  {user.googleId ? (
                    <span className="text-2xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
                  ) : (
                    <User className="h-10 w-10" />
                  )}
                </div>

                {isEditing ? (
                  <div className="w-full space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground ml-1">Name</label>
                      <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-9" placeholder="Your Name" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground ml-1">Phone</label>
                      <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-9" placeholder="Phone Number" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground ml-1">Email</label>
                      <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-9" placeholder="Email Address" />
                    </div>
                    {showEmailOtp ? (
                      <div className="space-y-3 p-4 bg-muted/50 rounded-xl mt-4">
                        <label className="text-xs font-semibold text-muted-foreground block text-center">
                          Verify New Email
                        </label>
                        <p className="text-[10px] text-center text-muted-foreground mb-2">
                          Enter the 6-digit OTP sent to {formData.email}
                        </p>
                        <Input 
                          value={emailOtp} 
                          onChange={(e) => setEmailOtp(e.target.value)} 
                          className="h-9 text-center tracking-widest" 
                          placeholder="------" 
                          maxLength={6}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 h-8" onClick={handleVerifyEmailOtp} disabled={verifyingOtp}>
                            {verifyingOtp ? <Loader2 className="h-3 w-3 animate-spin" /> : "Verify"}
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setShowEmailOtp(false)} disabled={verifyingOtp}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1 h-8" onClick={handleSaveProfile} disabled={saving}>
                          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />} Save
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setIsEditing(false)} disabled={saving}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="text-center w-full">
                      <h2 className="font-bold text-lg break-words w-full px-2">{user.name}</h2>
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
                        <Mail className="h-3 w-3" /><span className="break-all">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-0.5">
                          <Phone className="h-3 w-3" /><span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="w-full h-8 mt-2" onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-3 w-3 mr-2" /> Edit Profile
                    </Button>
                  </>
                )}

                {user.googleId && !isEditing && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                    Google Account
                  </span>
                )}
              </CardContent>
            </Card>

            {/* Wallet */}
            <Card className="border-none shadow-sm bg-gradient-to-br from-purple-500 to-pink-500 text-white overflow-hidden relative">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/80 font-medium mb-1">Wallet Balance</p>
                    <p className="text-2xl font-bold">₹{user.walletBalance || 0}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Wallet className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-[10px] text-white/70 mt-2">Use at checkout to save money</p>
              </CardContent>
            </Card>

            <nav className="flex flex-col gap-2">
              <Button variant="secondary" className="justify-start rounded-xl h-12">
                <Package className="mr-2 h-4 w-4" /> My Orders
              </Button>
              <Button variant="ghost" className="justify-start rounded-xl h-12 bg-white hover:bg-white/50">
                <MapPin className="mr-2 h-4 w-4" /> Addresses
              </Button>

              <div className="my-2 border-t border-gray-100" />

              <Button variant="ghost" className="justify-start rounded-xl h-10 bg-white hover:bg-white/50 text-sm" asChild>
                <a href="/about-us"><User className="mr-2 h-4 w-4" /> About Us</a>
              </Button>
              <Button variant="ghost" className="justify-start rounded-xl h-10 bg-white hover:bg-white/50 text-sm" asChild>
                <a href="/terms"><FileText className="mr-2 h-4 w-4" /> Terms &amp; Conditions</a>
              </Button>
              <Button variant="ghost" className="justify-start rounded-xl h-10 bg-white hover:bg-white/50 text-sm" asChild>
                <a href="/privacy"><Shield className="mr-2 h-4 w-4" /> Privacy Policy</a>
              </Button>
              <Button variant="ghost" className="justify-start rounded-xl h-10 bg-white hover:bg-white/50 text-sm" asChild>
                <a href="/refund-policy"><FileText className="mr-2 h-4 w-4" /> Refund Policy</a>
              </Button>
              <Button variant="ghost" className="justify-start rounded-xl h-10 bg-white hover:bg-white/50 text-sm" asChild>
                <a href="/support"><Phone className="mr-2 h-4 w-4" /> Support &amp; Contact</a>
              </Button>
              <Button variant="ghost" className="justify-start rounded-xl h-10 bg-white hover:bg-white/50 text-sm" asChild>
                <a href="/faqs"><HelpCircle className="mr-2 h-4 w-4" /> FAQs</a>
              </Button>

              <div className="my-2 border-t border-gray-100" />
              <Button variant="ghost" className="justify-start rounded-xl h-12 bg-white hover:bg-white/50 text-red-500 hover:text-red-600" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </nav>
          </aside>

          {/* ── Main Content ── */}
          <div className="flex-1 space-y-6">
            <h1 className="text-2xl font-bold">My Profile</h1>

            {/* Profile cards */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Name</label>
                    <div className="p-3 bg-gray-50 rounded-lg font-medium">{user.name}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Email</label>
                    <div className="p-3 bg-gray-50 rounded-lg font-medium">{user.email}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Phone</label>
                    <div className="p-3 bg-gray-50 rounded-lg font-medium">{user.phone || 'Not provided'}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base text-primary">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-between h-14 text-lg" asChild>
                    <a href="/my-orders">
                      <span className="flex items-center gap-2"><Package className="h-5 w-5" /> My Orders</span>
                      <ChevronRight className="h-5 w-5 opacity-50" />
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-between h-14 text-lg bg-white" disabled>
                    <span className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Managed Addresses</span>
                    <span className="text-xs text-muted-foreground">(Coming Soon)</span>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* ════════════════════════════════════════════════ */}
            {/* JOIN AS PARTNER SECTION */}
            {/* ════════════════════════════════════════════════ */}
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-pink-50 border-b border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Join as Partner</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Partner with us and grow your bakery business</p>
                    </div>
                  </div>
                  {!appLoading && !existingApp && !showPartnerForm && (
                    <Button
                      size="sm"
                      className="bg-primary text-white"
                      onClick={() => setShowPartnerForm(true)}
                    >
                      Apply Now
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {appLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : existingApp && !showPartnerForm ? (
                  <ApplicationStatus
                    app={existingApp}
                    onReapply={() => { setExistingApp(null); setShowPartnerForm(true); }}
                  />
                ) : showPartnerForm ? (
                  <form onSubmit={handlePartnerSubmit} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Fill in the details below. Only <strong>Description</strong> is required — all other fields are optional.
                    </p>

                    {/* ── Section 1: Basic Information ── */}
                    <FormSection
                      title="Basic Information"
                      icon={Building2}
                      index={1}
                      isOpen={openSection === 1}
                      onToggle={() => setOpenSection(openSection === 1 ? 0 : 1)}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Bakery Name">
                          <Input placeholder="e.g. Sweet Dreams Bakery" value={partner.bakeryName} onChange={pf('bakeryName')} />
                        </Field>
                        <Field label="Address">
                          <Input placeholder="Full address" value={partner.address} onChange={pf('address')} />
                        </Field>
                        <Field label="Basic Cake Preparation Time">
                          <Input placeholder="e.g. 2-3 hours" value={partner.preparationTime} onChange={pf('preparationTime')} />
                        </Field>
                        <Field label="Open Hour (with period)">
                          <div className="flex gap-2">
                            <Input placeholder="e.g. 9:00" value={partner.openHour} onChange={pf('openHour')} className="flex-1" />
                            <select
                              value={partner.openPeriod}
                              onChange={pf('openPeriod')}
                              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option>AM</option>
                              <option>PM</option>
                            </select>
                          </div>
                        </Field>
                        <Field label="Close Hour (with period)">
                          <div className="flex gap-2">
                            <Input placeholder="e.g. 9:00" value={partner.closeHour} onChange={pf('closeHour')} className="flex-1" />
                            <select
                              value={partner.closePeriod}
                              onChange={pf('closePeriod')}
                              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option>AM</option>
                              <option>PM</option>
                            </select>
                          </div>
                        </Field>
                      </div>
                      <Field label="Description" required>
                        <textarea
                          required
                          placeholder="Tell us about your bakery, specialities, experience..."
                          value={partner.description}
                          onChange={pf('description')}
                          rows={4}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                      </Field>
                    </FormSection>

                    {/* ── Section 2: Owner Details ── */}
                    <FormSection
                      title="Owner Details"
                      icon={User}
                      index={2}
                      isOpen={openSection === 2}
                      onToggle={() => setOpenSection(openSection === 2 ? 0 : 2)}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Owner Name">
                          <Input placeholder="Full name" value={partner.ownerName} onChange={pf('ownerName')} />
                        </Field>
                        <Field label="Phone Number">
                          <Input placeholder="Mobile number" value={partner.ownerPhone} onChange={pf('ownerPhone')} type="tel" />
                        </Field>
                        <Field label="Email Address">
                          <Input placeholder="Business email" value={partner.ownerEmail} onChange={pf('ownerEmail')} type="email" />
                        </Field>
                      </div>
                    </FormSection>

                    {/* ── Section 3: Legalities ── */}
                    <FormSection
                      title="Legalities"
                      icon={FileText}
                      index={3}
                      isOpen={openSection === 3}
                      onToggle={() => setOpenSection(openSection === 3 ? 0 : 3)}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="FSSAI License No. (14 digits)">
                          <Input
                            placeholder="14-digit number"
                            value={partner.fssaiNumber}
                            onChange={pf('fssaiNumber')}
                            maxLength={14}
                          />
                        </Field>
                        <Field label="GSTIN (15 characters)">
                          <Input
                            placeholder="15-char GSTIN"
                            value={partner.gstin}
                            onChange={pf('gstin')}
                            maxLength={15}
                            className="uppercase"
                          />
                        </Field>
                        <Field label="PAN Card">
                          <Input
                            placeholder="e.g. ABCDE1234F"
                            value={partner.panCard}
                            onChange={pf('panCard')}
                            maxLength={10}
                            className="uppercase"
                          />
                        </Field>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        {/* FSSAI Document */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">FSSAI Document (PDF)</label>
                          <div
                            className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                            onClick={() => fssaiRef.current?.click()}
                          >
                            <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                            <p className="text-xs text-muted-foreground">
                              {fssaiDoc ? fssaiDoc.name : 'Click to upload PDF'}
                            </p>
                          </div>
                          <input ref={fssaiRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange(setFssaiDoc)} />
                        </div>

                        {/* GSTIN Document */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">GSTIN Document (PDF)</label>
                          <div
                            className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                            onClick={() => gstinRef.current?.click()}
                          >
                            <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                            <p className="text-xs text-muted-foreground">
                              {gstinDoc ? gstinDoc.name : 'Click to upload PDF'}
                            </p>
                          </div>
                          <input ref={gstinRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange(setGstinDoc)} />
                        </div>

                        {/* PAN Document */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">PAN Document (PDF)</label>
                          <div
                            className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                            onClick={() => panRef.current?.click()}
                          >
                            <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                            <p className="text-xs text-muted-foreground">
                              {panDoc ? panDoc.name : 'Click to upload PDF'}
                            </p>
                          </div>
                          <input ref={panRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange(setPanDoc)} />
                        </div>
                      </div>
                    </FormSection>

                    {/* ── Section 4: Bank Details ── */}
                    <FormSection
                      title="Bank Details"
                      icon={CreditCard}
                      index={4}
                      isOpen={openSection === 4}
                      onToggle={() => setOpenSection(openSection === 4 ? 0 : 4)}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Bank Name">
                          <Input placeholder="e.g. State Bank of India" value={partner.bankName} onChange={pf('bankName')} />
                        </Field>
                        <Field label="Account Holder Name">
                          <Input placeholder="Name on account" value={partner.accountHolderName} onChange={pf('accountHolderName')} />
                        </Field>
                        <Field label="IFSC Code">
                          <Input placeholder="e.g. SBIN0001234" value={partner.ifscCode} onChange={pf('ifscCode')} className="uppercase" />
                        </Field>
                        <Field label="Account Type">
                          <select
                            value={partner.accountType}
                            onChange={pf('accountType')}
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="savings">Savings</option>
                            <option value="current">Current</option>
                          </select>
                        </Field>
                      </div>
                    </FormSection>

                    {/* ── Submit ── */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        type="submit"
                        className="flex-1 h-11 text-base"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting…</>
                        ) : (
                          <><ClipboardList className="h-4 w-4 mr-2" /> Submit Application</>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11"
                        onClick={() => setShowPartnerForm(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  // Default state — no application, form not open
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">Become a Partner Bakery</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md">
                      List your bakery on our platform, reach thousands of cake lovers, and grow your business with us.
                    </p>
                    <Button className="mt-5" onClick={() => setShowPartnerForm(true)}>
                      <ClipboardList className="h-4 w-4 mr-2" /> Apply Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
