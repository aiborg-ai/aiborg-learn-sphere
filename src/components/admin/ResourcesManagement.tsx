import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useResourcesManagement, type AdminResource } from '@/hooks/useResourcesManagement';
import { ResourceAllocationDialog } from './ResourceAllocationDialog';
import {
  Folder,
  Plus,
  Edit,
  Trash2,
  Upload,
  Link as LinkIcon,
  FileText,
  Video,
  UserPlus,
  Loader2,
  Search,
  Filter,
} from 'lucide-react';
import { logger } from '@/utils/logger';

export function ResourcesManagement() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    resources,
    loading,
    createResource,
    updateResource,
    deleteResource,
    allocateResource,
    uploadFile,
  } = useResourcesManagement();

  // State for create/edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<AdminResource | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // State for allocation dialog
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [resourceToAllocate, setResourceToAllocate] = useState<AdminResource | null>(null);

  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<AdminResource | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resource_type: 'pdf' as 'pdf' | 'video_link' | 'document' | 'presentation',
    file_url: '',
    video_url: '',
    thumbnail_url: '',
    category: '',
    tags: '',
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const handleOpenCreateDialog = () => {
    setEditingResource(null);
    setFormData({
      title: '',
      description: '',
      resource_type: 'pdf',
      file_url: '',
      video_url: '',
      thumbnail_url: '',
      category: '',
      tags: '',
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (resource: AdminResource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || '',
      resource_type: resource.resource_type,
      file_url: resource.file_url || '',
      video_url: resource.video_url || '',
      thumbnail_url: resource.thumbnail_url || '',
      category: resource.category || '',
      tags: resource.tags.join(', '),
    });
    setUploadMode(resource.resource_type === 'video_link' ? 'link' : 'file');
    setDialogOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate progress (since Supabase doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadFile(file, formData.resource_type);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setFormData(prev => ({
        ...prev,
        file_url: result.file_url,
        file_size: result.file_size,
      }));

      toast({
        title: 'File Uploaded',
        description: 'Your file has been uploaded successfully',
      });
    } catch (error) {
      logger.error('Error uploading file:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async () => {
    try {
      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const resourceData = {
        title: formData.title,
        description: formData.description || undefined,
        resource_type: formData.resource_type,
        file_url: uploadMode === 'file' ? formData.file_url || undefined : undefined,
        video_url: uploadMode === 'link' ? formData.video_url || undefined : undefined,
        thumbnail_url: formData.thumbnail_url || undefined,
        category: formData.category || undefined,
        tags,
      };

      if (editingResource) {
        await updateResource(editingResource.id, resourceData);
        toast({
          title: 'Resource Updated',
          description: 'The resource has been updated successfully',
        });
      } else {
        await createResource(resourceData);
        toast({
          title: 'Resource Created',
          description: 'The resource has been created successfully',
        });
      }

      setDialogOpen(false);
    } catch (error) {
      logger.error('Error saving resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to save resource',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!resourceToDelete) return;

    try {
      await deleteResource(resourceToDelete.id, false);
      toast({
        title: 'Resource Deleted',
        description: 'The resource has been deleted',
      });
      setDeleteDialogOpen(false);
      setResourceToDelete(null);
    } catch (error) {
      logger.error('Error deleting resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete resource',
        variant: 'destructive',
      });
    }
  };

  const handleAllocate = (resource: AdminResource) => {
    setResourceToAllocate(resource);
    setAllocationDialogOpen(true);
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || resource.resource_type === typeFilter;

    return matchesSearch && matchesType && resource.is_active;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video_link':
        return Video;
      case 'pdf':
        return FileText;
      default:
        return Folder;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card className="bg-white/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Resources Management
              </CardTitle>
              <CardDescription>Upload and manage resources for your users</CardDescription>
            </div>
            <Button onClick={handleOpenCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mt-4">
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
              <SelectTrigger className="w-[180px]">
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
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Allocations</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No resources found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResources.map(resource => {
                    const Icon = getResourceIcon(resource.resource_type);

                    return (
                      <TableRow key={resource.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="font-medium">{resource.title}</p>
                              {resource.description && (
                                <p className="text-sm text-gray-500 line-clamp-1">
                                  {resource.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{resource.resource_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {resource.category || <span className="text-gray-400">—</span>}
                        </TableCell>
                        <TableCell>
                          <Badge>{resource.allocation_count || 0} users</Badge>
                        </TableCell>
                        <TableCell>{new Date(resource.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAllocate(resource)}
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Allocate
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEditDialog(resource)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setResourceToDelete(resource);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {filteredResources.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredResources.length} of {resources.filter(r => r.is_active).length}{' '}
              resources
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Resource Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
            <DialogDescription>
              {editingResource
                ? 'Update the resource information'
                : 'Upload a file or add a video link'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload Mode Selection */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={uploadMode === 'file' ? 'default' : 'outline'}
                onClick={() => setUploadMode('file')}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
              <Button
                type="button"
                variant={uploadMode === 'link' ? 'default' : 'outline'}
                onClick={() => setUploadMode('link')}
                className="flex-1"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Video Link
              </Button>
            </div>

            {/* File Upload */}
            {uploadMode === 'file' && (
              <div className="space-y-2">
                <Label>File</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.file_url ? 'Change File' : 'Choose File'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                {uploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-gray-500">Uploading... {uploadProgress}%</p>
                  </div>
                )}
                {formData.file_url && !uploading && (
                  <p className="text-sm text-green-600">File uploaded successfully</p>
                )}
              </div>
            )}

            {/* Video Link */}
            {uploadMode === 'link' && (
              <div className="space-y-2">
                <Label htmlFor="video_url">Video URL</Label>
                <Input
                  id="video_url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={formData.video_url}
                  onChange={e => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                />
              </div>
            )}

            {/* Resource Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Resource title"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the resource"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resource_type">Type</Label>
                <Select
                  value={formData.resource_type}
                  onValueChange={value =>
                    setFormData(prev => ({
                      ...prev,
                      resource_type: value as 'pdf' | 'video_link' | 'document' | 'presentation',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="video_link">Video Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Training, Reference"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.title ||
                (uploadMode === 'file' && !formData.file_url) ||
                (uploadMode === 'link' && !formData.video_url)
              }
            >
              {editingResource ? 'Update' : 'Create'} Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{resourceToDelete?.title}"? This action will also
              remove all allocations for this resource.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resource Allocation Dialog */}
      {resourceToAllocate && (
        <ResourceAllocationDialog
          open={allocationDialogOpen}
          onOpenChange={setAllocationDialogOpen}
          resource={resourceToAllocate}
          onAllocate={allocateResource}
        />
      )}
    </>
  );
}
