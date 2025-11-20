/**
 * Certificates Widget
 *
 * View and download earned certificates
 */

import { useQuery } from '@tanstack/react-query';
import { Award, Download, ExternalLink } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { WidgetComponentProps, BaseWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

interface CertificateWidgetConfig extends BaseWidgetConfig {
  limit?: number;
  showDownload?: boolean;
  showPreview?: boolean;
}

export function CertificatesWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as CertificateWidgetConfig;
  const limit = config.limit || 5;
  const showDownload = config.showDownload !== false;
  const showPreview = config.showPreview !== false;

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates', widget.id, limit],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('certificates')
        .select(
          `
          id,
          certificate_number,
          issued_at,
          certificate_url,
          course:courses(
            id,
            title,
            category
          )
        `
        )
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : false,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (!certificates || certificates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No certificates yet</p>
        <p className="text-xs mt-1">Complete courses to earn certificates!</p>
      </div>
    );
  }

  const handleDownload = (url: string, courseName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `Certificate-${courseName.replace(/\s+/g, '-')}.pdf`;
    link.click();
  };

  return (
    <div className="space-y-3">
      {certificates.map(cert => {
        const course = cert.course as any;
        const issuedDate = new Date(cert.issued_at);

        return (
          <div
            key={cert.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="p-2 rounded-lg bg-green-500/10 shrink-0">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm line-clamp-1">
                {course?.title || 'Certificate'}
              </h4>
              <p className="text-xs text-muted-foreground">#{cert.certificate_number}</p>
              {course?.category && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {course.category}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Issued {issuedDate.toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              {showPreview && cert.certificate_url && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => window.open(cert.certificate_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              {showDownload && cert.certificate_url && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() =>
                    handleDownload(cert.certificate_url, course?.title || 'Certificate')
                  }
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CertificatesWidget;
