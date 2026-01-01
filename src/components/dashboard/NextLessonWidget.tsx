/**
 * Next Lesson Widget Component
 * Displays AI-powered next lesson recommendation on the dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import {
  NextLessonRecommendationService,
  type NextLessonRecommendation,
} from '@/services/recommendations/NextLessonRecommendationService';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Clock,
  X,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NextLessonWidgetProps {
  className?: string;
  context?: 'dashboard' | 'lesson_complete' | 'session_start';
  showLingo?: boolean;
}

export function NextLessonWidget({
  className,
  context = 'dashboard',
  showLingo = true,
}: NextLessonWidgetProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<NextLessonRecommendation | null>(null);
  const [lingoRecommendation, setLingoRecommendation] = useState<NextLessonRecommendation | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [general, lingo] = await Promise.all([
        NextLessonRecommendationService.getNextRecommendation(user.id, context),
        showLingo
          ? NextLessonRecommendationService.getNextLingoLesson(user.id)
          : Promise.resolve(null),
      ]);

      setRecommendation(general);
      setLingoRecommendation(lingo);
    } catch (_error) {
      logger.error('Error fetching recommendations:', _error);
    } finally {
      setLoading(false);
    }
  }, [user, context, showLingo]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleClick = async (rec: NextLessonRecommendation) => {
    if (!user) return;

    // Track the click
    await NextLessonRecommendationService.trackClicked(rec.id, user.id);

    // Navigate based on content type
    if (rec.contentType === 'lingo_lesson') {
      navigate(`/lingo/lesson/${rec.contentId}`);
    } else if (rec.contentType === 'lesson') {
      navigate(`/lesson/${rec.contentId}`);
    } else if (rec.contentType === 'course_module') {
      navigate(`/module/${rec.contentId}`);
    } else if (rec.contentType === 'assessment') {
      navigate(`/assessment/${rec.contentId}`);
    }
  };

  const handleDismiss = async (rec: NextLessonRecommendation) => {
    if (!user) return;

    await NextLessonRecommendationService.dismiss(rec.id, user.id);

    if (rec === recommendation) {
      setRecommendation(null);
    } else if (rec === lingoRecommendation) {
      setLingoRecommendation(null);
    }

    // If all dismissed, mark as dismissed
    if (!recommendation && !lingoRecommendation) {
      setDismissed(true);
    }
  };

  const handleRefresh = () => {
    setDismissed(false);
    fetchRecommendations();
  };

  if (dismissed || (!loading && !recommendation && !lingoRecommendation)) {
    return (
      <Card className={cn('bg-white/5 backdrop-blur-sm border-white/10', className)}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles className="h-10 w-10 text-white/30 mb-4" />
          <p className="text-white/60 mb-4">No recommendations right now</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="text-white/60 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={cn('bg-white/5 backdrop-blur-sm border-white/10', className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48 bg-white/10" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full bg-white/10" />
          <Skeleton className="h-20 w-full bg-white/10" />
        </CardContent>
      </Card>
    );
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'lingo_lesson':
        return <GraduationCap className="h-5 w-5" />;
      case 'lesson':
        return <BookOpen className="h-5 w-5" />;
      case 'assessment':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const getContentTypeBadge = (type: string) => {
    switch (type) {
      case 'lingo_lesson':
        return 'Lingo';
      case 'lesson':
        return 'Lesson';
      case 'course_module':
        return 'Module';
      case 'assessment':
        return 'Assessment';
      default:
        return type;
    }
  };

  const RecommendationCard = ({
    rec,
    highlight = false,
  }: {
    rec: NextLessonRecommendation;
    highlight?: boolean;
  }) => (
    <div
      className={cn(
        'p-4 rounded-lg border transition-all cursor-pointer',
        highlight
          ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30 hover:border-amber-500/50'
          : 'bg-white/5 border-white/10 hover:border-white/20'
      )}
      onClick={() => handleClick(rec)}
      onKeyDown={e => e.key === 'Enter' && handleClick(rec)}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getContentTypeIcon(rec.contentType)}
          <Badge variant="outline" className="text-xs">
            {getContentTypeBadge(rec.contentType)}
          </Badge>
          {highlight && (
            <Badge className="bg-amber-500 text-white text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Pick
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-white/40 hover:text-white"
          onClick={e => {
            e.stopPropagation();
            handleDismiss(rec);
          }}
          aria-label="Dismiss recommendation"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <h4 className="font-semibold text-white mb-1 line-clamp-1">{rec.title}</h4>

      {rec.description && (
        <p className="text-white/60 text-sm mb-2 line-clamp-2">{rec.description}</p>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Clock className="h-3 w-3" />
          <span>{rec.estimatedTime || '10-15'} min</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-amber-400">
          <span>Start now</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>

      {rec.reason && <p className="text-xs text-amber-400/80 mt-2 italic">{rec.reason}</p>}
    </div>
  );

  return (
    <Card className={cn('bg-white/5 backdrop-blur-sm border-white/10', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Up Next
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 w-8 p-0 text-white/40 hover:text-white"
            aria-label="Refresh recommendations"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-white/60 text-sm">AI-powered recommendations based on your progress</p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Primary recommendation (highlighted) */}
        {recommendation && <RecommendationCard rec={recommendation} highlight={true} />}

        {/* Lingo recommendation */}
        {lingoRecommendation && (
          <RecommendationCard rec={lingoRecommendation} highlight={!recommendation} />
        )}
      </CardContent>
    </Card>
  );
}
