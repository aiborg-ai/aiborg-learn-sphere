/**
 * Scheduled Reports Manager Component
 * UI for creating and managing automated analytics reports
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, Mail, Download, Trash2, Play, Pause, Plus } from '@/components/ui/icons';
import {
  ScheduledReportsService,
  type ScheduledReport,
  type CreateScheduledReportInput,
  type ReportType,
  type ReportFrequency,
  type DeliveryMethod,
  type DateRangeType,
} from '@/services/analytics/ScheduledReportsService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { format } from 'date-fns';

interface ScheduledReportsManagerProps {
  userId: string;
}

export function ScheduledReportsManager({ userId }: ScheduledReportsManagerProps) {
  const { toast } = useToast();
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateScheduledReportInput>({
    report_name: '',
    report_type: 'full',
    frequency: 'weekly',
    delivery_method: 'download',
    delivery_email: '',
    include_overview: true,
    include_performance: true,
    include_goals: true,
    include_charts: false,
    date_range_type: 'last_30_days',
  });

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await ScheduledReportsService.getUserScheduledReports(userId);
      setReports(data);
    } catch (_error) {
      logger.error('Error fetching scheduled reports:', _error);
      toast({
        title: 'Error',
        description: 'Failed to load scheduled reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      await ScheduledReportsService.createScheduledReport(userId, formData);
      toast({
        title: 'Success',
        description: 'Scheduled report created successfully',
      });
      setDialogOpen(false);
      resetForm();
      fetchReports();
    } catch (_error) {
      logger.error('Error creating scheduled report:', _error);
      toast({
        title: 'Error',
        description: 'Failed to create scheduled report',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (reportId: string, isActive: boolean) => {
    try {
      await ScheduledReportsService.toggleScheduledReport(userId, reportId, !isActive);
      toast({
        title: 'Success',
        description: `Report ${!isActive ? 'activated' : 'paused'}`,
      });
      fetchReports();
    } catch (_error) {
      logger.error('Error toggling report:', _error);
      toast({
        title: 'Error',
        description: 'Failed to update report status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await ScheduledReportsService.deleteScheduledReport(userId, reportId);
      toast({
        title: 'Success',
        description: 'Scheduled report deleted',
      });
      fetchReports();
    } catch (_error) {
      logger.error('Error deleting report:', _error);
      toast({
        title: 'Error',
        description: 'Failed to delete report',
        variant: 'destructive',
      });
    }
  };

  const handleExecuteNow = async (report: ScheduledReport) => {
    try {
      toast({
        title: 'Generating Report',
        description: 'Your report is being generated...',
      });
      await ScheduledReportsService.executeScheduledReport(report);
      toast({
        title: 'Success',
        description: 'Report generated successfully',
      });
    } catch (_error) {
      logger.error('Error executing report:', _error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      report_name: '',
      report_type: 'full',
      frequency: 'weekly',
      delivery_method: 'download',
      delivery_email: '',
      include_overview: true,
      include_performance: true,
      include_goals: true,
      include_charts: false,
      date_range_type: 'last_30_days',
    });
  };

  const getFrequencyBadge = (frequency: ReportFrequency) => {
    const colors: Record<ReportFrequency, string> = {
      daily: 'bg-blue-500',
      weekly: 'bg-green-500',
      monthly: 'bg-purple-500',
      quarterly: 'bg-orange-500',
    };
    return <Badge className={colors[frequency]}>{frequency}</Badge>;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-500">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">Paused</Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Scheduled Reports</CardTitle>
            <CardDescription>
              Automate your analytics report generation and delivery
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Scheduled Report</DialogTitle>
                <DialogDescription>Configure automated report generation</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Report Name */}
                <div className="space-y-2">
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input
                    id="report-name"
                    value={formData.report_name}
                    onChange={e => setFormData({ ...formData, report_name: e.target.value })}
                    placeholder="e.g., Weekly Performance Summary"
                  />
                </div>

                {/* Report Type */}
                <div className="space-y-2">
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select
                    value={formData.report_type}
                    onValueChange={(value: ReportType) =>
                      setFormData({ ...formData, report_type: value })
                    }
                  >
                    <SelectTrigger id="report-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Analytics</SelectItem>
                      <SelectItem value="overview">Overview Only</SelectItem>
                      <SelectItem value="performance">Performance Only</SelectItem>
                      <SelectItem value="goals">Goals Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: ReportFrequency) =>
                      setFormData({ ...formData, frequency: value })
                    }
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Delivery Method */}
                <div className="space-y-2">
                  <Label htmlFor="delivery-method">Delivery Method</Label>
                  <Select
                    value={formData.delivery_method}
                    onValueChange={(value: DeliveryMethod) =>
                      setFormData({ ...formData, delivery_method: value })
                    }
                  >
                    <SelectTrigger id="delivery-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="download">Auto Download</SelectItem>
                      <SelectItem value="email">Email (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Email (if delivery method is email) */}
                {formData.delivery_method === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.delivery_email}
                      onChange={e => setFormData({ ...formData, delivery_email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>
                )}

                {/* Date Range Type */}
                <div className="space-y-2">
                  <Label htmlFor="date-range">Date Range</Label>
                  <Select
                    value={formData.date_range_type}
                    onValueChange={(value: DateRangeType) =>
                      setFormData({ ...formData, date_range_type: value })
                    }
                  >
                    <SelectTrigger id="date-range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                      <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                      <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                      <SelectItem value="current_month">Current Month</SelectItem>
                      <SelectItem value="last_month">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Include Sections */}
                <div className="space-y-3 pt-2">
                  <Label htmlFor="include-overview">Include in Report</Label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overview</span>
                    <Switch
                      id="include-overview"
                      checked={formData.include_overview}
                      onCheckedChange={checked =>
                        setFormData({ ...formData, include_overview: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Performance Analytics</span>
                    <Switch
                      checked={formData.include_performance}
                      onCheckedChange={checked =>
                        setFormData({ ...formData, include_performance: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Goals & Predictions</span>
                    <Switch
                      checked={formData.include_goals}
                      onCheckedChange={checked =>
                        setFormData({ ...formData, include_goals: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateReport} disabled={!formData.report_name}>
                  Create Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              No scheduled reports yet. Create one to automate your analytics!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <Card key={report.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{report.report_name}</h3>
                        {getStatusBadge(report.is_active)}
                        {getFrequencyBadge(report.frequency)}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            Next run: {format(new Date(report.next_run_at), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                        {report.last_run_at && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Last run: {format(new Date(report.last_run_at), 'MMM d, yyyy HH:mm')}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {report.delivery_method === 'email' ? (
                            <Mail className="h-3 w-3" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                          <span>
                            {report.delivery_method === 'email' ? 'Email' : 'Auto Download'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExecuteNow(report)}
                        title="Run now"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(report.id, report.is_active)}
                        title={report.is_active ? 'Pause' : 'Resume'}
                      >
                        {report.is_active ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteReport(report.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
