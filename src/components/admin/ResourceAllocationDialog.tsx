import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { Search, Calendar, UserCheck, Loader2 } from '@/components/ui/icons';
import { type AdminResource } from '@/hooks/useResourcesManagement';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  role: string;
}

interface ResourceAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: AdminResource;
  onAllocate: (
    resourceId: string,
    userIds: string[],
    options?: { expires_at?: string; notes?: string }
  ) => Promise<void>;
}

export function ResourceAllocationDialog({
  open,
  onOpenChange,
  resource,
  onAllocate,
}: ResourceAllocationDialogProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      fetchUsers();
    } else {
      // Reset state when dialog closes
      setSelectedUsers(new Set());
      setExpiresAt('');
      setNotes('');
      setSearchTerm('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchUsers is stable
  }, [open]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      logger.log('🔄 Fetching users for allocation...');

      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, email, role')
        .order('display_name', { ascending: true });

      if (error) throw error;

      logger.log(`✅ Fetched ${data?.length || 0} users`);
      setUsers(data || []);
    } catch (_error) {
      logger._error('❌ Error fetching users:', _error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.user_id)));
    }
  };

  const handleAllocate = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: 'No Users Selected',
        description: 'Please select at least one user',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAllocating(true);

      const options: { expires_at?: string; notes?: string } = {};
      if (expiresAt) {
        options.expires_at = new Date(expiresAt).toISOString();
      }
      if (notes) {
        options.notes = notes;
      }

      await onAllocate(resource.id, Array.from(selectedUsers), options);

      toast({
        title: 'Resource Allocated',
        description: `Successfully allocated to ${selectedUsers.size} user(s)`,
      });

      onOpenChange(false);
    } catch (_error) {
      logger._error('Error allocating resource:', _error);
      toast({
        title: 'Allocation Failed',
        description: 'Failed to allocate resource',
        variant: 'destructive',
      });
    } finally {
      setAllocating(false);
    }
  };

  const filteredUsers = users.filter(
    user =>
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Allocate Resource to Users</DialogTitle>
          <DialogDescription>Assign "{resource.title}" to specific users</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Select All */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={handleSelectAll} size="sm">
              {selectedUsers.size === filteredUsers.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* Selected Count */}
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
              </span>
            </div>
          )}

          {/* User List */}
          <div className="border rounded-lg">
            <ScrollArea className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No users found
                </div>
              ) : (
                <div className="divide-y">
                  {filteredUsers.map(user => (
                    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- Interactive list item with button role, has proper keyboard support and ARIA
                    <div
                      key={user.user_id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleToggleUser(user.user_id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleUser(user.user_id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <Checkbox
                        checked={selectedUsers.has(user.user_id)}
                        onCheckedChange={() => handleToggleUser(user.user_id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{user.display_name || 'No Name'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label htmlFor="expires_at" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Expiration Date (Optional)
            </Label>
            <Input
              id="expires_at"
              type="datetime-local"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
            />
            <p className="text-xs text-gray-500">Leave empty for permanent access</p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes about this allocation..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={allocating}>
            Cancel
          </Button>
          <Button onClick={handleAllocate} disabled={allocating || selectedUsers.size === 0}>
            {allocating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Allocating...
              </>
            ) : (
              <>
                Allocate to {selectedUsers.size} User{selectedUsers.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
