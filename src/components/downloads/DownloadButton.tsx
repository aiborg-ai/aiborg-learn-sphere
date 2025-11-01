import React, { useState, useMemo } from 'react';
import { logger } from '@/utils/logger';
import { Download, CheckCircle, Loader2 } from 'lucide-react';
import { useDownloads, getDeviceInfo } from '@/hooks/useDownloads';
import { useToast } from '@/hooks/use-toast';
import { ActionButton, ActionButtonConfig } from '@/components/shared/ActionButton';
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

  // Define button configuration
  const config: ActionButtonConfig = useMemo(
    () => ({
      defaultIcon: Download,
      activeIcon: CheckCircle,
      loadingIcon: Loader2,
      defaultLabel: 'Download',
      activeLabel: 'Downloaded',
      loadingLabel: 'Downloading...',
      defaultTitle: 'Download',
      activeTitle: 'Downloaded before',
      activeColorClass: 'text-green-600 dark:text-green-500',
    }),
    []
  );

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
      logger.error('Download error:', error);
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
    <ActionButton
      config={config}
      isActive={alreadyDownloaded}
      isLoading={downloading}
      onClick={handleDownload}
      variant={variant}
      size={size}
      className={className}
      showLabel={showLabel}
    />
  );
}
