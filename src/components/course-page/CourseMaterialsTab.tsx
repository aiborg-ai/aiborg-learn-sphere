import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { DownloadButton } from '@/components/downloads/DownloadButton';
import { WatchLaterButton } from '@/components/playlists/WatchLaterButton';
import { OfflineBadge } from '@/components/offline/OfflineBadge';
import { useOfflineContent } from '@/hooks/useOfflineContent';
import { Video, FileText, Download, BookOpen, Eye } from '@/components/ui/icons';
import type { CourseMaterial } from './types';

interface CourseMaterialsTabProps {
  materials: CourseMaterial[];
  courseId: string;
  onViewMaterial: (material: CourseMaterial) => void;
}

function MaterialRow({
  material,
  courseId,
  onViewMaterial,
}: {
  material: CourseMaterial;
  courseId: string;
  onViewMaterial: (material: CourseMaterial) => void;
}) {
  const { isDownloaded } = useOfflineContent(courseId, 'course');

  const isPdf =
    material.material_type === 'handbook' || material.file_url?.toLowerCase().endsWith('.pdf');
  const isVideo = material.material_type === 'recording';

  return (
    <div
      key={material.id}
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        {isVideo && <Video className="h-5 w-5 text-blue-500" />}
        {isPdf && <FileText className="h-5 w-5 text-green-500" />}
        {!isVideo && !isPdf && <Download className="h-5 w-5 text-purple-500" />}
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{material.title}</h4>
            {isDownloaded && (
              <OfflineBadge
                isOffline={true}
                variant="secondary"
                showIcon={false}
                className="text-xs"
              />
            )}
          </div>
          {material.description && (
            <p className="text-sm text-muted-foreground">{material.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {material.material_type}
            </Badge>
            {material.duration && (
              <span className="text-xs text-muted-foreground">
                {Math.floor(material.duration / 60)} min
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <BookmarkButton
          type="material"
          contentId={material.id}
          title={material.title}
          courseId={parseInt(courseId)}
          variant="ghost"
          size="sm"
        />
        {isVideo && (
          <WatchLaterButton
            materialId={material.id}
            courseId={parseInt(courseId)}
            variant="ghost"
            size="sm"
          />
        )}
        {(isPdf || isVideo) && (
          <Button size="sm" onClick={() => onViewMaterial(material)}>
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
        )}
        <DownloadButton
          materialId={material.id}
          courseId={parseInt(courseId)}
          fileName={material.title || 'download'}
          fileUrl={material.file_url}
          fileSize={material.file_size}
          fileType={
            isVideo
              ? 'video'
              : isPdf
                ? 'pdf'
                : material.material_type === 'presentation'
                  ? 'presentation'
                  : 'other'
          }
          variant="ghost"
          size="sm"
        />
      </div>
    </div>
  );
}

export function CourseMaterialsTab({
  materials,
  courseId,
  onViewMaterial,
}: CourseMaterialsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Materials</CardTitle>
        <CardDescription>Access videos, documents, and resources for this course</CardDescription>
      </CardHeader>
      <CardContent>
        {materials.length > 0 ? (
          <div className="space-y-3">
            {materials.map(material => (
              <MaterialRow
                key={material.id}
                material={material}
                courseId={courseId}
                onViewMaterial={onViewMaterial}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No materials available yet. Materials will be added by your instructor.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
