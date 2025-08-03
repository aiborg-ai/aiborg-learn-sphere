import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  FileText, 
  Presentation, 
  Download, 
  Lock,
  Clock,
  Calendar
} from "lucide-react";
import { useCourseMaterials, CourseMaterial } from "@/hooks/useCourseMaterials";
import { useEnrollments } from "@/hooks/useEnrollments";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface CourseRecordingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: number;
  courseTitle: string;
}

export function CourseRecordingsModal({
  open,
  onOpenChange,
  courseId,
  courseTitle,
}: CourseRecordingsModalProps) {
  const { materials, loading, error } = useCourseMaterials(courseId);
  const { isEnrolled } = useEnrollments();
  const { user } = useAuth();
  const [isUserEnrolled, setIsUserEnrolled] = useState(false);

  useEffect(() => {
    if (user && courseId) {
      setIsUserEnrolled(isEnrolled(courseId));
    }
  }, [user, courseId, isEnrolled]);

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'recording':
        return <Play className="h-4 w-4" />;
      case 'handbook':
        return <FileText className="h-4 w-4" />;
      case 'presentation':
        return <Presentation className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getMaterialBadgeColor = (type: string) => {
    switch (type) {
      case 'recording':
        return 'bg-red-100 text-red-800';
      case 'handbook':
        return 'bg-blue-100 text-blue-800';
      case 'presentation':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const recordings = materials.filter(m => m.material_type === 'recording');
  const handbooks = materials.filter(m => m.material_type === 'handbook');
  const presentations = materials.filter(m => m.material_type === 'presentation');
  const otherMaterials = materials.filter(m => m.material_type === 'other');

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Course Materials - {courseTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Authentication Required</p>
            <p className="text-muted-foreground mt-2">
              Please log in to access course materials and recordings.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isUserEnrolled) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Course Materials - {courseTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Enrollment Required</p>
            <p className="text-muted-foreground mt-2">
              You need to enroll in this course to access recordings and materials.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => onOpenChange(false)}
            >
              Enroll in Course
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Course Materials - {courseTitle}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading materials...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">Error: {error}</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No Materials Available</p>
            <p className="text-muted-foreground mt-2">
              Course materials will be added as they become available.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recordings Section */}
            {recordings.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Play className="h-5 w-5 text-red-600" />
                  Recordings ({recordings.length})
                </h3>
                <div className="grid gap-3">
                  {recordings.map((material) => (
                    <Card key={material.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                {getMaterialIcon(material.material_type)}
                              </div>
                              <div>
                                <h4 className="font-medium">{material.title}</h4>
                                {material.description && (
                                  <p className="text-sm text-muted-foreground">{material.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {material.duration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(material.duration)}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(material.created_at), 'MMM d, yyyy')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getMaterialBadgeColor(material.material_type)}>
                              Recording
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(material.file_url, '_blank')}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Watch
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Handbooks Section */}
            {handbooks.length > 0 && (
              <>
                {recordings.length > 0 && <Separator />}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Handbooks & Materials ({handbooks.length})
                  </h3>
                  <div className="grid gap-3">
                    {handbooks.map((material) => (
                      <Card key={material.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  {getMaterialIcon(material.material_type)}
                                </div>
                                <div>
                                  <h4 className="font-medium">{material.title}</h4>
                                  {material.description && (
                                    <p className="text-sm text-muted-foreground">{material.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(material.created_at), 'MMM d, yyyy')}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getMaterialBadgeColor(material.material_type)}>
                                Handbook
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(material.file_url, '_blank')}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Presentations Section */}
            {presentations.length > 0 && (
              <>
                {(recordings.length > 0 || handbooks.length > 0) && <Separator />}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Presentation className="h-5 w-5 text-green-600" />
                    Presentations ({presentations.length})
                  </h3>
                  <div className="grid gap-3">
                    {presentations.map((material) => (
                      <Card key={material.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                  {getMaterialIcon(material.material_type)}
                                </div>
                                <div>
                                  <h4 className="font-medium">{material.title}</h4>
                                  {material.description && (
                                    <p className="text-sm text-muted-foreground">{material.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(material.created_at), 'MMM d, yyyy')}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getMaterialBadgeColor(material.material_type)}>
                                Presentation
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(material.file_url, '_blank')}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}