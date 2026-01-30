/**
 * Summit Resource Manager Component
 * Manage all resources across all themes
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreHorizontal,
  Search,
  Filter,
  Clock,
  FileText,
  Copy,
  ExternalLink,
  Star,
  Layers,
} from '@/components/ui/icons';
import SummitResourceEditor from './SummitResourceEditor';
import { format } from 'date-fns';
import { logger } from '@/utils/logger';
import { useSummitThemes } from '@/hooks/summit/useSummitResources';
import type { SummitResource } from '@/types/summit';
import { RESOURCE_TYPE_CONFIGS, getThemeColors, getResourceTypeConfig } from '@/types/summit';

function SummitResourceManager() {
  const [resources, setResources] = useState<SummitResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<SummitResource | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const { toast } = useToast();

  const { data: themes = [] } = useSummitThemes();

  useEffect(() => {
    fetchResources();
  }, [statusFilter, themeFilter, typeFilter]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('summit_resources')
        .select('*, theme:summit_themes(*)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (themeFilter !== 'all') {
        query = query.eq('theme_id', themeFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('resource_type', typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setResources((data as SummitResource[]) || []);
    } catch (err) {
      logger.error('Error fetching resources:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch resources',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const { error } = await supabase.from('summit_resources').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Resource deleted successfully',
      });
      fetchResources();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete resource',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('summit_resources').update({ status }).eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Resource ${status === 'published' ? 'published' : 'moved to drafts'} successfully`,
      });
      fetchResources();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update resource status',
        variant: 'destructive',
      });
    }
  };

  const toggleFeatured = async (id: string, is_featured: boolean) => {
    try {
      const { error } = await supabase
        .from('summit_resources')
        .update({ is_featured: !is_featured })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Resource ${!is_featured ? 'featured' : 'unfeatured'} successfully`,
      });
      fetchResources();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update featured status',
        variant: 'destructive',
      });
    }
  };

  const duplicateResource = async (resource: SummitResource) => {
    try {
      const newResource = {
        title: `${resource.title} (Copy)`,
        slug: `${resource.slug}-copy-${Date.now()}`,
        description: resource.description,
        url: resource.url,
        theme_id: resource.theme_id,
        resource_type: resource.resource_type,
        source: resource.source,
        status: 'draft' as const,
        is_featured: false,
        view_count: 0,
        tags: resource.tags,
        metadata: resource.metadata,
      };

      const { error } = await supabase.from('summit_resources').insert(newResource);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Resource duplicated successfully',
      });
      fetchResources();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to duplicate resource',
        variant: 'destructive',
      });
    }
  };

  const filteredResources = resources.filter(
    resource =>
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resource.source || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/20 text-green-600';
      case 'draft':
        return 'bg-gray-500/20 text-gray-600';
      default:
        return 'bg-gray-500/20 text-gray-600';
    }
  };

  const getThemeName = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    return theme?.name || 'Unknown';
  };

  if (showEditor) {
    return (
      <SummitResourceEditor
        resource={selectedResource}
        themes={themes}
        onClose={() => {
          setShowEditor(false);
          setSelectedResource(null);
          fetchResources();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Resources</h2>
        <Button onClick={() => setShowEditor(true)} className="btn-hero">
          <Plus className="mr-2 h-4 w-4" />
          Add Resource
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={themeFilter} onValueChange={setThemeFilter}>
              <SelectTrigger className="w-[200px]">
                <Layers className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Themes</SelectItem>
                {themes.map(theme => (
                  <SelectItem key={theme.id} value={theme.id}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <FileText className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {RESOURCE_TYPE_CONFIGS.map(config => (
                  <SelectItem key={config.type} value={config.type}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resources Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No resources found</p>
              <Button onClick={() => setShowEditor(true)} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create your first resource
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Theme</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.map(resource => {
                  const themeColors = resource.theme ? getThemeColors(resource.theme.slug) : {};
                  const typeConfig = getResourceTypeConfig(resource.resource_type);
                  return (
                    <TableRow key={resource.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium line-clamp-1">{resource.title}</p>
                            {resource.is_featured && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {resource.slug}
                          </p>
                          {resource.source && (
                            <p className="text-xs text-muted-foreground">
                              Source: {resource.source}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${themeColors.bgColor} ${themeColors.textColor} ${themeColors.borderColor}`}
                        >
                          {resource.theme?.name || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={typeConfig?.color}>
                          {typeConfig?.label || resource.resource_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(resource.status)}>{resource.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <Eye className="h-3 w-3" />
                            {resource.view_count || 0} views
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(resource.created_at), 'MMM d')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedResource(resource);
                                setShowEditor(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open URL
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateResource(resource)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => toggleFeatured(resource.id, resource.is_featured)}
                            >
                              {resource.is_featured ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Unfeature
                                </>
                              ) : (
                                <>
                                  <Star className="mr-2 h-4 w-4" />
                                  Feature
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {resource.status !== 'published' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(resource.id, 'published')}
                              >
                                Publish
                              </DropdownMenuItem>
                            )}
                            {resource.status !== 'draft' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(resource.id, 'draft')}
                              >
                                Move to Draft
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(resource.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SummitResourceManager;
