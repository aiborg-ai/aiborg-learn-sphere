import { logger } from '@/utils/logger';
/**
 * Compliance Dashboard Component
 *
 * Admin dashboard for managing compliance training requirements,
 * tracking user compliance status, and generating reports.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Download,
  Plus,
  RefreshCw,
  Bell,
  Filter,
  Search,
  Award,
  TrendingUp,
  XCircle,
} from '@/components/ui/icons';
import { useToast } from '@/hooks/use-toast';
import {
  ComplianceService,
  ComplianceRequirement,
  ComplianceSummary,
  ComplianceAuditLog,
} from '@/services/compliance';

export function ComplianceDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Data states
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [auditLog, setAuditLog] = useState<ComplianceAuditLog[]>([]);
  const [reminders, setReminders] = useState<
    Array<{
      user_id: string;
      email: string;
      requirement_title: string;
      due_date: string;
      days_until_due: number;
    }>
  >([]);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [_statusFilter, _setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRequirement, setNewRequirement] = useState({
    title: '',
    description: '',
    category: 'training' as const,
    frequency: 'annual' as const,
    renewal_period_days: 365,
    passing_score: 80,
    regulatory_body: '',
    target_roles: [] as string[],
    target_departments: [] as string[],
  });

  // Load initial data
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, requirementsData, auditData, remindersData] = await Promise.all([
        ComplianceService.getSummary(),
        ComplianceService.getRequirements(),
        ComplianceService.getAuditLog({ limit: 50 }),
        ComplianceService.getReminders(30),
      ]);

      setSummary(summaryData);
      setRequirements(requirementsData);
      setAuditLog(auditData);
      setReminders(remindersData);
    } catch (_error) {
      logger._error('Error loading compliance data:', _error);
      toast({
        title: 'Error',
        description: 'Failed to load compliance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Compliance data has been updated',
    });
  };

  const handleProcessExpiries = async () => {
    try {
      const result = await ComplianceService.processExpiries();
      toast({
        title: 'Expiries Processed',
        description: `${result.expired_count} expired, ${result.renewals_created} renewals created`,
      });
      await loadData();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to process expiries',
        variant: 'destructive',
      });
    }
  };

  const handleCreateRequirement = async () => {
    try {
      await ComplianceService.createRequirement(newRequirement);
      toast({
        title: 'Requirement Created',
        description: `"${newRequirement.title}" has been created`,
      });
      setCreateDialogOpen(false);
      setNewRequirement({
        title: '',
        description: '',
        category: 'training',
        frequency: 'annual',
        renewal_period_days: 365,
        passing_score: 80,
        regulatory_body: '',
        target_roles: [],
        target_departments: [],
      });
      await loadData();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create requirement',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const data = await ComplianceService.exportData(format);
      const blob = new Blob([data], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: `Report exported as ${format.toUpperCase()}`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  // Filter requirements
  const filteredRequirements = requirements.filter(req => {
    if (categoryFilter !== 'all' && req.category !== categoryFilter) return false;
    if (searchQuery && !req.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'overdue':
        return 'bg-red-500';
      case 'expired':
        return 'bg-orange-500';
      case 'exempted':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'training':
        return <ShieldCheck className="h-4 w-4" />;
      case 'certification':
        return <Award className="h-4 w-4" />;
      case 'policy_acknowledgment':
        return <FileText className="h-4 w-4" />;
      case 'assessment':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <ShieldCheck className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Training</h1>
          <p className="text-muted-foreground">
            Manage compliance requirements, track progress, and generate reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Requirement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Compliance Requirement</DialogTitle>
                <DialogDescription>Add a new compliance training requirement</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newRequirement.title}
                    onChange={e => setNewRequirement({ ...newRequirement, title: e.target.value })}
                    placeholder="e.g., Annual Security Training"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newRequirement.description}
                    onChange={e =>
                      setNewRequirement({ ...newRequirement, description: e.target.value })
                    }
                    placeholder="Describe the compliance requirement..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newRequirement.category}
                      onValueChange={value =>
                        setNewRequirement({
                          ...newRequirement,
                          category: value as
                            | 'training'
                            | 'certification'
                            | 'policy_acknowledgment'
                            | 'assessment',
                        })
                      }
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="certification">Certification</SelectItem>
                        <SelectItem value="policy_acknowledgment">Policy</SelectItem>
                        <SelectItem value="assessment">Assessment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={newRequirement.frequency}
                      onValueChange={value =>
                        setNewRequirement({
                          ...newRequirement,
                          frequency: value as
                            | 'once'
                            | 'quarterly'
                            | 'bi_annual'
                            | 'annual'
                            | 'custom',
                        })
                      }
                    >
                      <SelectTrigger id="frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">One-time</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="bi_annual">Bi-Annual</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="passing_score">Passing Score (%)</Label>
                    <Input
                      id="passing_score"
                      type="number"
                      min={0}
                      max={100}
                      value={newRequirement.passing_score}
                      onChange={e =>
                        setNewRequirement({
                          ...newRequirement,
                          passing_score: parseInt(e.target.value) || 80,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="regulatory_body">Regulatory Body</Label>
                    <Input
                      id="regulatory_body"
                      value={newRequirement.regulatory_body}
                      onChange={e =>
                        setNewRequirement({ ...newRequirement, regulatory_body: e.target.value })
                      }
                      placeholder="e.g., OSHA, GDPR"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRequirement} disabled={!newRequirement.title}>
                  Create Requirement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.compliance_rate.toFixed(1)}%</div>
              <Progress value={summary.compliance_rate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {summary.completed} of {summary.total_assignments} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{summary.overdue}</div>
              <p className="text-xs text-muted-foreground mt-2">Requires immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{summary.expiring_soon}</div>
              <p className="text-xs text-muted-foreground mt-2">Within the next 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <RefreshCw className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{summary.in_progress}</div>
              <p className="text-xs text-muted-foreground mt-2">Currently being completed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Requirements by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requirements by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['training', 'certification', 'policy_acknowledgment', 'assessment'].map(
                    category => {
                      const count = requirements.filter(r => r.category === category).length;
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(category)}
                            <span className="capitalize">{category.replace('_', ' ')}</span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleProcessExpiries}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Process Expired Certifications
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleExport('csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Compliance Report
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setActiveTab('reminders')}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  View Upcoming Reminders ({reminders.length})
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest compliance events and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {auditLog.slice(0, 10).map((log, index) => (
                    <div
                      key={log.id || index}
                      className="flex items-start gap-3 pb-3 border-b last:border-0"
                    >
                      <div
                        className={`p-2 rounded-full ${
                          log.action === 'completed'
                            ? 'bg-green-100 text-green-600'
                            : log.action === 'expired'
                              ? 'bg-red-100 text-red-600'
                              : log.action === 'assigned'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {log.action === 'completed' && <CheckCircle2 className="h-4 w-4" />}
                        {log.action === 'expired' && <XCircle className="h-4 w-4" />}
                        {log.action === 'assigned' && <Plus className="h-4 w-4" />}
                        {!['completed', 'expired', 'assigned'].includes(log.action) && (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">
                          {log.action.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.requirement_id &&
                            `Requirement: ${log.requirement_id.slice(0, 8)}...`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {auditLog.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No activity recorded yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requirements..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
                <SelectItem value="policy_acknowledgment">Policy</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Requirements List */}
          <div className="grid gap-4">
            {filteredRequirements.map(req => (
              <Card key={req.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {getCategoryIcon(req.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{req.title}</h3>
                        {req.description && (
                          <p className="text-sm text-muted-foreground mt-1">{req.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="capitalize">
                            {req.category.replace('_', ' ')}
                          </Badge>
                          <Badge variant="secondary" className="capitalize">
                            {req.frequency.replace('_', '-')}
                          </Badge>
                          {req.regulatory_body && (
                            <Badge variant="secondary">{req.regulatory_body}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{req.passing_score}% to pass</div>
                      <div className="text-xs text-muted-foreground">
                        {req.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredRequirements.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery || categoryFilter !== 'all'
                      ? 'No requirements match your filters'
                      : 'No compliance requirements created yet'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Reminders Tab */}
        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Reminders</CardTitle>
              <CardDescription>
                Users with compliance requirements due in the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reminders.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {reminders.map((reminder, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          reminder.days_until_due <= 7
                            ? 'border-red-200 bg-red-50'
                            : reminder.days_until_due <= 14
                              ? 'border-orange-200 bg-orange-50'
                              : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{reminder.requirement_title}</p>
                            <p className="text-sm text-muted-foreground">{reminder.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                reminder.days_until_due <= 7
                                  ? 'destructive'
                                  : reminder.days_until_due <= 14
                                    ? 'default'
                                    : 'secondary'
                              }
                            >
                              {reminder.days_until_due} days
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(reminder.due_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No upcoming reminders</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audit Log</CardTitle>
              <CardDescription>
                Complete history of compliance activities for regulatory reporting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 text-sm font-medium">Action</th>
                      <th className="text-left py-2 px-3 text-sm font-medium">User</th>
                      <th className="text-left py-2 px-3 text-sm font-medium">Details</th>
                      <th className="text-left py-2 px-3 text-sm font-medium">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map((log, index) => (
                      <tr key={log.id || index} className="border-b">
                        <td className="py-2 px-3">
                          <Badge variant="outline" className="capitalize">
                            {log.action.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-sm">{log.user_id?.slice(0, 8) || '-'}...</td>
                        <td className="py-2 px-3 text-sm text-muted-foreground">
                          {log.old_value && <span>From: {JSON.stringify(log.old_value)} </span>}
                          {log.new_value && <span>To: {JSON.stringify(log.new_value)}</span>}
                        </td>
                        <td className="py-2 px-3 text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {auditLog.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No audit entries recorded</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Reports</CardTitle>
                <CardDescription>Download compliance data for external reporting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleExport('csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleExport('json')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as JSON
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Automated Reports</CardTitle>
                <CardDescription>Schedule automatic compliance reports</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Automated reporting will be available in a future update. Configure email
                  recipients and schedule for weekly or monthly compliance summaries.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          {summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Period Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{summary.completed}</div>
                    <div className="text-sm text-green-600">Completed</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{summary.in_progress}</div>
                    <div className="text-sm text-blue-600">In Progress</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">{summary.overdue}</div>
                    <div className="text-sm text-red-600">Overdue</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ComplianceDashboard;
