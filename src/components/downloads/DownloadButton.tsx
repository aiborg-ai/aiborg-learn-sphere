import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, Loader2 } from 'lucide-react';
import { useDownloads, getDeviceInfo } from '@/hooks/useDownloads';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { CreateDownloadInput, FileType } from '@/types/content-access';

interface DownloadButtonProps {
  materialId: string;
  courseId?: number;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: FileType;
  mimeType?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
}

export function DownloadButton({
  materialId,
  courseId,
  fileName,
  fileUrl,
  fileSize,
  fileType,
  mimeType,
  variant = 'outline',
  size = 'sm',
  className,
  showLabel = true,
  onDownloadStart,
  onDownloadComplete,
}: DownloadButtonProps) {
  const { toast } = useToast();
  const { trackDownload, isDownloaded } = useDownloads();
  const [downloading, setDownloading] = useState(false);

  const alreadyDownloaded = isDownloaded(materialId);

  const handleDownload = async () => {
    try {
      setDownloading(true);

      if (onDownloadStart) {
        onDownloadStart();
      }

      // Track the download
      const downloadInput: CreateDownloadInput = {
        material_id: materialId,
        course_id: courseId,
        file_name: fileName,
        downloaded_url: fileUrl,
        file_size: fileSize,
        file_type: fileType,
        mime_type: mimeType,
        device_info: getDeviceInfo(),
      };

      await trackDownload(downloadInput);

      // Trigger actual download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Download Started',
        description: `${fileName} is being downloaded`,
      });

      if (onDownloadComplete) {
        onDownloadComplete();
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download the file',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={downloading}
      className={cn(
        'transition-colors',
        alreadyDownloaded && 'text-green-600 dark:text-green-500',
        className
      )}
      title={alreadyDownloaded ? 'Downloaded before' : 'Download'}
    >
      {downloading ? (
        <Loader2 className={cn('h-4 w-4 animate-spin', showLabel && 'mr-2')} />
      ) : alreadyDownloaded ? (
        <CheckCircle className={cn('h-4 w-4', showLabel && 'mr-2')} />
      ) : (
        <Download className={cn('h-4 w-4', showLabel && 'mr-2')} />
      )}
      {showLabel && (downloading ? 'Downloading...' : alreadyDownloaded ? 'Downloaded' : 'Download')}
    </Button>
  );
}
