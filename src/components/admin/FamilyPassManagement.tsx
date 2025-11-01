/**
 * FamilyPassManagement Component
 *
 * Admin interface for managing Family Pass grants
 * Features:
 * - View all grants with user details
 * - Grant Family Pass to users (individual or bulk)
 * - Revoke/deactivate grants
 * - Edit grant dates
 * - Extend grants
 * - Status badges and filtering
 */

import { useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Crown,
  Search,
  Plus,
  X,
  Edit,
  Calendar,
  User,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { useAdminFamilyPass, type FamilyPassGrant } from '@/hooks/useAdminFamilyPass';
import { format, differenceInDays, addMonths } from 'date-fns';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getStatusBadge = (grant: FamilyPassGrant) => {
  const now = new Date();
  const endDate = new Date(grant.end_date);
  const daysRemaining = differenceInDays(endDate, now);

  if (grant.status === 'inactive') {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="w-3 h-3" />
        Inactive
      </Badge>
    );
  }

  if (daysRemaining < 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <Clock className="w-3 h-3" />
        Expired
      </Badge>
    );
  }

  if (daysRemaining <= 7) {
    return (
      <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700 bg-yellow-50">
        <Clock className="w-3 h-3" />
        Expiring Soon ({daysRemaining}d)
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="gap-1 bg-green-600">
      <CheckCircle2 className="w-3 h-3" />
      Active ({daysRemaining}d)
    </Badge>
  );
};

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch {
    return 'Invalid Date';
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FamilyPassManagement() {
  const {
    grants,
    isLoading,
    grantFamilyPass,
    revokeFamilyPass,
    bulkGrant: _bulkGrant,
    bulkRevoke,
    updateDates,
    extendGrant,
    isGranting,
    isRevoking: _isRevoking,
    isBulkGranting: _isBulkGranting,
    isBulkRevoking,
    isUpdatingDates,
  } = useAdminFamilyPass();

  // ============================================================================
  // STATE
  // ============================================================================

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedGrantIds, setSelectedGrantIds] = useState<string[]>([]);

  // Grant modal state
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantUserEmail, setGrantUserEmail] = useState('');
  const [grantStartDate, setGrantStartDate] = useState('');
  const [grantEndDate, setGrantEndDate] = useState('');
  const [grantNotes, setGrantNotes] = useState('');

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGrant, setEditingGrant] = useState<FamilyPassGrant | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  // ============================================================================
  // FILTERED DATA
  // ============================================================================

  const filteredGrants = useMemo(() => {
    let filtered = grants;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        grant =>
          grant.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          grant.user_display_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(grant => grant.status === statusFilter);
    }

    return filtered;
  }, [grants, searchTerm, statusFilter]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedGrantIds(filteredGrants.map(g => g.id));
    } else {
      setSelectedGrantIds([]);
    }
  };

  const handleSelectGrant = (grantId: string, checked: boolean) => {
    if (checked) {
      setSelectedGrantIds(prev => [...prev, grantId]);
    } else {
      setSelectedGrantIds(prev => prev.filter(id => id !== grantId));
    }
  };

  const handleOpenGrantModal = () => {
    const today = new Date();
    const nextMonth = addMonths(today, 1);

    setGrantStartDate(format(today, 'yyyy-MM-dd'));
    setGrantEndDate(format(nextMonth, 'yyyy-MM-dd'));
    setGrantNotes('');
    setGrantUserId('');
    setGrantUserEmail('');
    setIsGrantModalOpen(true);
  };

  const handleGrantSubmit = async () => {
    if (!grantUserId || !grantStartDate || !grantEndDate) {
      return;
    }

    try {
      await grantFamilyPass({
        userId: grantUserId,
        startDate: new Date(grantStartDate),
        endDate: new Date(grantEndDate),
        notes: grantNotes || undefined,
      });
      setIsGrantModalOpen(false);
    } catch {
      // Error handled by hook
    }
  };

  const handleOpenEditModal = (grant: FamilyPassGrant) => {
    setEditingGrant(grant);
    setEditStartDate(format(new Date(grant.start_date), 'yyyy-MM-dd'));
    setEditEndDate(format(new Date(grant.end_date), 'yyyy-MM-dd'));
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingGrant || !editStartDate || !editEndDate) {
      return;
    }

    try {
      await updateDates({
        grantId: editingGrant.id,
        startDate: new Date(editStartDate),
        endDate: new Date(editEndDate),
      });
      setIsEditModalOpen(false);
    } catch {
      // Error handled by hook
    }
  };

  const handleRevoke = async (grantId: string) => {
    if (!confirm('Are you sure you want to revoke this Family Pass grant?')) {
      return;
    }

    try {
      await revokeFamilyPass({ grantId });
    } catch {
      // Error handled by hook
    }
  };

  const handleExtend = async (grantId: string) => {
    try {
      await extendGrant(grantId, 1); // Extend by 1 month
    } catch {
      // Error handled by hook
    }
  };

  const handleBulkRevoke = async () => {
    if (selectedGrantIds.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to revoke Family Pass for ${selectedGrantIds.length} user(s)?`
      )
    ) {
      return;
    }

    try {
      await bulkRevoke(selectedGrantIds);
      setSelectedGrantIds([]);
    } catch {
      // Error handled by hook
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <Card className="bg-white/95 backdrop-blur">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Crown className="h-6 w-6 text-amber-500" />
              Family Pass Management
            </CardTitle>
            <CardDescription className="mt-2">
              Manually grant and manage Family Pass subscriptions
            </CardDescription>
          </div>
          <Button onClick={handleOpenGrantModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Grant Family Pass
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters and Bulk Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user email or name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(v: string) => setStatusFilter(v as 'all' | 'active' | 'inactive')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Bulk Actions */}
          {selectedGrantIds.length > 0 && (
            <div className="flex gap-2">
              <Badge variant="secondary" className="px-3 py-1">
                {selectedGrantIds.length} selected
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkRevoke}
                disabled={isBulkRevoking}
              >
                {isBulkRevoking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Revoke Selected</>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filteredGrants.length > 0 && selectedGrantIds.length === filteredGrants.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Granted By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGrants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No Family Pass grants found
                  </TableCell>
                </TableRow>
              ) : (
                filteredGrants.map(grant => (
                  <TableRow key={grant.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedGrantIds.includes(grant.id)}
                        onCheckedChange={checked => handleSelectGrant(grant.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{grant.user_display_name}</div>
                          <div className="text-sm text-muted-foreground">{grant.user_email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(grant)}</TableCell>
                    <TableCell className="text-sm">{formatDate(grant.start_date)}</TableCell>
                    <TableCell className="text-sm">{formatDate(grant.end_date)}</TableCell>
                    <TableCell className="text-sm">{grant.granted_by_name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {grant.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEditModal(grant)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExtend(grant.id)}
                            >
                              <Calendar className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRevoke(grant.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Grant Modal */}
      <Dialog open={isGrantModalOpen} onOpenChange={setIsGrantModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Grant Family Pass
            </DialogTitle>
            <DialogDescription>
              Grant manual Family Pass access to a user. Default period is 1 month.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-id">User ID *</Label>
              <Input
                id="user-id"
                placeholder="UUID of the user"
                value={grantUserId}
                onChange={e => setGrantUserId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">User Email (for reference)</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="user@example.com"
                value={grantUserEmail}
                onChange={e => setGrantUserEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={grantStartDate}
                  onChange={e => setGrantStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={grantEndDate}
                  onChange={e => setGrantEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Reason for granting access, promotional campaign, etc."
                value={grantNotes}
                onChange={e => setGrantNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGrantModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGrantSubmit} disabled={isGranting}>
              {isGranting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Grant Family Pass</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dates Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Family Pass Dates
            </DialogTitle>
            <DialogDescription>
              Update the start and end dates for this Family Pass grant
            </DialogDescription>
          </DialogHeader>

          {editingGrant && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="font-medium">{editingGrant.user_display_name}</div>
                <div className="text-muted-foreground">{editingGrant.user_email}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start-date">Start Date</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={editStartDate}
                    onChange={e => setEditStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-end-date">End Date</Label>
                  <Input
                    id="edit-end-date"
                    type="date"
                    value={editEndDate}
                    onChange={e => setEditEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isUpdatingDates}>
              {isUpdatingDates ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Update Dates</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
