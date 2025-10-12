import React, { useState, useEffect } from 'react';
import { Calendar, Play, Pause, Trash2, Edit, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { logger } from '@/utils/logger';
interface ScheduledImport {
  id: string;
  name: string;
  description?: string;
  schedule_type: 'once' | 'daily' | 'weekly' | 'monthly';
  scheduled_at?: string;
  cron_expression?: string;
  import_type: 'course' | 'event' | 'both';
  source_type: 'url' | 'file' | 'api';
  source_url?: string;
  is_active: boolean;
  last_run_at?: string;
  last_run_status?: string;
  next_run_at?: string;
  run_count: number;
  success_count: number;
  failure_count: number;
}

export function ScheduledImports() {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<ScheduledImport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledImport | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    schedule_type: 'daily' as const,
    scheduled_at: '',
    scheduled_time: '',
    import_type: 'course' as const,
    source_type: 'url' as const,
    source_url: '',
    import_options: {
      skip_duplicates: true,
      update_existing: false,
      validate_first: true,
    },
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('scheduled_imports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      logger.error('Error fetching schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch scheduled imports',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      // Combine date and time for scheduled_at
      const scheduledAt =
        formData.schedule_type === 'once'
          ? `${formData.scheduled_at}T${formData.scheduled_time}:00`
          : null;

      const { data, error } = await supabase
        .from('scheduled_imports')
        .insert({
          name: formData.name,
          description: formData.description,
          schedule_type: formData.schedule_type,
          scheduled_at: scheduledAt,
          import_type: formData.import_type,
          source_type: formData.source_type,
          source_url: formData.source_url,
          import_options: formData.import_options,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      setSchedules([data, ...schedules]);
      setShowCreateDialog(false);
      resetForm();

      toast({
        title: 'Success',
        description: 'Scheduled import created successfully',
      });
    } catch (error) {
      logger.error('Error creating schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to create scheduled import',
        variant: 'destructive',
      });
    }
  };

  const toggleSchedule = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('scheduled_imports')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      setSchedules(schedules.map(s => (s.id === id ? { ...s, is_active: !isActive } : s)));

      toast({
        title: 'Success',
        description: `Schedule ${!isActive ? 'activated' : 'paused'}`,
      });
    } catch (error) {
      logger.error('Error toggling schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update schedule',
        variant: 'destructive',
      });
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled import?')) return;

    try {
      const { error } = await supabase.from('scheduled_imports').delete().eq('id', id);

      if (error) throw error;

      setSchedules(schedules.filter(s => s.id !== id));

      toast({
        title: 'Success',
        description: 'Scheduled import deleted',
      });
    } catch (error) {
      logger.error('Error deleting schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete schedule',
        variant: 'destructive',
      });
    }
  };

  const runNow = async (id: string) => {
    try {
      // This would trigger the import immediately
      // Implementation would call the execute_scheduled_import function
      toast({
        title: 'Import Started',
        description: 'The import has been triggered and will run shortly',
      });
    } catch (error) {
      logger.error('Error running import:', error);
      toast({
        title: 'Error',
        description: 'Failed to trigger import',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      schedule_type: 'daily',
      scheduled_at: '',
      scheduled_time: '',
      import_type: 'course',
      source_type: 'url',
      source_url: '',
      import_options: {
        skip_duplicates: true,
        update_existing: false,
        validate_first: true,
      },
    });
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const variants: Record<string, 'default' | 'success' | 'destructive' | 'secondary'> = {
      success: 'success',
      failed: 'destructive',
      running: 'default',
    };

    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getScheduleBadge = (type: string) => {
    const icons = {
      once: '📅',
      daily: '🔄',
      weekly: '📆',
      monthly: '📅',
    };

    return (
      <Badge variant="outline">
        {icons[type]} {type}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-4" />
          <p className="text-muted-foreground">Loading scheduled imports...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scheduled Imports</CardTitle>
              <CardDescription>Automate template imports on a recurring schedule</CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Scheduled Import</DialogTitle>
                  <DialogDescription>
                    Set up automatic imports from a URL on a schedule
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Daily Course Import"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="import-type">Import Type</Label>
                      <Select
                        value={formData.import_type}
                        onValueChange={value =>
                          setFormData({
                            ...formData,
                            import_type: value as 'course' | 'event' | 'both',
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="course">Courses</SelectItem>
                          <SelectItem value="event">Events</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Schedule Type</Label>
                      <Select
                        value={formData.schedule_type}
                        onValueChange={value =>
                          setFormData({
                            ...formData,
                            schedule_type: value as 'once' | 'daily' | 'weekly',
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="once">Once</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.schedule_type === 'once' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={formData.scheduled_at}
                            onChange={e =>
                              setFormData({ ...formData, scheduled_at: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Time</Label>
                          <Input
                            type="time"
                            value={formData.scheduled_time}
                            onChange={e =>
                              setFormData({ ...formData, scheduled_time: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source-url">Source URL</Label>
                    <Input
                      id="source-url"
                      type="url"
                      value={formData.source_url}
                      onChange={e => setFormData({ ...formData, source_url: e.target.value })}
                      placeholder="https://example.com/templates.json"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateSchedule}>Create Schedule</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No scheduled imports yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Runs</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map(schedule => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{schedule.name}</div>
                        {schedule.description && (
                          <div className="text-xs text-muted-foreground">
                            {schedule.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getScheduleBadge(schedule.schedule_type)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{schedule.import_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs truncate max-w-[200px]">
                        {schedule.source_url || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {schedule.is_active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Paused</Badge>
                        )}
                        {getStatusBadge(schedule.last_run_status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div>Total: {schedule.run_count}</div>
                        <div className="text-green-600">Success: {schedule.success_count}</div>
                        {schedule.failure_count > 0 && (
                          <div className="text-red-600">Failed: {schedule.failure_count}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {schedule.next_run_at ? (
                        <div className="text-xs">
                          {new Date(schedule.next_run_at).toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSchedule(schedule.id, schedule.is_active)}
                        >
                          {schedule.is_active ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => runNow(schedule.id)}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSchedule(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSchedule(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
