/**
 * Survey Manager Component
 * Admin interface for creating and managing surveys
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  SurveyService,
  AUDIENCE_CATEGORIES,
  type Survey,
  type SurveyTemplate,
  type AudienceCategory,
} from '@/services/surveys';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Eye,
  FileText,
  Loader2,
} from 'lucide-react';

interface SurveyManagerProps {
  className?: string;
}

export function SurveyManager({ className }: SurveyManagerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_category: '' as AudienceCategory | '',
    allow_anonymous: true,
    show_results_publicly: false,
    starts_at: '',
    ends_at: '',
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [surveysData, templatesData] = await Promise.all([
          SurveyService.getAllSurveys(),
          SurveyService.getTemplates(),
        ]);
        setSurveys(surveysData);
        setTemplates(templatesData);
      } catch (_error) {
        logger._error('Failed to load data:', _error);
        toast({
          title: 'Error',
          description: 'Failed to load surveys',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleCreateSurvey = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Survey title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);
      const survey = await SurveyService.createSurvey({
        title: formData.title,
        description: formData.description || undefined,
        target_category: formData.target_category || undefined,
        allow_anonymous: formData.allow_anonymous,
        show_results_publicly: formData.show_results_publicly,
        starts_at: formData.starts_at || undefined,
        ends_at: formData.ends_at || undefined,
      });

      setSurveys(prev => [survey, ...prev]);
      setShowCreateDialog(false);
      resetForm();

      toast({
        title: 'Survey Created',
        description: 'Add questions to your survey to get started.',
      });
    } catch (_error) {
      logger._error('Failed to create survey:', _error);
      toast({
        title: 'Error',
        description: 'Failed to create survey',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    try {
      setCreating(true);
      const survey = await SurveyService.createFromTemplate(
        templateId,
        template.name,
        template.description
      );

      setSurveys(prev => [survey, ...prev]);
      setShowTemplateDialog(false);

      toast({
        title: 'Survey Created',
        description: `Created survey from "${template.name}" template.`,
      });
    } catch (_error) {
      logger._error('Failed to create survey from template:', _error);
      toast({
        title: 'Error',
        description: 'Failed to create survey from template',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (surveyId: string, status: string) => {
    try {
      const updated = await SurveyService.updateSurvey(surveyId, { status });
      setSurveys(prev => prev.map(s => (s.id === surveyId ? updated : s)));

      toast({
        title: 'Status Updated',
        description: `Survey is now ${status}.`,
      });
    } catch (_error) {
      logger._error('Failed to update survey status:', _error);
      toast({
        title: 'Error',
        description: 'Failed to update survey status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSurvey = async (surveyId: string) => {
    if (!confirm('Are you sure you want to delete this survey? All responses will be lost.')) {
      return;
    }

    try {
      await SurveyService.deleteSurvey(surveyId);
      setSurveys(prev => prev.filter(s => s.id !== surveyId));

      toast({
        title: 'Survey Deleted',
        description: 'The survey has been permanently deleted.',
      });
    } catch (_error) {
      logger._error('Failed to delete survey:', _error);
      toast({
        title: 'Error',
        description: 'Failed to delete survey',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      target_category: '',
      allow_anonymous: true,
      show_results_publicly: false,
      starts_at: '',
      ends_at: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'draft':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'paused':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Surveys</CardTitle>
            <CardDescription>Create and manage audience surveys</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  From Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create from Template</DialogTitle>
                  <DialogDescription>Start with a pre-built survey template</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                  {templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleCreateFromTemplate(template.id)}
                      disabled={creating}
                      className="w-full p-4 text-left border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          {template.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {template.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {template.questions.length} questions
                          </p>
                        </div>
                        {template.is_system && <Badge variant="secondary">System</Badge>}
                      </div>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Survey
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Survey</DialogTitle>
                  <DialogDescription>
                    Create a new survey to gather audience feedback
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., What Would You Like to Learn?"
                      value={formData.title}
                      onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the survey..."
                      value={formData.description}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, description: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Target Audience</Label>
                    <Select
                      value={formData.target_category}
                      onValueChange={value =>
                        setFormData(prev => ({
                          ...prev,
                          target_category: value as AudienceCategory,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All audiences" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All audiences</SelectItem>
                        {AUDIENCE_CATEGORIES.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="starts_at">Start Date (optional)</Label>
                      <Input
                        id="starts_at"
                        type="datetime-local"
                        value={formData.starts_at}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, starts_at: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ends_at">End Date (optional)</Label>
                      <Input
                        id="ends_at"
                        type="datetime-local"
                        value={formData.ends_at}
                        onChange={e => setFormData(prev => ({ ...prev, ends_at: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="anonymous">Allow anonymous responses</Label>
                    <Switch
                      id="anonymous"
                      checked={formData.allow_anonymous}
                      onCheckedChange={checked =>
                        setFormData(prev => ({ ...prev, allow_anonymous: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="public_results">Show results publicly</Label>
                    <Switch
                      id="public_results"
                      checked={formData.show_results_publicly}
                      onCheckedChange={checked =>
                        setFormData(prev => ({ ...prev, show_results_publicly: checked }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSurvey} disabled={creating}>
                    {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Survey
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {surveys.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No Surveys Yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create your first survey to start gathering audience feedback.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Survey</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.map(survey => (
                <TableRow key={survey.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{survey.title}</div>
                      {survey.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {survey.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(getStatusColor(survey.status))}>
                      {survey.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {survey.target_category
                      ? AUDIENCE_CATEGORIES.find(c => c.id === survey.target_category)?.name
                      : 'All'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(survey.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => window.open(`/surveys/${survey.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        {survey.status === 'draft' && (
                          <DropdownMenuItem onClick={() => handleUpdateStatus(survey.id, 'active')}>
                            <Play className="h-4 w-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        {survey.status === 'active' && (
                          <DropdownMenuItem onClick={() => handleUpdateStatus(survey.id, 'paused')}>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </DropdownMenuItem>
                        )}
                        {survey.status === 'paused' && (
                          <DropdownMenuItem onClick={() => handleUpdateStatus(survey.id, 'active')}>
                            <Play className="h-4 w-4 mr-2" />
                            Resume
                          </DropdownMenuItem>
                        )}
                        {(survey.status === 'active' || survey.status === 'paused') && (
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(survey.id, 'completed')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteSurvey(survey.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
