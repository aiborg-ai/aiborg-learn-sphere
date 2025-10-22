/* eslint-disable jsx-a11y/prefer-tag-over-role */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Sparkles,
  TrendingUp,
  Clock,
  Target,
  BookOpen,
  ChevronRight,
  Zap,
  Award,
  Loader2,
  Check,
  Star,
} from 'lucide-react';
import {
  LearningPathRecommendationEngine,
  type LearningPathRecommendation,
} from '@/services/recommendations/LearningPathRecommendationEngine';
import { logger } from '@/utils/logger';
import { useNavigate } from 'react-router-dom';

interface LearningPathRecommendationsProps {
  userId: string;
  assessmentId?: string;
  limit?: number;
}

export function LearningPathRecommendations({
  userId,
  assessmentId,
  limit = 3,
}: LearningPathRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<LearningPathRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<LearningPathRecommendation | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      const recs = await LearningPathRecommendationEngine.generateRecommendations(
        userId,
        assessmentId
      );
      setRecommendations(recs.slice(0, limit));
    } catch (error) {
      logger.error('Error fetching recommendations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recommendations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, assessmentId, limit, toast]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleEnrollInPath = async (recommendation: LearningPathRecommendation) => {
    try {
      setEnrolling(true);
      const pathId = await LearningPathRecommendationEngine.saveAsLearningGoal(
        userId,
        recommendation,
        assessmentId
      );

      if (pathId) {
        toast({
          title: 'Success!',
          description: 'Learning path added to your goals',
        });
        navigate(`/learning-path/ai/${pathId}`);
      } else {
        throw new Error('Failed to create learning path');
      }
    } catch (error) {
      logger.error('Error enrolling in path:', error);
      toast({
        title: 'Error',
        description: 'Failed to create learning path',
        variant: 'destructive',
      });
    } finally {
      setEnrolling(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-500',
      intermediate: 'bg-blue-500',
      advanced: 'bg-purple-500',
      expert: 'bg-orange-500',
    };
    return colors[difficulty] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Learning Path Recommendations
          </CardTitle>
          <CardDescription>
            Complete an AI assessment to get personalized learning paths
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/ai-assessment')} className="w-full">
            Take AI Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          Recommended Learning Paths
        </h3>
        {recommendations.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3" />
            {recommendations.length} paths
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {recommendations.map((rec, index) => (
          <Card
            key={rec.id}
            className={`relative overflow-hidden transition-all hover:shadow-lg ${
              index === 0 ? 'border-purple-500 border-2' : ''
            }`}
          >
            {index === 0 && (
              <div className="absolute top-0 right-0 bg-purple-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                Best Match
              </div>
            )}

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{rec.title}</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${getDifficultyColor(rec.difficulty)} text-white`}>
                      {rec.difficulty}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {rec.matchScore}% match
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{rec.description}</p>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{rec.estimatedWeeks} weeks</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{rec.courses.length} courses</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span>{rec.estimatedHours}h</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Target Level</span>
                  <Badge variant="secondary">{rec.targetLevel}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium">Key Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {rec.skills.slice(0, 3).map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {rec.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{rec.skills.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  Benefits:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {rec.benefits.slice(0, 2).map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <Check className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleEnrollInPath(rec)}
                  disabled={enrolling}
                  className="flex-1"
                  variant={index === 0 ? 'default' : 'outline'}
                >
                  {enrolling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Start Learning
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedPath(rec)}>
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {recommendations.length >= limit && (
        <div className="text-center">
          <Button variant="outline" onClick={() => navigate('/learning-paths')}>
            View All Learning Paths
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Detailed View Modal */}
      {selectedPath && (
        <Card className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-3xl md:max-h-[90vh] overflow-auto z-50 shadow-2xl">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{selectedPath.title}</CardTitle>
                <CardDescription>{selectedPath.reason}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPath(null)}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Clock className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <p className="text-sm font-medium">{selectedPath.estimatedWeeks} weeks</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <BookOpen className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <p className="text-sm font-medium">{selectedPath.courses.length} courses</p>
                <p className="text-xs text-muted-foreground">Content</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Target className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <p className="text-sm font-medium">{selectedPath.matchScore}%</p>
                <p className="text-xs text-muted-foreground">Match</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                <p className="text-sm font-medium">{selectedPath.targetLevel}</p>
                <p className="text-xs text-muted-foreground">Target</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Courses in This Path:</h4>
              <div className="space-y-2">
                {selectedPath.courses.map((course, idx) => (
                  <div key={course.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{course.title}</p>
                      <p className="text-sm text-muted-foreground">{course.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {course.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {course.estimatedHours}h
                        </Badge>
                        {course.addressesWeakness && course.addressesWeakness.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Addresses: {course.addressesWeakness[0]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Benefits:</h4>
              <ul className="space-y-2">
                {selectedPath.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={() => handleEnrollInPath(selectedPath)}
              disabled={enrolling}
              className="w-full"
              size="lg"
            >
              {enrolling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Path...
                </>
              ) : (
                <>
                  Start This Learning Path
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedPath && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSelectedPath(null)}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              setSelectedPath(null);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        />
      )}
    </div>
  );
}
