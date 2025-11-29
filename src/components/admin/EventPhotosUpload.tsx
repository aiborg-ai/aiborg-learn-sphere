import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Image, Upload, Trash2, X } from '@/components/ui/icons';
import { ThumbnailImage } from '@/components/shared/OptimizedImage';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { EventPhoto } from '@/hooks/useEvents';

interface EventPhotosUploadProps {
  eventId: number;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EventPhotosUpload({
  eventId,
  eventTitle,
  isOpen,
  onClose,
}: EventPhotosUploadProps) {
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const { toast } = useToast();

  const fetchEventPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_photos')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      logger.error('Error fetching event photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch event photos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchEventPhotos();
    }
  }, [isOpen, fetchEventPhotos]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Image must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a photo to upload',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${eventId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('event-photos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('event-photos').getPublicUrl(fileName);

      // Save photo metadata
      const { error: insertError } = await supabase.from('event_photos').insert({
        event_id: eventId,
        photo_url: publicUrl,
        photo_caption: photoCaption || null,
        display_order: photos.length,
      });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'Photo uploaded successfully',
      });

      // Reset form
      setSelectedFile(null);
      setPhotoCaption('');
      fetchEventPhotos();
    } catch (error) {
      logger.error('Error uploading photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (photoId: string, photoUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/event-photos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];

        // Delete from storage
        await supabase.storage.from('event-photos').remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase.from('event_photos').delete().eq('id', photoId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Photo deleted successfully',
      });

      fetchEventPhotos();
    } catch (error) {
      logger.error('Error deleting photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete photo',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Manage Event Photos - {eventTitle}
          </DialogTitle>
        </DialogHeader>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload New Photo</CardTitle>
            <CardDescription>Add photos from the event (Max 5MB per image)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="photo-upload">Select Photo</Label>
              <div className="flex gap-2">
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
                {selectedFile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {selectedFile && (
                <Badge variant="secondary" className="mt-2">
                  Selected: {selectedFile.name}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo-caption">Caption (Optional)</Label>
              <Textarea
                id="photo-caption"
                placeholder="Add a caption for this photo..."
                value={photoCaption}
                onChange={e => setPhotoCaption(e.target.value)}
                disabled={isUploading}
                rows={2}
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-pulse" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Photos Gallery */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uploaded Photos ({photos.length})</CardTitle>
            <CardDescription>Photos will be displayed in the past events section</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No photos uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map(photo => (
                  <div key={photo.id} className="relative group">
                    <ThumbnailImage
                      src={photo.photo_url}
                      alt={photo.photo_caption || 'Event photo'}
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    {photo.photo_caption && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {photo.photo_caption}
                      </p>
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(photo.id, photo.photo_url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
