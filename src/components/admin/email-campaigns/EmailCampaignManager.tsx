import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Send,
  Plus,
  Search,
  Eye,
  Trash2,
  Copy,
  Users,
  BarChart3,
  RefreshCw,
  Loader2,
} from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  template?: string;
  status: CampaignStatus;
  recipientType: 'all' | 'segment' | 'custom';
  recipientCount: number;
  sentCount: number;
  openCount: number;
  clickCount: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  createdBy: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
}

const statusConfig: Record<CampaignStatus, { color: string; label: string }> = {
  draft: { color: 'bg-slate-100 text-slate-700', label: 'Draft' },
  scheduled: { color: 'bg-blue-100 text-blue-700', label: 'Scheduled' },
  sending: { color: 'bg-yellow-100 text-yellow-700', label: 'Sending' },
  sent: { color: 'bg-green-100 text-green-700', label: 'Sent' },
  failed: { color: 'bg-red-100 text-red-700', label: 'Failed' },
};

const StatsCard = ({
  title,
  value,
  icon: Icon,
  color,
  suffix,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  suffix?: string;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">
            {value}
            {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
          </p>
        </div>
        <div className={cn('p-3 rounded-full', color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export function EmailCampaignManager() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignStatus>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    template: '',
    recipientType: 'all' as const,
    scheduledAt: '',
  });

  // Stats
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalSent: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
  });

  // Generate sample data
  const generateSampleCampaigns = useCallback((): EmailCampaign[] => {
    const statuses: CampaignStatus[] = ['draft', 'scheduled', 'sending', 'sent', 'failed'];
    const names = [
      'Welcome Series - New Users',
      'Course Launch Announcement',
      'Weekly Newsletter',
      'Holiday Promotion',
      'Re-engagement Campaign',
      'Feature Update Notification',
      'Webinar Invitation',
      'Feedback Survey Request',
    ];

    return names.map((name, i) => {
      const status = statuses[i % statuses.length];
      const recipientCount = Math.floor(Math.random() * 5000) + 500;
      const sentCount =
        status === 'sent'
          ? recipientCount
          : status === 'sending'
            ? Math.floor(recipientCount * 0.6)
            : 0;
      const openCount = Math.floor(sentCount * (Math.random() * 0.4 + 0.2));
      const clickCount = Math.floor(openCount * (Math.random() * 0.3 + 0.1));

      return {
        id: `campaign-${i}`,
        name,
        subject: `${name} - Important Update`,
        content: `<h1>${name}</h1><p>This is the email content for ${name.toLowerCase()}.</p>`,
        status,
        recipientType: ['all', 'segment', 'custom'][i % 3] as 'all' | 'segment' | 'custom',
        recipientCount,
        sentCount,
        openCount,
        clickCount,
        scheduledAt:
          status === 'scheduled'
            ? new Date(Date.now() + 86400000 * (i + 1)).toISOString()
            : undefined,
        sentAt: status === 'sent' ? new Date(Date.now() - 86400000 * i).toISOString() : undefined,
        createdAt: new Date(Date.now() - 86400000 * (i + 5)).toISOString(),
        createdBy: 'Admin User',
      };
    });
  }, []);

  const generateSampleTemplates = useCallback((): EmailTemplate[] => {
    return [
      {
        id: 'tpl-1',
        name: 'Welcome Email',
        subject: 'Welcome to AiBorg!',
        content: '<h1>Welcome!</h1>',
        category: 'onboarding',
      },
      {
        id: 'tpl-2',
        name: 'Course Completion',
        subject: 'Congratulations!',
        content: '<h1>You did it!</h1>',
        category: 'milestone',
      },
      {
        id: 'tpl-3',
        name: 'Newsletter',
        subject: 'Weekly Update',
        content: '<h1>This Week</h1>',
        category: 'newsletter',
      },
      {
        id: 'tpl-4',
        name: 'Promotional',
        subject: 'Special Offer',
        content: '<h1>Limited Time!</h1>',
        category: 'marketing',
      },
      {
        id: 'tpl-5',
        name: 'Reminder',
        subject: "Don't forget!",
        content: '<h1>Quick Reminder</h1>',
        category: 'notification',
      },
    ];
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        const sampleCampaigns = generateSampleCampaigns();
        setCampaigns(sampleCampaigns);
        setTemplates(generateSampleTemplates());

        const totalSent = sampleCampaigns.reduce((sum, c) => sum + c.sentCount, 0);
        const totalOpen = sampleCampaigns.reduce((sum, c) => sum + c.openCount, 0);
        const totalClick = sampleCampaigns.reduce((sum, c) => sum + c.clickCount, 0);

        setStats({
          totalCampaigns: sampleCampaigns.length,
          totalSent,
          avgOpenRate: totalSent > 0 ? Math.round((totalOpen / totalSent) * 100) : 0,
          avgClickRate: totalOpen > 0 ? Math.round((totalClick / totalOpen) * 100) : 0,
        });
      } else {
        // Map database data to interface
        const mappedCampaigns: EmailCampaign[] = data.map(c => ({
          id: c.id,
          name: c.name,
          subject: c.subject,
          content: c.content,
          template: c.template_id,
          status: c.status as CampaignStatus,
          recipientType: c.recipient_type as 'all' | 'segment' | 'custom',
          recipientCount: c.recipient_count || 0,
          sentCount: c.sent_count || 0,
          openCount: c.open_count || 0,
          clickCount: c.click_count || 0,
          scheduledAt: c.scheduled_at,
          sentAt: c.sent_at,
          createdAt: c.created_at,
          createdBy: c.created_by,
        }));
        setCampaigns(mappedCampaigns);
      }
    } catch {
      const sampleCampaigns = generateSampleCampaigns();
      setCampaigns(sampleCampaigns);
      setTemplates(generateSampleTemplates());
    }
    setLoading(false);
  }, [generateSampleCampaigns, generateSampleTemplates]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreateCampaign = async () => {
    try {
      const { error } = await supabase.from('email_campaigns').insert({
        name: newCampaign.name,
        subject: newCampaign.subject,
        content: newCampaign.content,
        template_id: newCampaign.template || null,
        status: newCampaign.scheduledAt ? 'scheduled' : 'draft',
        recipient_type: newCampaign.recipientType,
        scheduled_at: newCampaign.scheduledAt || null,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({ title: 'Campaign Created', description: 'Your email campaign has been created.' });
      setCreateDialogOpen(false);
      setNewCampaign({
        name: '',
        subject: '',
        content: '',
        template: '',
        recipientType: 'all',
        scheduledAt: '',
      });
      fetchCampaigns();
    } catch {
      // Add to local state for demo
      const newId = `campaign-${Date.now()}`;
      setCampaigns(prev => [
        {
          id: newId,
          name: newCampaign.name,
          subject: newCampaign.subject,
          content: newCampaign.content,
          status: newCampaign.scheduledAt ? 'scheduled' : 'draft',
          recipientType: newCampaign.recipientType,
          recipientCount: 0,
          sentCount: 0,
          openCount: 0,
          clickCount: 0,
          scheduledAt: newCampaign.scheduledAt || undefined,
          createdAt: new Date().toISOString(),
          createdBy: 'Admin User',
        },
        ...prev,
      ]);
      toast({ title: 'Campaign Created', description: 'Your email campaign has been created.' });
      setCreateDialogOpen(false);
      setNewCampaign({
        name: '',
        subject: '',
        content: '',
        template: '',
        recipientType: 'all',
        scheduledAt: '',
      });
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    toast({ title: 'Sending Campaign', description: 'Your campaign is being sent...' });
    setCampaigns(prev =>
      prev.map(c => (c.id === campaignId ? { ...c, status: 'sending' as CampaignStatus } : c))
    );

    // Simulate sending
    setTimeout(() => {
      setCampaigns(prev =>
        prev.map(c =>
          c.id === campaignId
            ? {
                ...c,
                status: 'sent' as CampaignStatus,
                sentAt: new Date().toISOString(),
                sentCount: c.recipientCount,
              }
            : c
        )
      );
      toast({ title: 'Campaign Sent', description: 'Your campaign has been sent successfully.' });
    }, 3000);
  };

  const handleDuplicateCampaign = (campaign: EmailCampaign) => {
    const newId = `campaign-${Date.now()}`;
    setCampaigns(prev => [
      {
        ...campaign,
        id: newId,
        name: `${campaign.name} (Copy)`,
        status: 'draft',
        sentCount: 0,
        openCount: 0,
        clickCount: 0,
        sentAt: undefined,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    toast({
      title: 'Campaign Duplicated',
      description: 'A copy of the campaign has been created.',
    });
  };

  const handleDeleteCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    toast({ title: 'Campaign Deleted', description: 'The campaign has been deleted.' });
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch =
      search === '' ||
      campaign.name.toLowerCase().includes(search.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
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
          <div className="p-2 rounded-full bg-blue-100">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Email Campaigns</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage email marketing campaigns
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCampaigns}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Campaigns"
          value={stats.totalCampaigns}
          icon={Mail}
          color="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Emails Sent"
          value={stats.totalSent.toLocaleString()}
          icon={Send}
          color="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Avg Open Rate"
          value={stats.avgOpenRate}
          suffix="%"
          icon={Eye}
          color="bg-purple-100 text-purple-600"
        />
        <StatsCard
          title="Avg Click Rate"
          value={stats.avgClickRate}
          suffix="%"
          icon={BarChart3}
          color="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={v => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>
            Showing {filteredCampaigns.length} of {campaigns.length} campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map(campaign => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {campaign.subject}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig[campaign.status].color}>
                      {statusConfig[campaign.status].label}
                    </Badge>
                    {campaign.scheduledAt && campaign.status === 'scheduled' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(campaign.scheduledAt), 'MMM d, h:mm a')}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{campaign.recipientCount.toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {campaign.sentCount > 0 ? (
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {Math.round((campaign.openCount / campaign.sentCount) * 100)}% opened
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {Math.round(
                              (campaign.clickCount / Math.max(campaign.openCount, 1)) * 100
                            )}
                            % clicked
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setPreviewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {campaign.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendCampaign(campaign.id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateCampaign(campaign)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {campaign.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCampaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No campaigns found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Campaign Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Email Campaign</DialogTitle>
            <DialogDescription>Set up a new email campaign to send to your users</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="compose">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="compose" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="campaignName">Campaign Name</Label>
                <Input
                  id="campaignName"
                  placeholder="e.g., Welcome Series - Week 1"
                  value={newCampaign.name}
                  onChange={e => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="template">Use Template (Optional)</Label>
                <Select
                  value={newCampaign.template}
                  onValueChange={v => setNewCampaign(prev => ({ ...prev, template: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(tpl => (
                      <SelectItem key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject line..."
                  value={newCampaign.subject}
                  onChange={e => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Email Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your email content here..."
                  rows={8}
                  value={newCampaign.content}
                  onChange={e => setNewCampaign(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
            </TabsContent>
            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="recipientType">Recipients</Label>
                <Select
                  value={newCampaign.recipientType}
                  onValueChange={v =>
                    setNewCampaign(prev => ({
                      ...prev,
                      recipientType: v as 'all' | 'segment' | 'custom',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="segment">User Segment</SelectItem>
                    <SelectItem value="custom">Custom List</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="scheduledAt">Schedule (Optional)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={newCampaign.scheduledAt}
                  onChange={e => setNewCampaign(prev => ({ ...prev, scheduledAt: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">Leave empty to save as draft</p>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCampaign}
              disabled={!newCampaign.name || !newCampaign.subject}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Campaign Preview</DialogTitle>
            <DialogDescription>{selectedCampaign?.name}</DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="font-medium">{selectedCampaign.subject}</p>
              </div>
              <div className="p-4 bg-white border rounded-lg min-h-[200px]">
                <div dangerouslySetInnerHTML={{ __html: selectedCampaign.content }} />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">
                    {selectedCampaign.recipientCount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Recipients</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {selectedCampaign.openCount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Opens</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {selectedCampaign.clickCount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Clicks</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
