/**
 * Publishing Calendar Component
 * Visual calendar to manage scheduled posts
 * Note: This is a simplified list-based view. For full calendar with drag-drop,
 * consider integrating a library like react-big-calendar or fullcalendar
 */

import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Clock, Edit, Send, Trash2, Loader2, Filter } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScheduledPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduled_for: string;
  published_at: string | null;
  category_id: string | null;
  featured_image: string | null;
}

export function PublishingCalendar() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<ScheduledPost[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [newScheduleDate, setNewScheduleDate] = useState<Date | undefined>();
  const [newScheduleTime, setNewScheduleTime] = useState('09:00');

  useEffect(() => {
    loadPosts();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  useEffect(() => {
    applyFilters();
  }, [posts, statusFilter, categoryFilter]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const start = startOfMonth(selectedMonth);
      const end = endOfMonth(selectedMonth);

      const { data, error } = await supabase
        .from('blog_posts')
        .select(
          'id, title, slug, excerpt, status, scheduled_for, published_at, category_id, featured_image'
        )
        .in('status', ['draft', 'scheduled', 'published'])
        .or(
          `scheduled_for.gte.${start.toISOString()},scheduled_for.lte.${end.toISOString()},published_at.gte.${start.toISOString()},published_at.lte.${end.toISOString()}`
        )
        .order('scheduled_for', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (_error) {
      logger._error('Error loading posts:', _error);
      toast({
        title: 'Error',
        description: 'Failed to load scheduled posts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await supabase.from('blog_categories').select('*').order('name');
      setCategories(data || []);
    } catch (_error) {
      logger._error('Error loading categories:', _error);
    }
  };

  const applyFilters = () => {
    let filtered = [...posts];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(post => post.category_id === categoryFilter);
    }

    setFilteredPosts(filtered);
  };

  const handleReschedule = async () => {
    if (!selectedPost || !newScheduleDate) return;

    try {
      const [hours, minutes] = newScheduleTime.split(':');
      const scheduledDateTime = new Date(newScheduleDate);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { error } = await supabase
        .from('blog_posts')
        .update({
          scheduled_for: scheduledDateTime.toISOString(),
          status: 'scheduled',
        })
        .eq('id', selectedPost.id);

      if (error) throw error;

      toast({
        title: '✅ Post rescheduled',
        description: `"${selectedPost.title}" rescheduled to ${format(scheduledDateTime, 'PPp')}`,
      });

      setShowRescheduleDialog(false);
      setSelectedPost(null);
      loadPosts();
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to reschedule post',
        variant: 'destructive',
      });
    }
  };

  const handlePublishNow = async (post: ScheduledPost) => {
    if (!confirm(`Publish "${post.title}" immediately?`)) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (error) throw error;

      toast({
        title: '✅ Post published',
        description: `"${post.title}" is now live`,
      });

      loadPosts();
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to publish post',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (post: ScheduledPost) => {
    if (!confirm(`Delete "${post.title}"?`)) return;

    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', post.id);

      if (error) throw error;

      toast({
        title: '🗑️ Post deleted',
        description: `"${post.title}" has been deleted`,
      });

      loadPosts();
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  const openRescheduleDialog = (post: ScheduledPost) => {
    setSelectedPost(post);
    if (post.scheduled_for) {
      const scheduledDate = parseISO(post.scheduled_for);
      setNewScheduleDate(scheduledDate);
      setNewScheduleTime(format(scheduledDate, 'HH:mm'));
    }
    setShowRescheduleDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-600">Published</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-600">Scheduled</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Group posts by date
  const groupedPosts = filteredPosts.reduce(
    (groups, post) => {
      const date = post.scheduled_for || post.published_at || '';
      if (!date) return groups;

      const dateKey = format(parseISO(date), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(post);
      return groups;
    },
    {} as Record<string, ScheduledPost[]>
  );

  const sortedDates = Object.keys(groupedPosts).sort();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing Calendar</CardTitle>
          <CardDescription>View and manage scheduled blog posts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Month</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedMonth, 'MMMM yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedMonth}
                    onSelect={date => date && setSelectedMonth(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            Showing {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>

      {/* Posts List Grouped by Date */}
      {sortedDates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No posts found for this month</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create scheduled posts in the Batch Creator tab
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(dateKey => {
            const postsForDate = groupedPosts[dateKey];
            const date = parseISO(dateKey);

            return (
              <Card key={dateKey}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    {format(date, 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                  <CardDescription>
                    {postsForDate.length} post{postsForDate.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {postsForDate.map(post => (
                      <div
                        key={post.id}
                        className="flex items-start gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                      >
                        {/* Time */}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                          <Clock className="h-4 w-4" />
                          {post.scheduled_for && format(parseISO(post.scheduled_for), 'h:mm a')}
                        </div>

                        {/* Post Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{post.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(post.status)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRescheduleDialog(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {post.status === 'scheduled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePublishNow(post)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleDelete(post)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reschedule Dialog */}
      {selectedPost && (
        <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reschedule Post</DialogTitle>
              <DialogDescription>
                Change the publish date and time for "{selectedPost.title}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>New Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !newScheduleDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newScheduleDate ? format(newScheduleDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newScheduleDate}
                      onSelect={setNewScheduleDate}
                      disabled={date => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={newScheduleTime}
                  onChange={e => setNewScheduleTime(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleReschedule}>Reschedule</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
