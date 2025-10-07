import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Clock, Trophy, PenTool, Loader2 } from 'lucide-react';

interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  estimated_time_minutes?: number;
  points_reward: number;
  [key: string]: unknown;
}

interface CourseExercisesTabProps {
  exercises: Exercise[] | null;
  loading: boolean;
  onNavigate: (path: string) => void;
}

export function CourseExercisesTab({ exercises, loading, onNavigate }: CourseExercisesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          Practice Exercises
        </CardTitle>
        <CardDescription>Submit assignments and get feedback from instructors</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : exercises && exercises.length > 0 ? (
          <div className="space-y-3">
            {exercises.map(exercise => (
              <div
                key={exercise.id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{exercise.title}</h4>
                      <Badge variant="outline">{exercise.difficulty_level}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{exercise.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {exercise.estimated_time_minutes
                          ? `~${exercise.estimated_time_minutes} min`
                          : 'Self-paced'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        {exercise.points_reward} pts
                      </span>
                    </div>
                  </div>
                </div>
                <Button size="sm" onClick={() => onNavigate(`/exercise/${exercise.id}`)}>
                  <PenTool className="h-3 w-3 mr-1" />
                  Start Exercise
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <PenTool className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No exercises available yet. Check back later.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
