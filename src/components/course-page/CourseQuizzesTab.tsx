import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Play, HelpCircle, Loader2 } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  difficulty_level: string;
  time_limit_minutes?: number;
  points_reward: number;
  max_attempts: number;
  passing_score_percentage: number;
  [key: string]: unknown;
}

interface CourseQuizzesTabProps {
  quizzes: Quiz[] | null;
  loading: boolean;
  onNavigate: (path: string) => void;
}

export function CourseQuizzesTab({ quizzes, loading, onNavigate }: CourseQuizzesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Course Quizzes
        </CardTitle>
        <CardDescription>Test your knowledge and earn AIBORG points</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : quizzes && quizzes.length > 0 ? (
          <div className="space-y-3">
            {quizzes.map(quiz => (
              <div
                key={quiz.id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{quiz.title}</h4>
                      <Badge variant="outline">{quiz.difficulty_level}</Badge>
                    </div>
                    {quiz.description && (
                      <p className="text-sm text-muted-foreground mb-2">{quiz.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'No limit'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        {quiz.points_reward} pts
                      </span>
                      <span>Attempts: {quiz.max_attempts}</span>
                      <span>Pass: {quiz.passing_score_percentage}%</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" onClick={() => onNavigate(`/quiz/${quiz.id}`)}>
                  <Play className="h-3 w-3 mr-1" />
                  Take Quiz
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No quizzes available yet. Check back later.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
