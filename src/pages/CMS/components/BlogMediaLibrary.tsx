/* eslint-disable jsx-a11y/prefer-tag-over-role */
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Copy,
  Search,
  Grid,
  List,
  Download,
  Edit,
  X,
  Check,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MediaItem {
  id: string;
  filename: string;
  original_filename: string;
  file_url: string;
  thumbnail_url: string | null;
  file_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  caption: string | null;
  uploaded_by: string;
  created_at: string;
}

function BlogMediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchMedia is stable
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_media')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch {
      logger.error('Error fetching media:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch media library',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      for (const file of files) {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `blog-media/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError, data: _uploadData } = await supabase.storage
          .from('blog-images')
          .upload(filePath, file);

        if (uploadError) {
          // If bucket doesn't exist, create it
          if (uploadError.message.includes('bucket')) {
            const { error: bucketError } = await supabase.storage.createBucket('blog-images', {
              public: true,
            });

            if (!bucketError) {
              // Retry upload
              const { error: retryError } = await supabase.storage
                .from('blog-images')
                .upload(filePath, file);

              if (retryError) throw retryError;
            }
          } else {
            throw uploadError;
          }
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(filePath);

        // Get image dimensions if it's an image
        let width = null;
        let height = null;
        if (file.type.startsWith('image/')) {
          const img = new Image();
          const objectUrl = URL.createObjectURL(file);
          await new Promise(resolve => {
            img.onload = () => {
              width = img.width;
              height = img.height;
              resolve(null);
            };
            img.src = objectUrl;
          });
          URL.revokeObjectURL(objectUrl);
        }

        // Save metadata to database
        const { error: dbError } = await supabase.from('blog_media').insert({
          filename: fileName,
          original_filename: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          width,
          height,
          uploaded_by: user.id,
        });

        if (dbError) throw dbError;
      }

      toast({
        title: 'Success',
        description: `${files.length} file(s) uploaded successfully`,
      });

      fetchMedia();
    } catch {
      logger.error('Error uploading files:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload files',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      // Delete from storage
      const filePath = `blog-media/${item.filename}`;
      await supabase.storage.from('blog-images').remove([filePath]);

      // Delete from database
      const { error } = await supabase.from('blog_media').delete().eq('id', item.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'File deleted successfully',
      });

      fetchMedia();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateMedia = async () => {
    if (!editingMedia) return;

    try {
      const { error } = await supabase
        .from('blog_media')
        .update({
          alt_text: editingMedia.alt_text,
          caption: editingMedia.caption,
        })
        .eq('id', editingMedia.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Media details updated',
      });

      fetchMedia();

      setEditingMedia(null);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update media',
        variant: 'destructive',
      });
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copied',
      description: 'URL copied to clipboard',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredMedia = media.filter(
    item =>
      item.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.alt_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.caption?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Media Library</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
          <Button className="btn-hero" disabled={uploading}>
            <label htmlFor="file-upload" className="flex items-center gap-2 cursor-pointer">
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload Files'}
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Media Grid/List */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No media found' : 'No media uploaded yet'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredMedia.map(item => (
                <div
                  key={item.id}
                  className="group relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setSelectedMedia(item)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedMedia(item);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <img
                    src={item.thumbnail_url || item.file_url}
                    alt={item.alt_text || item.original_filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={e => {
                        e.stopPropagation();
                        setEditingMedia(item);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={e => {
                        e.stopPropagation();
                        copyUrl(item.file_url);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMedia.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <img
                    src={item.thumbnail_url || item.file_url}
                    alt={item.alt_text || item.original_filename}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.original_filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(item.file_size)}
                      {item.width && item.height && ` • ${item.width}×${item.height}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingMedia(item)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copyUrl(item.file_url)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(item)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Details Dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-3xl">
          {selectedMedia && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMedia.original_filename}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <img
                  src={selectedMedia.file_url}
                  alt={selectedMedia.alt_text || selectedMedia.original_filename}
                  className="w-full rounded-lg"
                />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">File Size</p>
                    <p className="font-medium">{formatFileSize(selectedMedia.file_size)}</p>
                  </div>
                  {selectedMedia.width && selectedMedia.height && (
                    <div>
                      <p className="text-muted-foreground">Dimensions</p>
                      <p className="font-medium">
                        {selectedMedia.width} × {selectedMedia.height}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">File Type</p>
                    <p className="font-medium">{selectedMedia.file_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Uploaded</p>
                    <p className="font-medium">
                      {new Date(selectedMedia.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => copyUrl(selectedMedia.file_url)}
                    className="flex-1"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy URL
                  </Button>
                  <Button variant="outline" asChild className="flex-1">
                    <a href={selectedMedia.file_url} download>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Media Dialog */}
      <Dialog open={!!editingMedia} onOpenChange={() => setEditingMedia(null)}>
        <DialogContent>
          {editingMedia && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Media Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <img
                  src={editingMedia.thumbnail_url || editingMedia.file_url}
                  alt={editingMedia.alt_text || editingMedia.original_filename}
                  className="w-full rounded-lg"
                />
                <div>
                  <Label htmlFor="alt-text">Alt Text</Label>
                  <Input
                    id="alt-text"
                    value={editingMedia.alt_text || ''}
                    onChange={e => setEditingMedia({ ...editingMedia, alt_text: e.target.value })}
                    placeholder="Describe this image..."
                  />
                </div>
                <div>
                  <Label htmlFor="caption">Caption</Label>
                  <Input
                    id="caption"
                    value={editingMedia.caption || ''}
                    onChange={e => setEditingMedia({ ...editingMedia, caption: e.target.value })}
                    placeholder="Optional caption..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingMedia(null)}
                    className="flex-1"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateMedia} className="flex-1 btn-hero">
                    <Check className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BlogMediaLibrary;
