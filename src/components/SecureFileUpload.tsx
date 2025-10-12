import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { FileValidationConfig } from '@/lib/security/file-validator';
import { FileValidationPresets, createSecureUploadHandler } from '@/lib/security/file-validator';
import { rateLimiter, RateLimitPresets } from '@/lib/security/rate-limiter';
import type { Action, Resource } from '@/lib/security/rbac';
import { rbac } from '@/lib/security/rbac';
import { logger } from '@/utils/logger';
import { Upload, X, CheckCircle, AlertCircle, FileText, Image, Film, File } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for SecureFileUpload component
 * @interface SecureFileUploadProps
 */
export interface SecureFileUploadProps {
  /** Upload configuration preset or custom config */
  config?: keyof typeof FileValidationPresets | FileValidationConfig;
  /** Bucket name in Supabase storage */
  bucket: string;
  /** Path within the bucket */
  path?: string;
  /** Callback when upload completes */
  onUploadComplete?: (urls: string[]) => void;
  /** Callback when upload fails */
  onUploadError?: (error: Error) => void;
  /** Required RBAC permission */
  requiredPermission?: {
    action: Action;
    resource: Resource;
  };
  /** Maximum concurrent uploads */
  maxConcurrent?: number;
  /** Show upload progress */
  showProgress?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * File upload item
 * @interface UploadItem
 */
interface UploadItem {
  file: File;
  sanitizedName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

/**
 * Secure file upload component with validation and progress tracking
 * @param {SecureFileUploadProps} props - Component props
 * @returns {JSX.Element} Secure file upload interface
 */
export function SecureFileUpload({
  config = 'document',
  bucket,
  path = '',
  onUploadComplete,
  onUploadError,
  requiredPermission,
  maxConcurrent = 3,
  showProgress = true,
  className,
}: SecureFileUploadProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get validation config
  const validationConfig = typeof config === 'string' ? FileValidationPresets[config] : config;

  // Create secure upload handler
  const uploadHandler = createSecureUploadHandler(validationConfig);

  /**
   * Handle file selection
   */
  const handleFileSelect = async (files: FileList | File[]) => {
    try {
      // Check RBAC permission
      if (requiredPermission) {
        const hasPermission = rbac.can(requiredPermission.action, requiredPermission.resource);

        if (!hasPermission) {
          toast({
            title: 'Permission Denied',
            description: 'You do not have permission to upload files',
            variant: 'destructive',
          });
          return;
        }
      }

      // Check rate limit
      const limitCheck = rateLimiter.checkLimit(RateLimitPresets.upload);
      if (!limitCheck.allowed) {
        toast({
          title: 'Upload Limit Exceeded',
          description: `Please wait ${Math.ceil(limitCheck.retryAfter! / 1000)} seconds before uploading again`,
          variant: 'destructive',
        });
        return;
      }

      // Validate files
      const validation = await uploadHandler(files);

      if (!validation.valid) {
        toast({
          title: 'Validation Failed',
          description: validation.errors.join(', '),
          variant: 'destructive',
        });
        return;
      }

      // Create upload items
      const newUploads: UploadItem[] = validation.files.map(({ file, sanitizedName }) => ({
        file,
        sanitizedName,
        progress: 0,
        status: 'pending' as const,
      }));

      setUploads(prev => [...prev, ...newUploads]);

      // Start upload process
      uploadFiles(newUploads);
    } catch (error) {
      logger.error('File selection error:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to process selected files',
        variant: 'destructive',
      });
    }
  };

  /**
   * Upload files to Supabase storage
   */
  const uploadFiles = async (items: UploadItem[]) => {
    setIsUploading(true);

    const uploadPromises = items.map(async (item, index) => {
      // Add delay to respect concurrent upload limit
      const delay = Math.floor(index / maxConcurrent) * 100;
      await new Promise(resolve => setTimeout(resolve, delay));

      return uploadFile(item);
    });

    try {
      const results = await Promise.allSettled(uploadPromises);
      const successfulUrls = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<string>).value)
        .filter(Boolean);

      if (successfulUrls.length > 0 && onUploadComplete) {
        onUploadComplete(successfulUrls);
      }

      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0 && onUploadError) {
        onUploadError(new Error(`${failures.length} files failed to upload`));
      }
    } catch (error) {
      logger.error('Upload error:', error);
      if (onUploadError) {
        onUploadError(error as Error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Upload single file
   */
  const uploadFile = async (item: UploadItem): Promise<string> => {
    const filePath = path ? `${path}/${item.sanitizedName}` : item.sanitizedName;

    // Update status
    updateUploadStatus(item, 'uploading');

    try {
      // Upload to Supabase
      const { data, error } = await supabase.storage.from(bucket).upload(filePath, item.file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

      const url = urlData.publicUrl;

      // Update status
      updateUploadStatus(item, 'success', url);

      return url;
    } catch (error) {
      logger.error('File upload failed:', error);
      updateUploadStatus(item, 'error', undefined, error?.message || 'Upload failed');
      throw error;
    }
  };

  /**
   * Update upload item status
   */
  const updateUploadStatus = (
    item: UploadItem,
    status: UploadItem['status'],
    url?: string,
    error?: string
  ) => {
    setUploads(prev =>
      prev.map(u =>
        u === item
          ? { ...u, status, url, error, progress: status === 'success' ? 100 : u.progress }
          : u
      )
    );
  };

  /**
   * Remove upload item
   */
  const removeUpload = (item: UploadItem) => {
    setUploads(prev => prev.filter(u => u !== item));
  };

  /**
   * Handle drag and drop
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  /**
   * Get file icon
   */
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Film;
    if (mimeType.includes('pdf')) return FileText;
    return File;
  };

  /**
   * Format file size
   */
  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Secure File Upload</CardTitle>
        <CardDescription>
          {validationConfig.multiple
            ? `Upload up to ${validationConfig.maxFiles || 10} files`
            : 'Upload a single file'}
          {' • Max size: '}
          {formatSize(validationConfig.maxSize || 10 * 1024 * 1024)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload area */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400',
            isUploading && 'opacity-50 cursor-not-allowed'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
          <p className="text-xs text-gray-500 mb-4">
            Allowed: {validationConfig.allowedExtensions?.join(', ')}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple={validationConfig.multiple}
            accept={validationConfig.allowedMimeTypes?.join(',')}
            onChange={e => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
            disabled={isUploading}
          />

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            Choose Files
          </Button>
        </div>

        {/* Upload list */}
        {uploads.length > 0 && (
          <div className="space-y-2">
            {uploads.map((item, index) => {
              const FileIcon = getFileIcon(item.file.type);

              return (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.sanitizedName}</p>
                    <p className="text-xs text-gray-500">{formatSize(item.file.size)}</p>

                    {showProgress && item.status === 'uploading' && (
                      <Progress value={item.progress} className="mt-1 h-1" />
                    )}

                    {item.error && <p className="text-xs text-destructive mt-1">{item.error}</p>}
                  </div>

                  <div className="flex-shrink-0">
                    {item.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {item.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                    {item.status === 'pending' && (
                      <Button size="icon" variant="ghost" onClick={() => removeUpload(item)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload status */}
        {isUploading && (
          <Alert>
            <AlertDescription>Uploading files... Please do not close this window.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
