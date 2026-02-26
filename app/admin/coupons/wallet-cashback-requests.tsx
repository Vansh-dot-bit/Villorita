'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

export function WalletCashbackRequests() {
  const { token } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalAmounts, setApprovalAmounts] = useState<{ [key: string]: number }>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingRequests();
  }, [token]);

  const fetchPendingRequests = async () => {
    if (!token) return;
    
    try {
      const res = await fetch('/api/admin/wallet-cashback', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setPendingRequests(data.requests);
        // Initialize approval amounts with requested amounts
        const amounts: { [key: string]: number } = {};
        data.requests.forEach((req: any) => {
          amounts[req._id] = req.requestedAmount;
        });
        setApprovalAmounts(amounts);
      }
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setApprovingId(requestId);
    const approvedAmount = approvalAmounts[requestId] || 0;

    try {
      const res = await fetch('/api/admin/wallet-cashback/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId, approvedAmount })
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        // Refresh the list
        fetchPendingRequests();
      } else {
        toast.error(data.error || 'Failed to approve request');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-none shadow-sm mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-purple-600" />
            Pending Wallet Cashback Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <Card className="border-none shadow-sm mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-purple-600" />
            Pending Wallet Cashback Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">No pending cashback requests.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-purple-600" />
          Pending Wallet Cashback Approvals ({pendingRequests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingRequests.map((request: any) => (
            <div 
              key={request._id} 
              className="flex items-center justify-between border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-bold">{request.user?.name || 'Unknown User'}</p>
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                    {request.couponCode}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Order #{request.order?._id?.slice(-6).toUpperCase()} • {format(new Date(request.createdAt), 'PPP')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {request.user?.email}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Requested</p>
                  <p className="text-xl font-bold text-purple-700">₹{request.requestedAmount}</p>
                </div>
                <div>
                  <Input
                    type="number"
                    min="0"
                    value={approvalAmounts[request._id] || 0}
                    onChange={(e) => setApprovalAmounts({
                      ...approvalAmounts,
                      [request._id]: parseFloat(e.target.value) || 0
                    })}
                    className="w-24 h-10 text-center"
                    disabled={approvingId === request._id}
                  />
                  <p className="text-xs text-muted-foreground text-center mt-1">Amount</p>
                </div>
                <Button
                  onClick={() => handleApprove(request._id)}
                  disabled={approvingId === request._id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {approvingId === request._id ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
