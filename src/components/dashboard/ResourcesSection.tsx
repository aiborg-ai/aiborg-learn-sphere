import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  FileText,
  Video,
  Download,
  ExternalLink,
  Search,
  Calendar,
  Eye,
  Folder,
  Filter,
  FileIcon,
} from '@/components/ui/icons';
import type { UserResource } from '@/hooks/useUserResources';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';

interface ResourcesSectionProps {
  resources: UserResource[];
  loading: boolean;
  onResourceView: (resourceId: string) => void;
}

export function ResourcesSection({ resources, loading, onResourceView }: ResourcesSectionProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<UserResource | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = resources
      .map(r => r.category)
      .filter((cat): cat is string => cat !== null && cat !== undefined);
    return Array.from(new Set(cats));
  }, [resources]);

  // Filter resources
  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      const matchesSearch =
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = typeFilter === 'all' || resource.resource_type === typeFilter;

      const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [resources, searchTerm, typeFilter, categoryFilter]);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video_link':
        return Video;
      case 'pdf':
        return FileText;
      case 'presentation':
        return FileIcon;
      default:
        return Folder;
    }
  };

  const getResourceTypeColor = (
    type: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (type) {
      case 'video_link':
        return 'destructive';
      case 'pdf':
        return 'default';
      case 'presentation':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleViewResource = async (resource: UserResource) => {
    // Track the view
    onResourceView(resource.id);

    if (resource.resource_type === 'video_link' && resource.video_url) {
      // Open video in new tab
      window.open(resource.video_url, '_blank');
    } else if (resource.file_url) {
      // For PDFs and documents, open in viewer dialog
      setSelectedResource(resource);
      setViewerOpen(true);
    }
  };

  const handleDownloadResource = async (resource: UserResource) => {
    if (!resource.file_url) return;

    try {
      // Track the view/download
      onResourceView(resource.id);

      // For files in storage, get signed URL
      if (resource.file_url.includes('supabase')) {
        const urlParts = resource.file_url.split('/');
        const fileName = urlParts[urlParts.length - 1];

        const { data, error } = await supabase.storage
          .from('user-resources')
          .createSignedUrl(fileName, 3600); // 1 hour expiry

        if (error) throw error;

        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
        }
      } else {
        // For direct URLs, open directly
        window.open(resource.file_url, '_blank');
      }

      toast({
        title: 'Download Started',
        description: 'Your resource is being downloaded',
      });
    } catch (_error) {
      logger._error('Error downloading resource:', _error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download the resource',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading resources...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            My Resources
          </CardTitle>
          <CardDescription>
            Access documents, videos, and materials allocated to you
          </CardDescription>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pdf">PDFs</SelectItem>
                <SelectItem value="video_link">Videos</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="presentation">Presentations</SelectItem>
              </SelectContent>
            </Select>

            {categories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {filteredResources.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg mb-2">
                  {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all'
                    ? 'No resources match your filters'
                    : 'No resources allocated yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Resources allocated to you by admins will appear here'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResources.map(resource => {
                  const Icon = getResourceIcon(resource.resource_type);

                  return (
                    <div
                      key={resource.id}
                      className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate" title={resource.title}>
                            {resource.title}
                          </h3>
                          {resource.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {resource.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant={getResourceTypeColor(resource.resource_type)}>
                          {resource.resource_type}
                        </Badge>
                        {resource.category && <Badge variant="outline">{resource.category}</Badge>}
                      </div>

                      {resource.tags && resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {resource.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-secondary/50 rounded">
                              #{tag}
                            </span>
                          ))}
                          {resource.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{resource.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground space-y-1 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Added: {new Date(resource.allocated_at!).toLocaleDateString()}
                        </div>
                        {resource.view_count !== undefined && resource.view_count > 0 && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Viewed {resource.view_count} time{resource.view_count !== 1 ? 's' : ''}
                          </div>
                        )}
                        {resource.file_size && (
                          <div>Size: {formatFileSize(resource.file_size)}</div>
                        )}
                        {resource.duration && (
                          <div>Duration: {formatDuration(resource.duration)}</div>
                        )}
                        {resource.expires_at && (
                          <div className="text-yellow-600">
                            Expires: {new Date(resource.expires_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewResource(resource)}
                        >
                          {resource.resource_type === 'video_link' ? (
                            <>
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Watch
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </>
                          )}
                        </Button>
                        {resource.file_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadResource(resource)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {filteredResources.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Showing {filteredResources.length} of {resources.length} resource
              {resources.length !== 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF/Document Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedResource?.title}</DialogTitle>
            <DialogDescription>{selectedResource?.description}</DialogDescription>
          </DialogHeader>
          {selectedResource?.file_url && (
            <div className="flex-1 overflow-hidden">
              <iframe
                src={selectedResource.file_url}
                className="w-full h-full border rounded"
                title={selectedResource.title}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
