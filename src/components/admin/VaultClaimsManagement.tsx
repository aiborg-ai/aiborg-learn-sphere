import { useState } from 'react';
import { format } from 'date-fns';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Users,
  Eye,
  AlertCircle,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVaultClaimsAdmin } from '@/hooks/useVaultClaimsAdmin';
import type { VaultClaim } from '@/types';

export const VaultClaimsManagement = () => {
  const {
    useAllClaims,
    usePendingCount,
    useClaimStats,
    approveClaim,
    rejectClaim,
    isApproving,
    isRejecting,
  } = useVaultClaimsAdmin();

  const [selectedStatus, setSelectedStatus] = useState<VaultClaim['status'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<VaultClaim | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: allClaims, isLoading } = useAllClaims(
    selectedStatus === 'all' ? undefined : selectedStatus
  );
  const { data: pendingCount } = usePendingCount();
  const { data: stats } = useClaimStats();

  // Filter claims by search query
  const filteredClaims =
    allClaims?.filter(
      claim =>
        claim.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.vault_email.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const handleViewDetails = (claim: VaultClaim) => {
    setSelectedClaim(claim);
    setViewDetailsOpen(true);
  };

  const handleApproveClick = (claim: VaultClaim) => {
    setSelectedClaim(claim);
    setAdminNotes('');
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (claim: VaultClaim) => {
    setSelectedClaim(claim);
    setRejectionReason('');
    setAdminNotes('');
    setRejectDialogOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedClaim) return;

    await approveClaim.mutateAsync({
      claimId: selectedClaim.id,
      action: 'approve',
      adminNotes: adminNotes || undefined,
      grantEndDate: selectedClaim.vault_subscription_end_date,
    });

    setApproveDialogOpen(false);
    setSelectedClaim(null);
    setAdminNotes('');
  };

  const handleRejectConfirm = async () => {
    if (!selectedClaim || !rejectionReason) return;

    await rejectClaim.mutateAsync({
      claimId: selectedClaim.id,
      action: 'reject',
      rejectionReason,
      adminNotes: adminNotes || undefined,
    });

    setRejectDialogOpen(false);
    setSelectedClaim(null);
    setRejectionReason('');
    setAdminNotes('');
  };

  const getStatusBadge = (status: VaultClaim['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700 bg-yellow-50">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Expired
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <div className="text-sm text-gray-600">Total Claims</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-700">{stats?.pending || 0}</div>
            <div className="text-sm text-yellow-600">Pending Review</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-700">{stats?.approved || 0}</div>
            <div className="text-sm text-green-600">Approved</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-700">{stats?.rejected || 0}</div>
            <div className="text-sm text-red-600">Rejected</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gray-50/50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-700">{stats?.expired || 0}</div>
            <div className="text-sm text-gray-600">Expired</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={selectedStatus}
                onValueChange={value => setSelectedStatus(value as VaultClaim['status'] | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Claims</SelectItem>
                  <SelectItem value="pending">Pending ({stats?.pending || 0})</SelectItem>
                  <SelectItem value="approved">Approved ({stats?.approved || 0})</SelectItem>
                  <SelectItem value="rejected">Rejected ({stats?.rejected || 0})</SelectItem>
                  <SelectItem value="expired">Expired ({stats?.expired || 0})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Vault Subscription Claims
            {selectedStatus === 'pending' && pendingCount && pendingCount > 0 && (
              <Badge className="ml-2">{pendingCount} Pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading claims...</div>
          ) : filteredClaims.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No claims found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vault Email</TableHead>
                    <TableHead>Subscription End</TableHead>
                    <TableHead>Family Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.map(claim => (
                    <TableRow key={claim.id}>
                      <TableCell className="text-sm">
                        {format(new Date(claim.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">{claim.user_name}</TableCell>
                      <TableCell className="text-sm">{claim.user_email}</TableCell>
                      <TableCell className="text-sm">{claim.vault_email}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(claim.vault_subscription_end_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-center">
                        {claim.family_members?.length || 0}
                      </TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(claim)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {claim.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApproveClick(claim)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRejectClick(claim)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
            <DialogDescription>Review vault subscription claim information</DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Status:</span>
                {getStatusBadge(selectedClaim.status)}
              </div>

              {/* User Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">User Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium text-gray-500">Name:</span>
                    <span className="col-span-2 text-sm font-semibold">
                      {selectedClaim.user_name}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <span className="col-span-2 text-sm">{selectedClaim.user_email}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium text-gray-500">Vault Email:</span>
                    <span className="col-span-2 text-sm">{selectedClaim.vault_email}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium text-gray-500">Subscription End:</span>
                    <span className="col-span-2 text-sm font-semibold">
                      {format(new Date(selectedClaim.vault_subscription_end_date), 'PPP')}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium text-gray-500">Submitted:</span>
                    <span className="col-span-2 text-sm">
                      {format(new Date(selectedClaim.created_at), 'PPP p')}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Family Members */}
              {selectedClaim.family_members && selectedClaim.family_members.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Family Members ({selectedClaim.family_members.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedClaim.family_members.map((member, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-600">{member.email}</div>
                        <div className="text-xs text-gray-500 capitalize">
                          {member.relationship}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Review Information */}
              {selectedClaim.reviewed_at && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Review Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-sm font-medium text-gray-500">Reviewed At:</span>
                      <span className="col-span-2 text-sm">
                        {format(new Date(selectedClaim.reviewed_at), 'PPP p')}
                      </span>
                    </div>
                    {selectedClaim.admin_notes && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-sm font-medium text-gray-500">Admin Notes:</span>
                        <span className="col-span-2 text-sm">{selectedClaim.admin_notes}</span>
                      </div>
                    )}
                    {selectedClaim.rejection_reason && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-sm font-medium text-gray-500">Rejection Reason:</span>
                        <span className="col-span-2 text-sm text-red-600">
                          {selectedClaim.rejection_reason}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Claim</DialogTitle>
            <DialogDescription>
              This will grant Family Pass access to the user and send approval notification.
            </DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="font-semibold text-green-900">{selectedClaim.user_name}</div>
                <div className="text-sm text-green-700">{selectedClaim.user_email}</div>
                <div className="text-xs text-green-600 mt-2">
                  Access will be valid until:{' '}
                  {format(new Date(selectedClaim.vault_subscription_end_date), 'PPP')}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approve-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="approve-notes"
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Add any notes for the user or internal reference..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveConfirm}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving ? 'Approving...' : 'Approve Claim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Claim</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. The user will be notified.
            </DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="font-semibold text-red-900">{selectedClaim.user_name}</div>
                <div className="text-sm text-red-700">{selectedClaim.user_email}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejection-reason">
                  Rejection Reason <span className="text-red-500">*</span>
                </Label>
                <Select value={rejectionReason} onValueChange={setRejectionReason}>
                  <SelectTrigger className={!rejectionReason ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Invalid or expired vault subscription">
                      Invalid or expired vault subscription
                    </SelectItem>
                    <SelectItem value="Duplicate claim request">Duplicate claim request</SelectItem>
                    <SelectItem value="Unable to verify subscription">
                      Unable to verify subscription
                    </SelectItem>
                    <SelectItem value="Subscription details mismatch">
                      Subscription details mismatch
                    </SelectItem>
                    <SelectItem value="Other">Other (specify in notes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reject-notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="reject-notes"
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Provide additional details or instructions for the user..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectConfirm}
              disabled={isRejecting || !rejectionReason}
              variant="destructive"
            >
              {isRejecting ? 'Rejecting...' : 'Reject Claim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
