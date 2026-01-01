/**
 * Campaign Manager Component
 * Group related posts into campaigns for better organization and tracking
 */

import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BlogCampaignService } from '@/services/blog/BlogCampaignService';
import type { BlogCampaign, CampaignAnalytics } from '@/types/blog-scheduler';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  FolderKanban,
  Loader2,
  Eye,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']).optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  target_post_count: z.number().min(0).optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export function CampaignManager() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<BlogCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<BlogCampaign | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<BlogCampaign | null>(null);
  const [campaignAnalytics, setCampaignAnalytics] = useState<CampaignAnalytics | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      status: 'active',
      target_post_count: 10,
    },
  });

  useEffect(() => {
    loadCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      const data = await BlogCampaignService.getCampaigns();
      setCampaigns(data);
    } catch (_error) {
      logger.error('Error loading campaigns:', _error);
      toast({
        title: 'Error',
        description: 'Failed to load campaigns',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCampaignAnalytics = async (campaignId: string) => {
    try {
      const analytics = await BlogCampaignService.getCampaignAnalytics(campaignId);
      setCampaignAnalytics(analytics);
    } catch (_error) {
      logger.error('Error loading campaign analytics:', _error);
    }
  };

  const onSubmit = async (data: CampaignFormData) => {
    try {
      setIsSubmitting(true);

      if (editingCampaign) {
        await BlogCampaignService.updateCampaign(editingCampaign.id, {
          name: data.name,
          description: data.description,
          status: data.status,
          start_date: data.start_date?.toISOString(),
          end_date: data.end_date?.toISOString(),
          target_post_count: data.target_post_count,
        });
        toast({
          title: '✅ Campaign updated',
          description: `${data.name} has been updated`,
        });
      } else {
        await BlogCampaignService.createCampaign({
          name: data.name,
          description: data.description,
          status: data.status,
          start_date: data.start_date?.toISOString(),
          end_date: data.end_date?.toISOString(),
          target_post_count: data.target_post_count,
        });
        toast({
          title: '✅ Campaign created',
          description: `${data.name} has been created`,
        });
      }

      setShowCreateDialog(false);
      setEditingCampaign(null);
      form.reset();
      loadCampaigns();
    } catch (_error) {
      logger.error('Error saving campaign:', _error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save campaign',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (campaign: BlogCampaign) => {
    setEditingCampaign(campaign);
    form.reset({
      name: campaign.name,
      description: campaign.description || '',
      status: campaign.status,
      start_date: campaign.start_date ? new Date(campaign.start_date) : undefined,
      end_date: campaign.end_date ? new Date(campaign.end_date) : undefined,
      target_post_count: campaign.target_post_count,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (campaign: BlogCampaign) => {
    if (
      !confirm(
        `Are you sure you want to delete "${campaign.name}"? This will not delete the posts.`
      )
    ) {
      return;
    }

    try {
      await BlogCampaignService.deleteCampaign(campaign.id);
      toast({
        title: '🗑️ Campaign deleted',
        description: `${campaign.name} has been deleted`,
      });
      loadCampaigns();
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = async (campaign: BlogCampaign) => {
    setSelectedCampaign(campaign);
    setShowDetailsDialog(true);
    await loadCampaignAnalytics(campaign.id);
  };

  const handleCreateNew = () => {
    setEditingCampaign(null);
    form.reset({
      status: 'active',
      target_post_count: 10,
    });
    setShowCreateDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'completed':
        return <Badge className="bg-blue-600">Completed</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProgressPercentage = (campaign: BlogCampaign) => {
    if (campaign.target_post_count === 0) return 0;
    return Math.round((campaign.actual_post_count / campaign.target_post_count) * 100);
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
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Blog Campaigns</CardTitle>
              <CardDescription>
                Organize related posts into campaigns for better tracking and management
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
                  <DialogDescription>Group related blog posts into a campaign</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Q1 2025 AI Series" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Brief description of this campaign"
                              rows={3}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="paused">Paused</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      'pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>End Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      'pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="target_post_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Post Count</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            How many posts you plan to create for this campaign
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : editingCampaign ? (
                          'Update Campaign'
                        ) : (
                          'Create Campaign'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No campaigns yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first campaign to organize your blog posts
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map(campaign => (
            <Card key={campaign.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    {campaign.description && (
                      <CardDescription className="line-clamp-2">
                        {campaign.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleViewDetails(campaign)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(campaign)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(campaign)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(campaign.status)}
                </div>

                {/* Dates */}
                {(campaign.start_date || campaign.end_date) && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span>
                      {campaign.start_date && format(new Date(campaign.start_date), 'MMM d')}
                      {campaign.start_date && campaign.end_date && ' - '}
                      {campaign.end_date && format(new Date(campaign.end_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {campaign.actual_post_count}/{campaign.target_post_count}
                    </span>
                  </div>
                  <Progress value={getProgressPercentage(campaign)} className="h-2" />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleViewDetails(campaign)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      {selectedCampaign && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedCampaign.name}</DialogTitle>
              <DialogDescription>
                {selectedCampaign.description || 'Campaign analytics and details'}
              </DialogDescription>
            </DialogHeader>

            {campaignAnalytics ? (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Total Posts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{campaignAnalytics.total_posts}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Published</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {campaignAnalytics.published_posts}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Scheduled</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {campaignAnalytics.scheduled_posts}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Drafts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-600">
                        {campaignAnalytics.draft_posts}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Engagement Stats */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Engagement Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm text-muted-foreground">Total Views</span>
                      <span className="font-medium">{campaignAnalytics.total_views}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm text-muted-foreground">Total Likes</span>
                      <span className="font-medium">{campaignAnalytics.total_likes}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm text-muted-foreground">Comments</span>
                      <span className="font-medium">{campaignAnalytics.total_comments}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm text-muted-foreground">Shares</span>
                      <span className="font-medium">{campaignAnalytics.total_shares}</span>
                    </div>
                  </div>
                </div>

                <Button onClick={() => setShowDetailsDialog(false)} className="w-full">
                  Close
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
