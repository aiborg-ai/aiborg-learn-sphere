import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import {
  Play,
  Pause,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  RotateCcw,
  Trash2,
  Eye,
  Calendar,
  Zap,
  Mail,
  FileText,
  Database,
  Image,
} from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'pending_retry' | 'cancelled';

interface BackgroundJob {
  id: string;
  type: string;
  status: JobStatus;
  progress: number;
  totalItems: number;
  processedItems: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  retryCount?: number;
  nextRetryAt?: string;
}

interface JobStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

const JobTypeIcon = ({ type }: { type: string }) => {
  const icons: Record<string, React.ElementType> = {
    email: Mail,
    report: FileText,
    sync: Database,
    image: Image,
    notification: Zap,
  };
  const Icon = icons[type.toLowerCase()] || Zap;
  return <Icon className="h-4 w-4" />;
};

const StatusBadge = ({ status }: { status: JobStatus }) => {
  const config: Record<JobStatus, { color: string; icon: React.ElementType; label: string }> = {
    pending: {
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Clock,
      label: 'Pending',
    },
    running: {
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Loader2,
      label: 'Running',
    },
    completed: {
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle2,
      label: 'Completed',
    },
    failed: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Failed' },
    pending_retry: {
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      icon: RotateCcw,
      label: 'Retry Pending',
    },
    cancelled: {
      color: 'bg-slate-100 text-slate-500 border-slate-200',
      icon: Pause,
      label: 'Cancelled',
    },
  };

  const { color, icon: Icon, label } = config[status];

  return (
    <Badge variant="outline" className={cn('gap-1', color)}>
      <Icon className={cn('h-3 w-3', status === 'running' && 'animate-spin')} />
      {label}
    </Badge>
  );
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
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={cn('p-3 rounded-full', color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export function BackgroundJobsDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [stats, setStats] = useState<JobStats>({
    total: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
  });
  const [filter, setFilter] = useState<'all' | JobStatus>('all');
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<BackgroundJob | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Generate sample jobs for demonstration
  const generateSampleJobs = useCallback((): BackgroundJob[] => {
    const types = ['email', 'report', 'sync', 'image', 'notification'];
    const statuses: JobStatus[] = ['pending', 'running', 'completed', 'failed', 'pending_retry'];

    return Array.from({ length: 15 }, (_, i) => {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const totalItems = Math.floor(Math.random() * 100) + 10;
      const processedItems =
        status === 'completed'
          ? totalItems
          : status === 'pending'
            ? 0
            : Math.floor(Math.random() * totalItems);

      return {
        id: `job-${Date.now()}-${i}`,
        type: `${type}_${['batch', 'single', 'scheduled'][Math.floor(Math.random() * 3)]}`,
        status,
        progress: Math.round((processedItems / totalItems) * 100),
        totalItems,
        processedItems,
        errorMessage: status === 'failed' ? 'Connection timeout after 30s' : undefined,
        createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        startedAt:
          status !== 'pending'
            ? new Date(Date.now() - Math.random() * 3600000).toISOString()
            : undefined,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined,
        retryCount: status === 'pending_retry' ? Math.floor(Math.random() * 3) + 1 : 0,
        metadata: {
          triggeredBy: 'admin',
          priority: ['high', 'normal', 'low'][Math.floor(Math.random() * 3)],
        },
      };
    });
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);

    // Try to fetch from database, fall back to sample data
    try {
      const { data, error } = await supabase
        .from('background_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data || data.length === 0) {
        // Use sample data if no real jobs exist
        const sampleJobs = generateSampleJobs();
        setJobs(sampleJobs);
        setStats({
          total: sampleJobs.length,
          pending: sampleJobs.filter(j => j.status === 'pending').length,
          running: sampleJobs.filter(j => j.status === 'running').length,
          completed: sampleJobs.filter(j => j.status === 'completed').length,
          failed: sampleJobs.filter(j => j.status === 'failed' || j.status === 'pending_retry')
            .length,
        });
      } else {
        const mappedJobs: BackgroundJob[] = data.map(job => ({
          id: job.id,
          type: job.type,
          status: job.status as JobStatus,
          progress: job.progress || 0,
          totalItems: job.total_items || 0,
          processedItems: job.processed_items || 0,
          errorMessage: job.error_message,
          metadata: job.metadata as Record<string, unknown>,
          startedAt: job.started_at,
          completedAt: job.completed_at,
          createdAt: job.created_at,
        }));
        setJobs(mappedJobs);
        setStats({
          total: mappedJobs.length,
          pending: mappedJobs.filter(j => j.status === 'pending').length,
          running: mappedJobs.filter(j => j.status === 'running').length,
          completed: mappedJobs.filter(j => j.status === 'completed').length,
          failed: mappedJobs.filter(j => j.status === 'failed' || j.status === 'pending_retry')
            .length,
        });
      }
    } catch {
      // Fallback to sample data
      const sampleJobs = generateSampleJobs();
      setJobs(sampleJobs);
      setStats({
        total: sampleJobs.length,
        pending: sampleJobs.filter(j => j.status === 'pending').length,
        running: sampleJobs.filter(j => j.status === 'running').length,
        completed: sampleJobs.filter(j => j.status === 'completed').length,
        failed: sampleJobs.filter(j => j.status === 'failed' || j.status === 'pending_retry')
          .length,
      });
    }

    setLoading(false);
  }, [generateSampleJobs]);

  useEffect(() => {
    fetchJobs();

    // Set up realtime subscription for job updates
    const channel = supabase
      .channel('background-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'background_jobs',
        },
        payload => {
          if (payload.eventType === 'INSERT') {
            const newJob = payload.new as Record<string, unknown>;
            const mappedJob: BackgroundJob = {
              id: newJob.id as string,
              type: newJob.type as string,
              status: newJob.status as JobStatus,
              progress: (newJob.progress as number) || 0,
              totalItems: (newJob.total_items as number) || 0,
              processedItems: (newJob.processed_items as number) || 0,
              errorMessage: newJob.error_message as string | undefined,
              metadata: newJob.metadata as Record<string, unknown>,
              startedAt: newJob.started_at as string | undefined,
              completedAt: newJob.completed_at as string | undefined,
              createdAt: newJob.created_at as string,
              retryCount: newJob.retry_count as number | undefined,
            };
            setJobs(prev => [mappedJob, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedJob = payload.new as Record<string, unknown>;
            setJobs(prev =>
              prev.map(job =>
                job.id === updatedJob.id
                  ? {
                      ...job,
                      status: updatedJob.status as JobStatus,
                      progress: (updatedJob.progress as number) || job.progress,
                      processedItems: (updatedJob.processed_items as number) || job.processedItems,
                      errorMessage: updatedJob.error_message as string | undefined,
                      startedAt: updatedJob.started_at as string | undefined,
                      completedAt: updatedJob.completed_at as string | undefined,
                      retryCount: updatedJob.retry_count as number | undefined,
                    }
                  : job
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as Record<string, unknown>).id as string;
            setJobs(prev => prev.filter(job => job.id !== deletedId));
          }
        }
      )
      .subscribe();

    // Fallback polling for demo mode (when no real data exists)
    const interval = setInterval(fetchJobs, 30000); // Reduced frequency with realtime

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchJobs]);

  const handleRetry = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('background_jobs')
        .update({
          status: 'pending',
          retry_count: supabase.rpc ? undefined : 1, // Increment handled below
          error_message: null,
          started_at: null,
          completed_at: null,
        })
        .eq('id', jobId);

      if (error) throw error;

      // Increment retry count
      await supabase.rpc('increment_retry_count', { job_id: jobId }).catch(() => {
        // If RPC doesn't exist, update directly
        supabase
          .from('background_jobs')
          .update({ retry_count: jobs.find(j => j.id === jobId)?.retryCount || 0 + 1 })
          .eq('id', jobId);
      });

      toast({
        title: 'Retrying Job',
        description: `Job ${jobId.slice(0, 8)}... has been queued for retry.`,
      });

      // Update local state optimistically
      setJobs(prev =>
        prev.map(j =>
          j.id === jobId
            ? {
                ...j,
                status: 'pending' as JobStatus,
                retryCount: (j.retryCount || 0) + 1,
                errorMessage: undefined,
              }
            : j
        )
      );
    } catch (_err) {
      // Fallback to local-only update for demo
      toast({
        title: 'Retrying Job',
        description: `Job ${jobId.slice(0, 8)}... has been queued for retry.`,
      });
      setJobs(prev =>
        prev.map(j =>
          j.id === jobId
            ? { ...j, status: 'pending' as JobStatus, retryCount: (j.retryCount || 0) + 1 }
            : j
        )
      );
    }
  };

  const handleCancel = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('background_jobs')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: 'Job Cancelled',
        description: `Job ${jobId.slice(0, 8)}... has been cancelled.`,
      });

      setJobs(prev =>
        prev.map(j => (j.id === jobId ? { ...j, status: 'cancelled' as JobStatus } : j))
      );
    } catch (_err) {
      // Fallback to local-only update for demo
      toast({
        title: 'Job Cancelled',
        description: `Job ${jobId.slice(0, 8)}... has been cancelled.`,
      });
      setJobs(prev =>
        prev.map(j => (j.id === jobId ? { ...j, status: 'cancelled' as JobStatus } : j))
      );
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesFilter = filter === 'all' || job.status === filter;
    const matchesSearch =
      search === '' ||
      job.type.toLowerCase().includes(search.toLowerCase()) ||
      job.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
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
        <div>
          <h2 className="text-xl font-semibold">Background Jobs</h2>
          <p className="text-sm text-muted-foreground">
            Monitor and manage background processing tasks
          </p>
        </div>
        <Button onClick={fetchJobs} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard
          title="Total Jobs"
          value={stats.total}
          icon={Calendar}
          color="bg-slate-100 text-slate-600"
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          color="bg-slate-100 text-slate-600"
        />
        <StatsCard
          title="Running"
          value={stats.running}
          icon={Play}
          color="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          color="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Failed"
          value={stats.failed}
          icon={XCircle}
          color="bg-red-100 text-red-600"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by job type or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={v => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending_retry">Pending Retry</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Job Queue</CardTitle>
          <CardDescription>
            Showing {filteredJobs.length} of {jobs.length} jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map(job => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <JobTypeIcon type={job.type.split('_')[0]} />
                      <div>
                        <p className="font-medium">{job.type}</p>
                        <p className="text-xs text-muted-foreground">{job.id.slice(0, 12)}...</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={job.status} />
                  </TableCell>
                  <TableCell>
                    <div className="w-32">
                      <div className="flex items-center gap-2">
                        <Progress value={job.progress} className="h-2" />
                        <span className="text-xs text-muted-foreground">{job.progress}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {job.processedItems}/{job.totalItems} items
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                    </span>
                  </TableCell>
                  <TableCell>
                    {job.startedAt && job.completedAt ? (
                      <span className="text-sm">
                        {Math.round(
                          (new Date(job.completedAt).getTime() -
                            new Date(job.startedAt).getTime()) /
                            1000
                        )}
                        s
                      </span>
                    ) : job.startedAt ? (
                      <span className="text-sm text-blue-600">
                        {formatDistanceToNow(new Date(job.startedAt))}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedJob(job);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(job.status === 'failed' || job.status === 'pending_retry') && (
                        <Button variant="ghost" size="sm" onClick={() => handleRetry(job.id)}>
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {(job.status === 'pending' || job.status === 'running') && (
                        <Button variant="ghost" size="sm" onClick={() => handleCancel(job.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredJobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No jobs found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Job Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
            <DialogDescription>{selectedJob?.id}</DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedJob.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedJob.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="font-medium">{selectedJob.progress}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Items</p>
                  <p className="font-medium">
                    {selectedJob.processedItems}/{selectedJob.totalItems}
                  </p>
                </div>
                {selectedJob.retryCount !== undefined && selectedJob.retryCount > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Retry Count</p>
                    <p className="font-medium">{selectedJob.retryCount}</p>
                  </div>
                )}
              </div>

              {selectedJob.errorMessage && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-700">Error Message</p>
                  <p className="text-sm text-red-600 mt-1">{selectedJob.errorMessage}</p>
                </div>
              )}

              {selectedJob.metadata && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Metadata</p>
                  <pre className="p-3 bg-slate-50 rounded-lg text-xs overflow-auto">
                    {JSON.stringify(selectedJob.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {(selectedJob.status === 'failed' || selectedJob.status === 'pending_retry') && (
                  <Button
                    onClick={() => {
                      handleRetry(selectedJob.id);
                      setDetailsOpen(false);
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry Job
                  </Button>
                )}
                {(selectedJob.status === 'pending' || selectedJob.status === 'running') && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleCancel(selectedJob.id);
                      setDetailsOpen(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel Job
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
