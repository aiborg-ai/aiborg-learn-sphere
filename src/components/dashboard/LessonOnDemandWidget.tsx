/**
 * Lesson on Demand Widget
 * Dashboard card for AI-powered lesson generation
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BookOpen, Clock, Eye, Loader2 } from 'lucide-react';
import { LessonOnDemandService, type GeneratedLesson } from '@/services/lesson-on-demand';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

export function LessonOnDemandWidget() {
  const [recentLessons, setRecentLessons] = useState<GeneratedLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentLessons = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const lessons = await LessonOnDemandService.getLessons({
          limit: 3,
          sortBy: 'created_at',
          sortOrder: 'desc',
        });
        setRecentLessons(lessons);
      } catch (error) {
        logger.error('Error fetching recent lessons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentLessons();
  }, [user]);

  const handleGenerateNew = () => {
    navigate('/lessons/generate');
  };

  const handleViewLesson = (lessonId: string) => {
    navigate(`/lessons/${lessonId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'archived':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20 transition-all">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">Lesson on Demand</CardTitle>
              <CardDescription className="text-white/60 text-sm">
                AI-generated custom lessons
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Generate Button */}
        <Button
          onClick={handleGenerateNew}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          size="lg"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Generate New Lesson
        </Button>

        {/* Recent Lessons */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-white/80">Recent Lessons</h4>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-white/40" />
            </div>
          ) : recentLessons.length === 0 ? (
            <div className="text-center py-6">
              <BookOpen className="h-12 w-12 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/40">No lessons yet</p>
              <p className="text-xs text-white/30 mt-1">Generate your first lesson!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentLessons.map(lesson => (
                <div
                  key={lesson.id}
                  onClick={() => handleViewLesson(lesson.id)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-amber-400 transition-colors">
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusColor(lesson.status)}`}
                        >
                          {lesson.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-white/40">
                          <Clock className="h-3 w-3" />
                          <span>{lesson.estimated_duration_minutes}min</span>
                        </div>
                      </div>
                    </div>
                    <Eye className="h-4 w-4 text-white/40 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Link */}
        {recentLessons.length > 0 && (
          <Button
            onClick={() => navigate('/lessons')}
            variant="ghost"
            className="w-full text-white/60 hover:text-white hover:bg-white/5"
            size="sm"
          >
            View All Lessons →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
