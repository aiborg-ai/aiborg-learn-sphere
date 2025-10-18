import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useRefundRequests } from '@/hooks/usePaymentTransactions';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import {
  DollarSign,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { RefundRequest } from '@/hooks/usePaymentTransactions';

export function RefundProcessor() {
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState<RefundRequest['refund_status']>('pending');
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { refundRequests, loading, refetch, updateRefundStatus } = useRefundRequests();
  const { logRefundProcessed } = useAuditLogs();
  const { toast } = useToast();

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const filteredRefunds = refundRequests.filter(refund => {
    if (statusFilter === 'all') return true;
    return refund.refund_status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }
    > = {
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1" /> },
      approved: { variant: 'default', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      rejected: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
      processed: { variant: 'default', icon: <RefreshCw className="h-3 w-3 mr-1" /> },
      completed: { variant: 'outline', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
    };

    const { variant, icon } = config[status] || config.pending;

    return (
      <Badge variant={variant} className="flex items-center w-fit">
        {icon}
        {status}
      </Badge>
    );
  };

  const handleOpenProcess = (refund: RefundRequest) => {
    setSelectedRefund(refund);
    setNewStatus(refund.refund_status);
    setAdminNotes(refund.admin_notes || '');
    setShowProcessDialog(true);
  };

  const handleProcessRefund = async () => {
    if (!selectedRefund) return;

    setProcessing(true);
    try {
      await updateRefundStatus(selectedRefund.id, newStatus, adminNotes);

      // Log audit trail
      await logRefundProcessed(selectedRefund.id, {
        refund_amount: selectedRefund.refund_amount,
        old_status: selectedRefund.refund_status,
        new_status: newStatus,
        user_id: selectedRefund.user_id,
        admin_notes: adminNotes,
      });

      toast({
        title: 'Refund Updated',
        description: `Refund status changed to ${newStatus}`,
      });

      setShowProcessDialog(false);
      setSelectedRefund(null);
      setAdminNotes('');
      refetch();
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to update refund status',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getRefundStats = () => {
    const total = refundRequests.length;
    const pending = refundRequests.filter(r => r.refund_status === 'pending').length;
    const approved = refundRequests.filter(r => r.refund_status === 'approved').length;
    const processed = refundRequests.filter(
      r => r.refund_status === 'processed' || r.refund_status === 'completed'
    ).length;
    const totalAmount = refundRequests
      .filter(r => r.refund_status === 'completed')
      .reduce((sum, r) => sum + r.refund_amount, 0);

    return { total, pending, approved, processed, totalAmount };
  };

  const stats = getRefundStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card className="bg-white/95 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Refund Processor
          </CardTitle>
          <CardDescription>Manage refund requests and process refunds</CardDescription>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Processed</p>
              <p className="text-2xl font-bold text-purple-600">{stats.processed}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="mt-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRefunds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No refund requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRefunds.map(refund => (
                    <TableRow key={refund.id}>
                      <TableCell className="font-medium">
                        {refund.user?.display_name || 'N/A'}
                      </TableCell>
                      <TableCell>{refund.user?.email || 'N/A'}</TableCell>
                      <TableCell className="font-semibold">
                        ₹{refund.refund_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={refund.refund_reason || ''}>
                          {refund.refund_reason || 'No reason provided'}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(refund.refund_status)}</TableCell>
                      <TableCell>{new Date(refund.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenProcess(refund)}
                        >
                          Process
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            <p>Total Refunded: ₹{stats.totalAmount.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Process Refund Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Process Refund Request</DialogTitle>
            <DialogDescription>Review and update the refund request status</DialogDescription>
          </DialogHeader>

          {selectedRefund && (
            <div className="space-y-4">
              {/* Refund Details */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Student:</span>
                  <span className="font-medium">
                    {selectedRefund.user?.display_name || selectedRefund.user?.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="font-bold text-green-600">
                    ₹{selectedRefund.refund_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Status:</span>
                  {getStatusBadge(selectedRefund.refund_status)}
                </div>
                {selectedRefund.refund_reason && (
                  <div>
                    <span className="text-sm text-gray-600">Reason:</span>
                    <p className="text-sm mt-1">{selectedRefund.refund_reason}</p>
                  </div>
                )}
              </div>

              {/* Status Selection */}
              <div className="space-y-2">
                <label htmlFor="refund-status-select" className="text-sm font-medium">
                  Update Status
                </label>
                <Select
                  value={newStatus}
                  onValueChange={value => setNewStatus(value as RefundRequest['refund_status'])}
                >
                  <SelectTrigger id="refund-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <label htmlFor="admin-notes" className="text-sm font-medium">
                  Admin Notes
                </label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add notes about this refund..."
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Warning */}
              {newStatus === 'completed' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                      Marking as completed indicates the refund has been processed and funds
                      transferred.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProcessDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleProcessRefund} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
