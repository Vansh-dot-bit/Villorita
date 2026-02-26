'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  ClipboardList,
  Building2,
  User,
  Phone,
  Mail,
  CreditCard,
  FileText,
} from 'lucide-react';

interface Application {
  _id: string;
  userId: { name: string; email: string; phone?: string } | null;
  bakeryName?: string;
  address?: string;
  preparationTime?: string;
  openHour?: string;
  openPeriod?: string;
  closeHour?: string;
  closePeriod?: string;
  description: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  fssaiNumber?: string;
  gstin?: string;
  panCard?: string;
  fssaiDocUrl?: string;
  gstinDocUrl?: string;
  panDocUrl?: string;
  bankName?: string;
  accountHolderName?: string;
  ifscCode?: string;
  accountType?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/admin/partner-applications', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications);
      } else {
        toast.error('Failed to load applications');
      }
    } catch {
      toast.error('Error loading applications');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    setUpdating(id + status);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/partner-applications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Application ${status} successfully!`);
        setApplications((prev) =>
          prev.map((a) => (a._id === id ? { ...a, status } : a))
        );
      } else {
        toast.error(data.error || 'Update failed');
      }
    } catch {
      toast.error('Error updating application');
    } finally {
      setUpdating(null);
    }
  };

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const Field = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value}</p>
      </div>
    ) : null;

  const counts = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Partner Applications</h1>
          <p className="text-muted-foreground mt-1">Review and manage bakery partnership applications</p>
        </div>
        <Button variant="outline" onClick={fetchApplications} size="sm">
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total', value: counts.total, color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Pending', value: counts.pending, color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'Approved', value: counts.approved, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Rejected', value: counts.rejected, color: 'text-red-700', bg: 'bg-red-50' },
        ].map((s) => (
          <Card key={s.label} className={`border-none shadow-sm ${s.bg}`}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="border-none shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="font-semibold text-muted-foreground">No applications yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Partner applications will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={app._id} className="border-none shadow-sm overflow-hidden">
              {/* Row header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggle(app._id)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{app.bakeryName || 'Unnamed Bakery'}</p>
                    <p className="text-xs text-muted-foreground">
                      {app.userId?.name} · {new Date(app.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${statusColors[app.status]}`}>
                    {app.status}
                  </span>
                  {expandedId === app._id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === app._id && (
                <div className="border-t bg-muted/10 px-6 py-5 space-y-6">

                  {/* Section 1: Basic Info */}
                  <div>
                    <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Basic Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Field label="Bakery Name" value={app.bakeryName} />
                      <Field label="Address" value={app.address} />
                      <Field label="Preparation Time" value={app.preparationTime} />
                      <Field
                        label="Open Hours"
                        value={app.openHour ? `${app.openHour} ${app.openPeriod} – ${app.closeHour} ${app.closePeriod}` : undefined}
                      />
                      <div className="col-span-2">
                        <Field label="Description" value={app.description} />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Owner Details */}
                  {(app.ownerName || app.ownerPhone || app.ownerEmail) && (
                    <div>
                      <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" /> Owner Details
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Field label="Owner Name" value={app.ownerName} />
                        <Field label="Phone" value={app.ownerPhone} />
                        <Field label="Email" value={app.ownerEmail} />
                      </div>
                    </div>
                  )}

                  {/* Section 3: Legalities */}
                  {(app.fssaiNumber || app.gstin || app.panCard || app.fssaiDocUrl || app.gstinDocUrl || app.panDocUrl) && (
                    <div>
                      <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Legalities
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Field label="FSSAI License No." value={app.fssaiNumber} />
                        <Field label="GSTIN" value={app.gstin} />
                        <Field label="PAN Card" value={app.panCard} />
                      </div>
                      <div className="flex gap-3 mt-3 flex-wrap">
                        {app.fssaiDocUrl && (
                          <a href={app.fssaiDocUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg px-3 py-1.5 font-medium transition-colors">
                            📄 FSSAI Document
                          </a>
                        )}
                        {app.gstinDocUrl && (
                          <a href={app.gstinDocUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg px-3 py-1.5 font-medium transition-colors">
                            📄 GSTIN Document
                          </a>
                        )}
                        {app.panDocUrl && (
                          <a href={app.panDocUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg px-3 py-1.5 font-medium transition-colors">
                            📄 PAN Document
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Section 4: Bank Details */}
                  {(app.bankName || app.accountHolderName || app.ifscCode) && (
                    <div>
                      <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Bank Details
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Field label="Bank Name" value={app.bankName} />
                        <Field label="Account Holder" value={app.accountHolderName} />
                        <Field label="IFSC Code" value={app.ifscCode} />
                        <Field label="Account Type" value={app.accountType ? app.accountType.charAt(0).toUpperCase() + app.accountType.slice(1) : undefined} />
                      </div>
                    </div>
                  )}

                  {/* User info from account */}
                  {app.userId && (
                    <div className="bg-muted/40 rounded-xl p-3 flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="h-3.5 w-3.5" /> {app.userId.name}
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" /> {app.userId.email}
                      </span>
                      {app.userId.phone && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" /> {app.userId.phone}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {app.status === 'pending' && (
                    <div className="flex gap-3 pt-2">
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                        onClick={() => updateStatus(app._id, 'approved')}
                        disabled={!!updating}
                      >
                        {updating === app._id + 'approved' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approve Application
                      </Button>
                      <Button
                        variant="destructive"
                        className="gap-2"
                        onClick={() => updateStatus(app._id, 'rejected')}
                        disabled={!!updating}
                      >
                        {updating === app._id + 'rejected' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Reject Application
                      </Button>
                    </div>
                  )}

                  {app.status !== 'pending' && (
                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(app._id, 'pending')}
                        disabled={!!updating}
                      >
                        Reset to Pending
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
