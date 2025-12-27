/**
 * Batch Jobs History Component
 * View past batch generation jobs, retry failed posts, and track performance
 */

import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { BatchGenerationService } from '@/services/blog/BatchGenerationService';
import type { BatchJob } from '@/types/blog-scheduler';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CheckCircle2,
  XCircle,
  MoreVertical,
  RefreshCw,
  Eye,
  Loader2,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';

export function BatchJobsHistory() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<BatchJob | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadJobs();
    loadStatistics();
  }, []);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const data = await BatchGenerationService.getJobHistory(50);
      setJobs(data);
    } catch (error) {
      logger.error('Error loading jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load batch job history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await BatchGenerationService.getBatchStatistics();
      setStatistics(stats);
    } catch (error) {
      logger.error('Error loading statistics:', error);
    }
  };

  const handleRetry = async (job: BatchJob) => {
    try {
      const response = await BatchGenerationService.retryFailedPosts(job.id);
      toast({
        title: '🔄 Retry started',
        description: `Retrying ${job.failed_posts} failed posts`,
      });
      // Reload jobs after a delay
      setTimeout(loadJobs, 2000);
    } catch (error) {
      toast({
        title: 'Retry failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (job: BatchJob) => {
    setSelectedJob(job);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      case 'processing':
        return <Badge className="bg-blue-600">Processing</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_jobs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Posts Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_posts_generated}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.success_rate}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Posts/Job
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.avg_posts_per_job}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Job History</CardTitle>
          <CardDescription>View and manage your batch blog generation jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No batch jobs yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first batch in the Batch Creator tab
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created</TableHead>
                    <TableHead>Total Posts</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map(job => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(job.created_at), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(job.created_at), 'h:mm a')}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{job.total_posts}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          {job.completed_posts}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          {job.failed_posts}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>
                        {job.started_at && job.completed_at ? (
                          <div className="text-sm">
                            {Math.round(
                              (new Date(job.completed_at).getTime() -
                                new Date(job.started_at).getTime()) /
                                1000 /
                                60
                            )}
                            m
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewDetails(job)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {job.failed_posts > 0 && job.status === 'completed' && (
                              <DropdownMenuItem onClick={() => handleRetry(job)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry Failed ({job.failed_posts})
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedJob && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Batch Job Details</DialogTitle>
              <DialogDescription>Job ID: {selectedJob.id}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="mt-1">{getStatusBadge(selectedJob.status)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="mt-1 text-sm">
                    {format(new Date(selectedJob.created_at), 'PPpp')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Posts</div>
                  <div className="mt-1 font-medium">{selectedJob.total_posts}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                  <div className="mt-1 font-medium text-green-600">
                    {selectedJob.completed_posts}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                  <div className="mt-1 font-medium text-red-600">{selectedJob.failed_posts}</div>
                </div>
                {selectedJob.started_at && selectedJob.completed_at && (
                  <div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="mt-1 font-medium">
                      {Math.round(
                        (new Date(selectedJob.completed_at).getTime() -
                          new Date(selectedJob.started_at).getTime()) /
                          1000 /
                          60
                      )}{' '}
                      minutes
                    </div>
                  </div>
                )}
              </div>

              {/* Generation Parameters */}
              <div>
                <div className="text-sm font-medium mb-2">Generation Parameters</div>
                <div className="rounded-md border bg-muted/50 p-3">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(selectedJob.generation_params, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Error Log */}
              {selectedJob.error_log && selectedJob.error_log.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2 text-red-600">
                    Error Log ({selectedJob.error_log.length})
                  </div>
                  <ScrollArea className="h-[200px] rounded-md border border-red-200 dark:border-red-900">
                    <div className="p-4 space-y-2">
                      {selectedJob.error_log.map((error: any, index: number) => (
                        <div key={index} className="text-sm">
                          <div className="font-medium">{error.topic}</div>
                          <div className="text-xs text-red-600">{error.error}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(error.timestamp), 'PPpp')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                {selectedJob.failed_posts > 0 && selectedJob.status === 'completed' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleRetry(selectedJob);
                      setShowDetailsModal(false);
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Failed Posts
                  </Button>
                )}
                <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
