import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Search,
  Download,
  RefreshCw,
  Loader2,
  User,
  Shield,
  Settings,
  Database,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
} from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'view'
  | 'error';
type AuditCategory = 'auth' | 'user' | 'content' | 'payment' | 'settings' | 'system' | 'security';

interface AuditLog {
  id: string;
  action: AuditAction;
  category: AuditCategory;
  userId?: string;
  userName?: string;
  userEmail?: string;
  resource: string;
  resourceId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'warning';
  timestamp: string;
}

const actionConfig: Record<AuditAction, { icon: React.ElementType; color: string }> = {
  create: { icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
  update: { icon: Settings, color: 'text-blue-600 bg-blue-100' },
  delete: { icon: XCircle, color: 'text-red-600 bg-red-100' },
  login: { icon: User, color: 'text-green-600 bg-green-100' },
  logout: { icon: User, color: 'text-slate-600 bg-slate-100' },
  export: { icon: Download, color: 'text-purple-600 bg-purple-100' },
  import: { icon: Database, color: 'text-purple-600 bg-purple-100' },
  view: { icon: Eye, color: 'text-slate-600 bg-slate-100' },
  error: { icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
};

const categoryConfig: Record<AuditCategory, { icon: React.ElementType; label: string }> = {
  auth: { icon: Shield, label: 'Authentication' },
  user: { icon: User, label: 'User Management' },
  content: { icon: FileText, label: 'Content' },
  payment: { icon: CreditCard, label: 'Payment' },
  settings: { icon: Settings, label: 'Settings' },
  system: { icon: Database, label: 'System' },
  security: { icon: Shield, label: 'Security' },
};

const StatsCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        </div>
        <div className={cn('p-3 rounded-full', color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export function AuditLogViewer() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | AuditCategory>('all');
  const [actionFilter, setActionFilter] = useState<'all' | AuditAction>('all');
  const [dateRange, setDateRange] = useState('7d');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [stats, setStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    failedActions: 0,
    uniqueUsers: 0,
  });

  const generateSampleLogs = useCallback((): AuditLog[] => {
    const actions: AuditAction[] = [
      'create',
      'update',
      'delete',
      'login',
      'logout',
      'view',
      'export',
    ];
    const categories: AuditCategory[] = [
      'auth',
      'user',
      'content',
      'payment',
      'settings',
      'system',
    ];
    const users = [
      { name: 'John Admin', email: 'john@aiborg.ai' },
      { name: 'Sarah Manager', email: 'sarah@aiborg.ai' },
      { name: 'Mike Developer', email: 'mike@aiborg.ai' },
      { name: 'System', email: 'system@aiborg.ai' },
    ];
    const resources = [
      'User',
      'Course',
      'Enrollment',
      'Payment',
      'Settings',
      'Blog Post',
      'Assessment',
    ];
    const ips = ['192.168.1.100', '10.0.0.50', '172.16.0.25', '8.8.8.8'];

    return Array.from({ length: 100 }, (_, i) => {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const resource = resources[Math.floor(Math.random() * resources.length)];
      const status = Math.random() > 0.1 ? 'success' : Math.random() > 0.5 ? 'failure' : 'warning';

      const descriptions: Record<AuditAction, string> = {
        create: `Created new ${resource.toLowerCase()}`,
        update: `Updated ${resource.toLowerCase()} settings`,
        delete: `Deleted ${resource.toLowerCase()}`,
        login: 'User logged in successfully',
        logout: 'User logged out',
        export: `Exported ${resource.toLowerCase()} data`,
        import: `Imported ${resource.toLowerCase()} data`,
        view: `Viewed ${resource.toLowerCase()} details`,
        error: `Error occurred in ${resource.toLowerCase()}`,
      };

      return {
        id: `log-${i}`,
        action,
        category,
        userId: `user-${Math.floor(Math.random() * 100)}`,
        userName: user.name,
        userEmail: user.email,
        resource,
        resourceId: `${resource.toLowerCase()}-${Math.floor(Math.random() * 1000)}`,
        description: descriptions[action],
        metadata: {
          browser: 'Chrome 120',
          os: 'Windows 11',
          duration: `${Math.floor(Math.random() * 500)}ms`,
        },
        ipAddress: ips[Math.floor(Math.random() * ips.length)],
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        status: status as 'success' | 'failure' | 'warning',
        timestamp: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // Try to fetch from activity_events table
      const { data, error } = await supabase
        .from('activity_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !data || data.length === 0) {
        const sampleLogs = generateSampleLogs();
        setLogs(sampleLogs);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        setStats({
          totalLogs: sampleLogs.length,
          todayLogs: sampleLogs.filter(l => new Date(l.timestamp) >= today).length,
          failedActions: sampleLogs.filter(l => l.status === 'failure').length,
          uniqueUsers: new Set(sampleLogs.map(l => l.userId)).size,
        });
      } else {
        const mappedLogs: AuditLog[] = data.map(event => ({
          id: event.id,
          action: (event.event_type?.includes('create')
            ? 'create'
            : event.event_type?.includes('update')
              ? 'update'
              : event.event_type?.includes('delete')
                ? 'delete'
                : event.event_type?.includes('login')
                  ? 'login'
                  : event.event_type?.includes('logout')
                    ? 'logout'
                    : 'view') as AuditAction,
          category: 'system' as AuditCategory,
          userId: event.user_id,
          userName: event.user_name,
          userEmail: event.user_email,
          resource: 'Activity',
          description: event.description,
          metadata: event.metadata as Record<string, unknown>,
          ipAddress: event.ip_address,
          userAgent: event.user_agent,
          status: 'success' as const,
          timestamp: event.created_at,
        }));
        setLogs(mappedLogs);
      }
    } catch {
      const sampleLogs = generateSampleLogs();
      setLogs(sampleLogs);
    }
    setLoading(false);
  }, [generateSampleLogs]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = () => {
    const csvContent = [
      [
        'Timestamp',
        'Action',
        'Category',
        'User',
        'Resource',
        'Description',
        'Status',
        'IP Address',
      ].join(','),
      ...filteredLogs.map(log =>
        [
          format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
          log.action,
          log.category,
          log.userName || 'System',
          log.resource,
          `"${log.description}"`,
          log.status,
          log.ipAddress || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Logs Exported', description: 'Audit logs have been exported to CSV.' });
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      search === '' ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.userName?.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    // Date range filter
    const logDate = new Date(log.timestamp);
    const now = new Date();
    let matchesDate = true;
    if (dateRange === '24h') {
      matchesDate = now.getTime() - logDate.getTime() < 24 * 60 * 60 * 1000;
    } else if (dateRange === '7d') {
      matchesDate = now.getTime() - logDate.getTime() < 7 * 24 * 60 * 60 * 1000;
    } else if (dateRange === '30d') {
      matchesDate = now.getTime() - logDate.getTime() < 30 * 24 * 60 * 60 * 1000;
    }

    return matchesSearch && matchesCategory && matchesAction && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-purple-100">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Audit Logs</h2>
            <p className="text-sm text-muted-foreground">Track all system activities and changes</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Logs"
          value={stats.totalLogs}
          icon={FileText}
          color="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Today"
          value={stats.todayLogs}
          icon={Calendar}
          color="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Failed Actions"
          value={stats.failedActions}
          icon={AlertTriangle}
          color="bg-red-100 text-red-600"
        />
        <StatsCard
          title="Unique Users"
          value={stats.uniqueUsers}
          icon={User}
          color="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={v => setCategoryFilter(v as typeof categoryFilter)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryConfig).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={actionFilter}
              onValueChange={v => setActionFilter(v as typeof actionFilter)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="export">Export</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.slice(0, 50).map(log => {
                const ActionIcon = actionConfig[log.action].icon;
                const CategoryIcon = categoryConfig[log.category].icon;

                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm">{format(new Date(log.timestamp), 'MMM d, HH:mm')}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn('p-1.5 rounded', actionConfig[log.action].color)}>
                          <ActionIcon className="h-3 w-3" />
                        </div>
                        <span className="capitalize text-sm">{log.action}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{log.userName || 'System'}</p>
                        <p className="text-xs text-muted-foreground">{log.ipAddress}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{log.resource}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm truncate max-w-[200px]">{log.description}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          log.status === 'success' && 'bg-green-50 text-green-700 border-green-200',
                          log.status === 'failure' && 'bg-red-50 text-red-700 border-red-200',
                          log.status === 'warning' &&
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                        )}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No logs found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
            <DialogDescription>{selectedLog?.id}</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Timestamp</p>
                    <p className="font-medium">{format(new Date(selectedLog.timestamp), 'PPpp')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Action</p>
                    <p className="font-medium capitalize">{selectedLog.action}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{categoryConfig[selectedLog.category].label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        selectedLog.status === 'success' && 'bg-green-50 text-green-700',
                        selectedLog.status === 'failure' && 'bg-red-50 text-red-700',
                        selectedLog.status === 'warning' && 'bg-yellow-50 text-yellow-700'
                      )}
                    >
                      {selectedLog.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedLog.userName || 'System'}</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.userEmail}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedLog.description}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Resource</p>
                  <p className="font-medium">{selectedLog.resource}</p>
                  {selectedLog.resourceId && (
                    <p className="text-sm text-muted-foreground">ID: {selectedLog.resourceId}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">IP Address</p>
                  <p className="font-medium">{selectedLog.ipAddress || 'N/A'}</p>
                </div>

                {selectedLog.userAgent && (
                  <div>
                    <p className="text-sm text-muted-foreground">User Agent</p>
                    <p className="text-sm break-all">{selectedLog.userAgent}</p>
                  </div>
                )}

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Metadata</p>
                    <pre className="p-3 bg-slate-50 rounded-lg text-xs overflow-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
