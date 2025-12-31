/**
 * MediaUploadButton Component
 * Drag & drop or click to upload images with Supabase Storage integration
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, X, Loader2 } from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';

interface MediaUploadButtonProps {
  bucketName: string; // e.g., 'course-images', 'event-photos'
  onUploadComplete: (url: string, path: string) => void;
  currentImage?: string;
  maxSizeMB?: number;
  accept?: string;
  label?: string;
}

export function MediaUploadButton({
  bucketName,
  onUploadComplete,
  currentImage,
  maxSizeMB = 5,
  accept = 'image/*',
  label = 'Upload Image',
}: MediaUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentImage);
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `Maximum file size is ${maxSizeMB}MB`,
          variant: 'destructive',
        });
        return;
      }

      setIsUploading(true);

      try {
        // Create unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(7)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from(bucketName).getPublicUrl(filePath);

        setPreviewUrl(publicUrl);
        onUploadComplete(publicUrl, filePath);

        toast({
          title: 'Success',
          description: 'Image uploaded successfully',
        });
      } catch (_error) {
        logger._error('Error uploading image:', _error);
        toast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'Failed to upload image',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    },
    [bucketName, maxSizeMB, onUploadComplete, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [accept]: [] },
    multiple: false,
    disabled: isUploading,
  });

  const handleRemove = async () => {
    setPreviewUrl(undefined);
    onUploadComplete('', '');
  };

  return (
    <div className="space-y-2">
      {previewUrl ? (
        <div className="relative group">
          <img
            src={previewUrl}
            alt="Upload preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <>
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : isDragActive ? (
              <>
                <Upload className="h-12 w-12 text-primary" />
                <p className="text-sm text-primary font-medium">Drop image here</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                  Drag & drop or click to browse (max {maxSizeMB}MB)
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
