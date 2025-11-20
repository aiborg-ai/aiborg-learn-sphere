import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { DownloadButton } from '@/components/offline/DownloadButton';
import { OfflineBadge } from '@/components/offline/OfflineBadge';
import { useOfflineContent } from '@/hooks/useOfflineContent';
import { ArrowLeft, Clock, Users, Calendar, CheckCircle } from '@/components/ui/icons';
import type { Course } from './types';

interface CourseHeaderProps {
  course: Course;
  progressPercentage: number;
  courseId: string;
  onBack: () => void;
}

export function CourseHeader({ course, progressPercentage, courseId }: CourseHeaderProps) {
  const { isDownloaded } = useOfflineContent(courseId, 'course');

  return (
    <div className="mb-6">
      <Link to="/dashboard">
        <Button variant="outline" className="btn-outline-ai mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-display font-bold text-white">{course.title}</h1>
            <OfflineBadge
              isOffline={isDownloaded}
              variant="secondary"
              className="bg-white/20 text-white"
            />
            <BookmarkButton
              type="course"
              contentId={courseId}
              title={course.title}
              variant="ghost"
              size="default"
              className="text-white hover:bg-white/10"
              showLabel
            />
            <DownloadButton
              contentId={courseId}
              contentType="course"
              contentName={course.title}
              variant="outline"
              size="default"
              showProgress={true}
            />
          </div>
          <p className="text-white/80 mb-4 max-w-3xl">{course.description}</p>
          <div className="flex flex-wrap items-center gap-4">
            <Badge variant="secondary" className="bg-white/20 text-white">
              {course.level}
            </Badge>
            <span className="flex items-center gap-2 text-white/80">
              <Clock className="h-4 w-4" />
              {course.duration}
            </span>
            <span className="flex items-center gap-2 text-white/80">
              <Users className="h-4 w-4" />
              {course.mode}
            </span>
            <span className="flex items-center gap-2 text-white/80">
              <Calendar className="h-4 w-4" />
              Starts: {new Date(course.start_date).toLocaleDateString()}
            </span>
          </div>
        </div>
        <Card className="w-64">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Completion</span>
                <span className="font-bold">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              {progressPercentage === 100 && (
                <Badge variant="success" className="w-full justify-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed!
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
