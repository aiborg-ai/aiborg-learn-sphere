import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  BookOpen,
  Clock,
  RefreshCw,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
} from '@/components/ui/icons';
import { useToast } from '@/hooks/use-toast';

interface StudyRecommendation {
  id: string;
  recommendation_type:
    | 'material'
    | 'study_time'
    | 'review'
    | 'assignment_priority'
    | 'learning_path';
  title: string;
  description: string;
  priority: number;
  status: 'active' | 'completed' | 'dismissed';
  related_course_id: number | null;
  expires_at: string | null;
  created_at: string;
}

const recommendationIcons = {
  material: { icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
  study_time: { icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
  review: { icon: RefreshCw, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
  assignment_priority: { icon: Target, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' },
  learning_path: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
};

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

export function StudyRecommendations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<StudyRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = useCallback(async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_study_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .or('expires_at.is.null,expires_at.gte.now()')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRecommendations(data || []);
    } catch (error) {
      logger.error('Error fetching study recommendations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load study recommendations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user, fetchRecommendations]);

  const handleCompleteRecommendation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_study_recommendations')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;

      setRecommendations(prev => prev.filter(rec => rec.id !== id));

      toast({
        title: 'Great job!',
        description: 'Recommendation marked as completed',
      });
    } catch (error) {
      logger.error('Error completing recommendation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update recommendation',
        variant: 'destructive',
      });
    }
  };

  const handleDismissRecommendation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_study_recommendations')
        .update({ status: 'dismissed' })
        .eq('id', id);

      if (error) throw error;

      setRecommendations(prev => prev.filter(rec => rec.id !== id));

      toast({
        title: 'Dismissed',
        description: 'Recommendation has been dismissed',
      });
    } catch (error) {
      logger.error('Error dismissing recommendation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update recommendation',
        variant: 'destructive',
      });
    }
  };

  const getPriorityLevel = (priority: number): 'high' | 'medium' | 'low' => {
    if (priority >= 8) return 'high';
    if (priority >= 5) return 'medium';
    return 'low';
  };

  const getPriorityBadge = (priority: number) => {
    const level = getPriorityLevel(priority);
    const colorClass = priorityColors[level];

    return (
      <div className="flex items-center gap-1">
        <div className={`h-2 w-2 rounded-full ${colorClass}`} />
        <span className="text-xs font-medium capitalize">{level}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Study Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Study Recommendations
        </CardTitle>
        <CardDescription>AI-powered suggestions to improve your learning</CardDescription>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No active recommendations right now</p>
            <p className="text-xs text-muted-foreground mt-2">
              Keep studying, and our AI will provide personalized recommendations!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {recommendations.map(recommendation => {
                const config = recommendationIcons[recommendation.recommendation_type];
                const Icon = config.icon;

                return (
                  <div
                    key={recommendation.id}
                    className={`p-4 rounded-lg border ${config.bg} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${config.bg} border`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-sm">{recommendation.title}</h4>
                          {getPriorityBadge(recommendation.priority)}
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">
                          {recommendation.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {recommendation.recommendation_type.replace('_', ' ')}
                            </Badge>
                            {recommendation.expires_at && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(recommendation.expires_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCompleteRecommendation(recommendation.id)}
                              className="h-8 w-8 p-0"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDismissRecommendation(recommendation.id)}
                              className="h-8 w-8 p-0"
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
