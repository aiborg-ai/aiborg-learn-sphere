import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Users, Globe, CheckCircle, User } from '@/components/ui/icons';
import { logger } from '@/utils/logger';

interface CourseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnroll: () => void;
  course: {
    title: string;
    category: string;
    audience: string;
    level: string;
    duration: string;
    mode: string;
    keywords: string[];
    description: string;
    features: string[];
    startDate?: string;
    start_date?: string;
    price?: string;
    prerequisites?: string;
  } | null;
}

export const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({
  isOpen,
  onClose,
  onEnroll,
  course,
}) => {
  logger.log('CourseDetailsModal rendered with isOpen:', isOpen, 'course:', course?.title);
  const handleEnrollClick = () => {
    onClose();
    onEnroll();
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{course.title}</DialogTitle>
          <DialogDescription className="text-lg">{course.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="font-medium">Category:</span>
                <Badge variant="secondary">{course.category}</Badge>
              </div>

              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-primary mt-0.5" />
                <span className="font-medium">Audience:</span>
                <div className="flex flex-wrap gap-1">
                  {(course.audiences || [course.audience]).filter(Boolean).map((aud, index) => (
                    <Badge key={index} variant="outline">
                      {aud}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">Level:</span>
                <Badge variant="outline">{course.level}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">Duration:</span>
                <span>{course.duration}</span>
              </div>

              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="font-medium">Mode:</span>
                <Badge variant="outline">{course.mode}</Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Start Date:</span>
                <span>{course.startDate || course.start_date}</span>
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Technologies & Skills</h3>
            <div className="flex flex-wrap gap-2">
              {course.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          {/* Key Learning Points */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              What You'll Learn
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Course Description */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Course Description</h3>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm leading-relaxed">{course.description}</p>
            </div>
          </div>

          {/* Pricing & Enrollment */}
          <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">Ready to Get Started?</h3>
                <p className="text-muted-foreground">
                  Join this course and accelerate your learning journey.
                </p>
              </div>
              {course.price && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold text-primary">{course.price}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button onClick={handleEnrollClick} className="flex-1">
                Enroll Now
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
