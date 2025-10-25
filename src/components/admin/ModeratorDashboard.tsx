/**
 * Moderator Dashboard
 * Unified dashboard for all moderation activities
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForumModeration, useModeratorAssignment } from '@/hooks/forum/useForumModeration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Eye,
  Flag,
  Loader2,
  Shield,
  ShieldAlert,
  Trash2,
  XCircle,
  History,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type {
  ForumReportWithDetails,
  ForumModeratorAction,
  ForumBan,
  ForumWarning,
} from '@/types/forum';

export function ModeratorDashboard() {
  const {
    isModerator,
    isCheckingModerator,
    pendingReports,
    moderatorActions,
    isLoadingReports,
    isLoadingActions,
    reviewReport,
    banUser,
    warnUser,
    deleteThread,
    deletePost,
    isBanning,
    isWarning,
  } = useForumModeration();

  const { moderators, isLoading: isLoadingModerators } = useModeratorAssignment();

  // State for action dialogs
  const [selectedReport, setSelectedReport] = useState<ForumReportWithDetails | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [warnDialogOpen, setWarnDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  // Form states
  const [banForm, setBanForm] = useState({
    ban_type: 'temporary' as 'temporary' | 'permanent' | 'shadow',
    reason: '',
    end_date: '',
    notes: '',
  });

  const [warnForm, setWarnForm] = useState({
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    reason: '',
    description: '',
  });

  // Get active bans
  const { data: activeBans = [], isLoading: isLoadingBans } = useQuery({
    queryKey: ['forum', 'active-bans'],
    queryFn: async () => {
      const { data } = await supabase
        .from('forum_bans')
        .select(
          `
          *,
          user:profiles!user_id(id, email, full_name),
          banned_by_user:profiles!banned_by(id, email, full_name)
        `
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!isModerator,
  });

  // Get recent warnings
  const { data: recentWarnings = [], isLoading: isLoadingWarnings } = useQuery({
    queryKey: ['forum', 'recent-warnings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('forum_warnings')
        .select(
          `
          *,
          user:profiles!user_id(id, email, full_name),
          issued_by_user:profiles!issued_by(id, email, full_name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!isModerator,
  });

  // Loading states
  if (isCheckingModerator) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not a moderator
  if (!isModerator) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Access Denied
          </CardTitle>
          <CardDescription>
            You do not have moderator permissions. Contact an administrator if you believe this is
            an error.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Handle report review
  const handleReviewReport = (
    reportId: string,
    status: 'reviewed' | 'actioned' | 'dismissed',
    actionTaken?: string
  ) => {
    reviewReport(
      { reportId, status, actionTaken },
      {
        onSuccess: () => {
          setActionDialogOpen(false);
          setSelectedReport(null);
        },
      }
    );
  };

  // Handle ban user
  const handleBanUser = () => {
    if (!selectedUserId) return;

    banUser(
      {
        user_id: selectedUserId,
        ban_type: banForm.ban_type,
        reason: banForm.reason,
        end_date: banForm.end_date || undefined,
        notes: banForm.notes || undefined,
      },
      {
        onSuccess: () => {
          setBanDialogOpen(false);
          setBanForm({ ban_type: 'temporary', reason: '', end_date: '', notes: '' });
          setSelectedUserId('');
        },
      }
    );
  };

  // Handle warn user
  const handleWarnUser = () => {
    if (!selectedUserId) return;

    warnUser(
      {
        user_id: selectedUserId,
        severity: warnForm.severity,
        reason: warnForm.reason,
        description: warnForm.description || undefined,
      },
      {
        onSuccess: () => {
          setWarnDialogOpen(false);
          setWarnForm({ severity: 'medium', reason: '', description: '' });
          setSelectedUserId('');
        },
      }
    );
  };

  // Calculate statistics
  const stats = {
    pendingReports: pendingReports.length,
    activeBans: activeBans.length,
    recentWarnings: recentWarnings.filter(
      (w: ForumWarning) => new Date(w.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
    actionsToday: moderatorActions.filter(
      (a: ForumModeratorAction) =>
        new Date(a.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-white">Moderator Dashboard</h1>
            <p className="text-sm text-white/70">
              Manage reports, bans, warnings, and user content
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Pending Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.pendingReports}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Active Bans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.activeBans}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Warnings (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.recentWarnings}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <History className="h-4 w-4" />
              Actions Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.actionsToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList className="bg-white/10 border-white/20">
          <TabsTrigger value="reports" className="data-[state=active]:bg-white/20">
            <Flag className="h-4 w-4 mr-2" />
            Reports Queue ({stats.pendingReports})
          </TabsTrigger>
          <TabsTrigger value="actions" className="data-[state=active]:bg-white/20">
            <History className="h-4 w-4 mr-2" />
            Actions Log
          </TabsTrigger>
          <TabsTrigger value="bans" className="data-[state=active]:bg-white/20">
            <Ban className="h-4 w-4 mr-2" />
            Active Bans
          </TabsTrigger>
          <TabsTrigger value="warnings" className="data-[state=active]:bg-white/20">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Warnings
          </TabsTrigger>
          <TabsTrigger value="moderators" className="data-[state=active]:bg-white/20">
            <Users className="h-4 w-4 mr-2" />
            Moderators
          </TabsTrigger>
        </TabsList>

        {/* Reports Queue Tab */}
        <TabsContent value="reports">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Pending Reports</CardTitle>
              <CardDescription>Review and take action on user-submitted reports</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingReports ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : pendingReports.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>No pending reports. Great job!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white/70">Type</TableHead>
                      <TableHead className="text-white/70">Content</TableHead>
                      <TableHead className="text-white/70">Reason</TableHead>
                      <TableHead className="text-white/70">Reporter</TableHead>
                      <TableHead className="text-white/70">Reported User</TableHead>
                      <TableHead className="text-white/70">Date</TableHead>
                      <TableHead className="text-white/70">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReports.map((report: ForumReportWithDetails) => (
                      <TableRow key={report.id} className="border-white/10">
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {report.reportable_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white max-w-md truncate">
                          {report.content_preview || 'No preview'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              report.reason === 'spam' || report.reason === 'harassment'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {report.reason}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/80">
                          {report.reporter?.full_name || report.reporter?.email || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-white/80">
                          {report.reported_user?.full_name ||
                            report.reported_user?.email ||
                            'Unknown'}
                        </TableCell>
                        <TableCell className="text-white/60 text-sm">
                          {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog
                              open={actionDialogOpen && selectedReport?.id === report.id}
                              onOpenChange={open => {
                                setActionDialogOpen(open);
                                if (open) {
                                  setSelectedReport(report);
                                } else {
                                  setSelectedReport(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-gray-900 text-white border-white/20">
                                <DialogHeader>
                                  <DialogTitle>Review Report</DialogTitle>
                                  <DialogDescription>
                                    Take action on this reported content
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Report Type</Label>
                                    <p className="text-sm text-white/80">
                                      {report.reportable_type} - {report.reason}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Content Preview</Label>
                                    <p className="text-sm text-white/80">
                                      {report.content_preview || 'No preview available'}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Reporter Notes</Label>
                                    <p className="text-sm text-white/80">
                                      {report.description || 'No additional notes'}
                                    </p>
                                  </div>
                                </div>
                                <DialogFooter className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => handleReviewReport(report.id, 'dismissed')}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Dismiss
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      if (report.reportable_type === 'thread') {
                                        deleteThread(
                                          { threadId: report.reportable_id, reason: report.reason },
                                          {
                                            onSuccess: () => {
                                              handleReviewReport(
                                                report.id,
                                                'actioned',
                                                'Thread deleted'
                                              );
                                            },
                                          }
                                        );
                                      } else if (report.reportable_type === 'post') {
                                        deletePost(
                                          { postId: report.reportable_id, reason: report.reason },
                                          {
                                            onSuccess: () => {
                                              handleReviewReport(
                                                report.id,
                                                'actioned',
                                                'Post deleted'
                                              );
                                            },
                                          }
                                        );
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete Content
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setSelectedUserId(report.reported_user_id);
                                      setWarnDialogOpen(true);
                                      setActionDialogOpen(false);
                                    }}
                                  >
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    Warn User
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedUserId(report.reported_user_id);
                                      setBanDialogOpen(true);
                                      setActionDialogOpen(false);
                                    }}
                                  >
                                    <Ban className="h-4 w-4 mr-1" />
                                    Ban User
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Log Tab */}
        <TabsContent value="actions">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Moderation Actions Log</CardTitle>
              <CardDescription>Recent moderation actions taken by all moderators</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingActions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : moderatorActions.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <History className="h-12 w-12 mx-auto mb-3" />
                  <p>No moderation actions yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white/70">Action</TableHead>
                      <TableHead className="text-white/70">Target</TableHead>
                      <TableHead className="text-white/70">Moderator</TableHead>
                      <TableHead className="text-white/70">Reason</TableHead>
                      <TableHead className="text-white/70">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {moderatorActions.slice(0, 50).map(
                      (
                        action: ForumModeratorAction & {
                          moderator?: { full_name?: string; email?: string };
                        }
                      ) => (
                        <TableRow key={action.id} className="border-white/10">
                          <TableCell>
                            <Badge>{action.action_type.replace('_', ' ')}</Badge>
                          </TableCell>
                          <TableCell className="text-white/80">
                            {action.target_type || 'N/A'} ({action.target_id?.substring(0, 8)}...)
                          </TableCell>
                          <TableCell className="text-white/80">
                            {action.moderator?.full_name || action.moderator?.email || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-white/60 text-sm max-w-md truncate">
                            {action.reason || 'No reason provided'}
                          </TableCell>
                          <TableCell className="text-white/60 text-sm">
                            {formatDistanceToNow(new Date(action.created_at), {
                              addSuffix: true,
                            })}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Bans Tab */}
        <TabsContent value="bans">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Active Bans</CardTitle>
              <CardDescription>Currently banned users across the forum</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBans ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : activeBans.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>No active bans</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white/70">User</TableHead>
                      <TableHead className="text-white/70">Ban Type</TableHead>
                      <TableHead className="text-white/70">Reason</TableHead>
                      <TableHead className="text-white/70">Banned By</TableHead>
                      <TableHead className="text-white/70">Expires</TableHead>
                      <TableHead className="text-white/70">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeBans.map(
                      (
                        ban: ForumBan & {
                          user?: { full_name?: string; email?: string };
                          banned_by_user?: { full_name?: string; email?: string };
                        }
                      ) => (
                        <TableRow key={ban.id} className="border-white/10">
                          <TableCell className="text-white">
                            {ban.user?.full_name || ban.user?.email || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={ban.ban_type === 'permanent' ? 'destructive' : 'secondary'}
                            >
                              {ban.ban_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white/80 max-w-md truncate">
                            {ban.reason}
                          </TableCell>
                          <TableCell className="text-white/60 text-sm">
                            {ban.banned_by_user?.full_name ||
                              ban.banned_by_user?.email ||
                              'Unknown'}
                          </TableCell>
                          <TableCell className="text-white/60 text-sm">
                            {ban.end_date
                              ? formatDistanceToNow(new Date(ban.end_date), { addSuffix: true })
                              : 'Never'}
                          </TableCell>
                          <TableCell className="text-white/60 text-sm">
                            {formatDistanceToNow(new Date(ban.created_at), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Warnings Tab */}
        <TabsContent value="warnings">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Recent Warnings</CardTitle>
              <CardDescription>Warnings issued to users for policy violations</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingWarnings ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : recentWarnings.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>No warnings issued</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white/70">User</TableHead>
                      <TableHead className="text-white/70">Severity</TableHead>
                      <TableHead className="text-white/70">Reason</TableHead>
                      <TableHead className="text-white/70">Issued By</TableHead>
                      <TableHead className="text-white/70">Acknowledged</TableHead>
                      <TableHead className="text-white/70">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentWarnings.map(
                      (
                        warning: ForumWarning & {
                          user?: { full_name?: string; email?: string };
                          issued_by_user?: { full_name?: string; email?: string };
                        }
                      ) => (
                        <TableRow key={warning.id} className="border-white/10">
                          <TableCell className="text-white">
                            {warning.user?.full_name || warning.user?.email || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                warning.severity === 'critical' || warning.severity === 'high'
                                  ? 'destructive'
                                  : warning.severity === 'medium'
                                    ? 'secondary'
                                    : 'outline'
                              }
                            >
                              {warning.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white/80 max-w-md truncate">
                            {warning.reason}
                          </TableCell>
                          <TableCell className="text-white/60 text-sm">
                            {warning.issued_by_user?.full_name ||
                              warning.issued_by_user?.email ||
                              'Unknown'}
                          </TableCell>
                          <TableCell>
                            {warning.is_acknowledged ? (
                              <Badge variant="outline" className="text-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-500">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-white/60 text-sm">
                            {formatDistanceToNow(new Date(warning.created_at), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Moderators Tab */}
        <TabsContent value="moderators">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Forum Moderators</CardTitle>
              <CardDescription>Manage moderator assignments and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingModerators ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : moderators.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <Users className="h-12 w-12 mx-auto mb-3" />
                  <p>No moderators assigned</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white/70">Moderator</TableHead>
                      <TableHead className="text-white/70">Category</TableHead>
                      <TableHead className="text-white/70">Permissions</TableHead>
                      <TableHead className="text-white/70">Assigned By</TableHead>
                      <TableHead className="text-white/70">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {moderators.map((mod: any) => (
                      <TableRow key={mod.id} className="border-white/10">
                        <TableCell className="text-white">
                          {mod.user?.full_name || mod.user?.email || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={mod.category_id ? 'secondary' : 'outline'}>
                            {mod.category?.name || 'Global'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/60 text-sm">
                          {Object.entries(mod.permissions || {})
                            .filter(([_, value]) => value)
                            .map(([key]) => key)
                            .join(', ') || 'None'}
                        </TableCell>
                        <TableCell className="text-white/60 text-sm">
                          {mod.assigned_by_user?.full_name ||
                            mod.assigned_by_user?.email ||
                            'Unknown'}
                        </TableCell>
                        <TableCell className="text-white/60 text-sm">
                          {formatDistanceToNow(new Date(mod.assigned_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-white/20">
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Issue a ban to a user for violating community guidelines
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ban-type">Ban Type</Label>
              <Select
                value={banForm.ban_type}
                onValueChange={(value: 'temporary' | 'permanent' | 'shadow') =>
                  setBanForm({ ...banForm, ban_type: value })
                }
              >
                <SelectTrigger id="ban-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">Temporary</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="shadow">Shadow Ban</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {banForm.ban_type === 'temporary' && (
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="datetime-local"
                  value={banForm.end_date}
                  onChange={e => setBanForm({ ...banForm, end_date: e.target.value })}
                />
              </div>
            )}

            <div>
              <Label htmlFor="ban-reason">Reason (Required)</Label>
              <Input
                id="ban-reason"
                value={banForm.reason}
                onChange={e => setBanForm({ ...banForm, reason: e.target.value })}
                placeholder="Reason for ban"
              />
            </div>

            <div>
              <Label htmlFor="ban-notes">Additional Notes</Label>
              <Textarea
                id="ban-notes"
                value={banForm.notes}
                onChange={e => setBanForm({ ...banForm, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBanUser}
              disabled={isBanning || !banForm.reason}
            >
              {isBanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Banning...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Ban User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warn User Dialog */}
      <Dialog open={warnDialogOpen} onOpenChange={setWarnDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-white/20">
          <DialogHeader>
            <DialogTitle>Warn User</DialogTitle>
            <DialogDescription>
              Issue a warning to a user (auto-ban after 3 warnings)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="warn-severity">Severity</Label>
              <Select
                value={warnForm.severity}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') =>
                  setWarnForm({ ...warnForm, severity: value })
                }
              >
                <SelectTrigger id="warn-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="warn-reason">Reason (Required)</Label>
              <Input
                id="warn-reason"
                value={warnForm.reason}
                onChange={e => setWarnForm({ ...warnForm, reason: e.target.value })}
                placeholder="Reason for warning"
              />
            </div>

            <div>
              <Label htmlFor="warn-description">Description</Label>
              <Textarea
                id="warn-description"
                value={warnForm.description}
                onChange={e => setWarnForm({ ...warnForm, description: e.target.value })}
                placeholder="Optional additional details"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleWarnUser} disabled={isWarning || !warnForm.reason}>
              {isWarning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Warning...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Issue Warning
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add missing supabase import
import { supabase } from '@/integrations/supabase/client';
