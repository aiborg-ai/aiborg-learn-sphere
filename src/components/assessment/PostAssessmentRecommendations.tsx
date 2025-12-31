/**
 * Post-Assessment Recommendations Component
 * Modal displaying personalized recommendations after assessment completion
 * Shows next best courses, skill gaps, and action items based on performance
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Target,
  TrendingUp,
  Book,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  X,
} from '@/components/ui/icons';
import {
  StudyAssistantOrchestrator,
  type CourseRecommendation,
} from '@/services/ai/StudyAssistantOrchestrator';
import { useRecommendationInteraction } from '@/hooks/useRecommendations';
import { logger } from '@/utils/logger';

interface AssessmentResult {
  assessment_id: string;
  category: string;
  ability_estimate: number; // IRT theta (-3 to +3)
  confidence: number; // Standard error
  questions_answered: number;
  correct_answers: number;
  accuracy_percentage: number;
  time_spent_minutes: number;
}

interface PostAssessmentRecommendationsProps {
  open: boolean;
  onClose: () => void;
  assessmentResult: AssessmentResult;
  userId: string;
}

export function PostAssessmentRecommendations({
  open,
  onClose,
  assessmentResult,
  userId,
}: PostAssessmentRecommendationsProps) {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);
  const [insights, setInsights] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const { trackClick, trackEnrollment } = useRecommendationInteraction();

  useEffect(() => {
    if (open && userId) {
      fetchRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId, assessmentResult]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      // Get personalized recommendations and insights
      const [recs, insightsData] = await Promise.all([
        StudyAssistantOrchestrator.getCourseRecommendations(userId, 5),
        StudyAssistantOrchestrator.getRecentInsights(userId, 3),
      ]);

      setRecommendations(recs);
      setInsights(insightsData);
    } catch (_error) {
      logger._error('Error fetching post-assessment recommendations:', _error);
    } finally {
      setLoading(false);
    }
  };

  const getAbilityLevel = (
    theta: number
  ): { level: string; color: string; description: string } => {
    if (theta > 1.5) {
      return {
        level: 'Expert',
        color: 'text-purple-600',
        description: 'Exceptional mastery of advanced concepts',
      };
    } else if (theta > 0.5) {
      return {
        level: 'Advanced',
        color: 'text-blue-600',
        description: 'Strong understanding with room for specialization',
      };
    } else if (theta > -0.5) {
      return {
        level: 'Intermediate',
        color: 'text-green-600',
        description: 'Solid foundation, ready for deeper topics',
      };
    } else if (theta > -1.5) {
      return {
        level: 'Beginner',
        color: 'text-yellow-600',
        description: 'Building foundational knowledge',
      };
    } else {
      return {
        level: 'Novice',
        color: 'text-orange-600',
        description: 'Just starting your learning journey',
      };
    }
  };

  const getPerformanceMessage = (accuracy: number) => {
    if (accuracy >= 90)
      return { icon: Trophy, message: 'Outstanding Performance!', color: 'text-yellow-500' };
    if (accuracy >= 75)
      return { icon: CheckCircle2, message: 'Great Job!', color: 'text-green-500' };
    if (accuracy >= 60) return { icon: Target, message: 'Good Progress!', color: 'text-blue-500' };
    return { icon: AlertTriangle, message: 'Keep Learning!', color: 'text-orange-500' };
  };

  const handleCourseClick = (courseId: string, recommendationId?: string) => {
    if (recommendationId) {
      trackClick(recommendationId);
    }
    onClose();
    navigate(`/courses/${courseId}`);
  };

  const handleEnroll = (courseId: string, recommendationId?: string) => {
    if (recommendationId) {
      trackEnrollment(recommendationId);
    }
    onClose();
    navigate(`/courses/${courseId}/enroll`);
  };

  const abilityInfo = getAbilityLevel(assessmentResult.ability_estimate);
  const performanceInfo = getPerformanceMessage(assessmentResult.accuracy_percentage);
  const PerformanceIcon = performanceInfo.icon;

  // Map theta (-3 to +3) to percentage (0 to 100)
  const abilityPercentage = Math.min(
    100,
    Math.max(0, ((assessmentResult.ability_estimate + 3) / 6) * 100)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <PerformanceIcon className={`h-6 w-6 ${performanceInfo.color}`} />
              Assessment Complete!
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Here's your performance summary and personalized recommendations
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="results" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="results">Your Results</TabsTrigger>
            <TabsTrigger value="recommendations">Next Steps</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4 mt-4">
            {/* Performance Summary */}
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
                    <p className="text-3xl font-bold text-primary">
                      {assessmentResult.accuracy_percentage}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Questions</p>
                    <p className="text-3xl font-bold">
                      {assessmentResult.correct_answers}/{assessmentResult.questions_answered}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Time</p>
                    <p className="text-3xl font-bold">{assessmentResult.time_spent_minutes}m</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Level</p>
                    <p className={`text-2xl font-bold ${abilityInfo.color}`}>{abilityInfo.level}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skill Level Breakdown */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Skill Level in {assessmentResult.category}</h3>
                    <Badge className={abilityInfo.color}>{abilityInfo.level}</Badge>
                  </div>
                  <Progress value={abilityPercentage} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-2">{abilityInfo.description}</p>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      What this means:
                    </p>
                    <p className="text-blue-800 dark:text-blue-200">
                      Your ability estimate of {assessmentResult.ability_estimate.toFixed(2)} places
                      you in the {abilityInfo.level.toLowerCase()} range. This helps us recommend
                      content that's perfectly suited to your current skill level.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4 mt-4">
            {loading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Generating personalized recommendations...
                  </p>
                </CardContent>
              </Card>
            ) : recommendations.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Book className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No specific recommendations at this time. Explore our course catalog!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Recommended Courses for You</h3>
                </div>

                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <Card
                      key={rec.course_id || index}
                      className="hover:border-primary transition-colors cursor-pointer"
                      onClick={() => handleCourseClick(rec.course_id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{rec.course_title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {rec.course_description}
                            </p>

                            {rec.reason && (
                              <div className="bg-primary/5 border-l-2 border-primary px-3 py-2 rounded mb-2">
                                <p className="text-xs text-primary font-medium">{rec.reason}</p>
                              </div>
                            )}

                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <Badge variant="outline">{rec.difficulty_level}</Badge>
                              {rec.estimated_hours > 0 && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {rec.estimated_hours}h
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            onClick={e => {
                              e.stopPropagation();
                              handleEnroll(rec.course_id);
                            }}
                            size="sm"
                          >
                            Enroll
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4 mt-4">
            {insights.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Keep learning to unlock AI-powered insights about your progress!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <Card key={insight.id || index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">{insight.title}</h4>
                            <Badge
                              variant={
                                insight.insight_type === 'strength'
                                  ? 'default'
                                  : insight.insight_type === 'weakness'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {insight.insight_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                          {insight.action_items &&
                            Array.isArray(insight.action_items) &&
                            insight.action_items.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {insight.action_items.map((item: unknown, i: number) => (
                                  <li
                                    key={i}
                                    className="text-xs text-primary flex items-start gap-2"
                                  >
                                    <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span>{String(item)}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                navigate('/assessments');
              }}
            >
              Take Another Assessment
            </Button>
            <Button
              onClick={() => {
                onClose();
                navigate('/courses');
              }}
            >
              Browse Courses
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
