import { useState } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { logger } from '@/utils/logger';
import { Search, Shield, UserCog, UserCheck, AlertTriangle, Users } from '@/components/ui/icons';

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  phone: string | null;
  learning_style: string | null;
  created_at: string;
  updated_at: string;
  status?: 'active' | 'suspended' | 'banned';
}

interface RoleManagementPanelProps {
  users: UserProfile[];
  onRefresh: () => void;
}

const roleColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  admin: 'destructive',
  instructor: 'secondary',
  student: 'default',
};

const roleIcons = {
  admin: Shield,
  instructor: UserCog,
  student: UserCheck,
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  suspended: 'secondary',
  banned: 'destructive',
};

export function RoleManagementPanel({ users, onRefresh }: RoleManagementPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { logUserRoleChange } = useAuditLogs();

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleRoleChangeRequest = (user: UserProfile) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleDialog(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    setLoading(true);
    try {
      const oldRole = selectedUser.role;

      // Update user role in database
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Log the audit trail
      await logUserRoleChange(selectedUser.id, oldRole, newRole);

      toast({
        title: 'Role Updated',
        description: `${selectedUser.display_name || selectedUser.email}'s role changed from ${oldRole} to ${newRole}`,
      });

      setShowRoleDialog(false);
      setSelectedUser(null);
      onRefresh();
    } catch (_error) {
      logger.error('Error updating user role:', _error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleCounts = () => {
    return {
      total: users.length,
      admin: users.filter(u => u.role === 'admin').length,
      instructor: users.filter(u => u.role === 'instructor').length,
      student: users.filter(u => u.role === 'student').length,
    };
  };

  const roleCounts = getRoleCounts();

  return (
    <>
      <Card className="bg-white/95 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Role Management
          </CardTitle>
          <CardDescription>Manage user roles and permissions across the platform</CardDescription>

          {/* Role Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">{roleCounts.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-red-600">{roleCounts.admin}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Instructors</p>
                  <p className="text-2xl font-bold text-purple-600">{roleCounts.instructor}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Students</p>
                  <p className="text-2xl font-bold text-green-600">{roleCounts.student}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(user => {
                    const RoleIcon = roleIcons[user.role as keyof typeof roleIcons] || UserCheck;

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <RoleIcon className="h-4 w-4 text-gray-500" />
                            {user.display_name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>{user.email || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={roleColors[user.role]}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[user.status || 'active']}>
                            {user.status || 'active'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoleChangeRequest(user)}
                          >
                            Change Role
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change the role for{' '}
              <strong>{selectedUser?.display_name || selectedUser?.email}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <label htmlFor="new-role-select" className="text-sm font-medium mb-2 block">
              Select New Role
            </label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger id="new-role-select">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Role Permissions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>
                      <strong>Admin:</strong> Full access to all features and settings
                    </li>
                    <li>
                      <strong>Instructor:</strong> Can create and manage courses
                    </li>
                    <li>
                      <strong>Student:</strong> Can enroll and access courses
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleChange}
              disabled={loading || !newRole || newRole === selectedUser?.role}
            >
              {loading ? 'Updating...' : 'Confirm Change'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
