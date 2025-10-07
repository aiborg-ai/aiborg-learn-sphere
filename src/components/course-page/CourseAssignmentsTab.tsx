import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import type { Assignment } from './types';

interface CourseAssignmentsTabProps {
  assignments: Assignment[];
  onNavigate: (path: string) => void;
}

export function CourseAssignmentsTab({ assignments, onNavigate }: CourseAssignmentsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignments & Homework</CardTitle>
        <CardDescription>View and submit your course assignments</CardDescription>
      </CardHeader>
      <CardContent>
        {assignments.length > 0 ? (
          <div className="space-y-3">
            {assignments.map(assignment => (
              <div
                key={assignment.id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{assignment.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                  </div>
                  {assignment.due_date && (
                    <Badge variant="outline">
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate(`/assignment/${assignment.id}`)}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  View Assignment
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No assignments yet. Assignments will be posted by your instructor.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
