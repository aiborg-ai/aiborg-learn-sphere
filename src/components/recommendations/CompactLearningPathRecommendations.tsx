import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  TrendingUp,
  Clock,
  BookOpen,
  ChevronRight,
  Loader2,
  ArrowRight,
} from '@/components/ui/icons';
import {
  LearningPathRecommendationEngine,
  type LearningPathRecommendation,
} from '@/services/recommendations/LearningPathRecommendationEngine';
import { logger } from '@/utils/logger';
import { useNavigate } from 'react-router-dom';

interface CompactLearningPathRecommendationsProps {
  userId: string;
  assessmentId?: string;
  showHeader?: boolean;
}

export function CompactLearningPathRecommendations({
  userId,
  assessmentId,
  showHeader = true,
}: CompactLearningPathRecommendationsProps) {
  const [topRecommendation, setTopRecommendation] = useState<LearningPathRecommendation | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTopRecommendation = useCallback(async () => {
    try {
      setLoading(true);
      const recs = await LearningPathRecommendationEngine.generateRecommendations(
        userId,
        assessmentId
      );
      if (recs.length > 0) {
        setTopRecommendation(recs[0]);
      }
    } catch (_error) {
      logger._error('Error fetching recommendation:', _error);
    } finally {
      setLoading(false);
    }
  }, [userId, assessmentId]);

  useEffect(() => {
    fetchTopRecommendation();
  }, [fetchTopRecommendation]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  if (!topRecommendation) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Get Personalized Recommendations
          </CardTitle>
          <CardDescription>Take an AI assessment to unlock your learning path</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/ai-assessment')} className="w-full">
            Take Assessment
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Recommended Path
            </CardTitle>
            <Badge className="bg-purple-600 text-white gap-1">
              <TrendingUp className="h-3 w-3" />
              {topRecommendation.matchScore}% match
            </Badge>
          </div>
        </CardHeader>
      )}

      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-base mb-1">{topRecommendation.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {topRecommendation.description}
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-purple-600" />
            <span className="font-medium">{topRecommendation.estimatedWeeks}w</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span className="font-medium">{topRecommendation.courses.length} courses</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {topRecommendation.difficulty}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/learning-paths')}
            variant="default"
            className="flex-1"
            size="sm"
          >
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
