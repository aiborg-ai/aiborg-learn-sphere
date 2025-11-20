import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Target, Award, AlertCircle } from '@/components/ui/icons';
import type { Course, CourseMaterial, Assignment } from './types';

interface CourseOverviewTabProps {
  course: Course;
  materials: CourseMaterial[];
  assignments: Assignment[];
}

export function CourseOverviewTab({ course, materials, assignments }: CourseOverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Course Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {course.features && course.features.length > 0 ? (
                course.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">No features listed</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Prerequisites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{course.prerequisites || 'No prerequisites required'}</p>
          </CardContent>
        </Card>
      </div>

      {materials.length === 0 && assignments.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Course materials are being prepared. They will be available soon. Check back later or
            contact your instructor.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
