/**
 * Risk Alert Banner Component
 * Displays alerts for at-risk students and instructors
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import {
  AtRiskDetectionService,
  type RiskScore,
  type RiskLevel,
} from '@/services/analytics/AtRiskDetectionService';
import {
  AlertTriangle,
  TrendingDown,
  Target,
  ChevronDown,
  ChevronUp,
  X,
  Lightbulb,
  Users,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskAlertBannerProps {
  className?: string;
  variant?: 'student' | 'instructor';
}

// Student Risk Banner
export function RiskAlertBanner({ className, variant = 'student' }: RiskAlertBannerProps) {
  if (variant === 'instructor') {
    return <InstructorRiskPanel className={className} />;
  }
  return <StudentRiskAlert className={className} />;
}

// Student Risk Alert Component
function StudentRiskAlert({ className }: { className?: string }) {
  const { user } = useAuth();
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const fetchRiskScore = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const score = await AtRiskDetectionService.getCurrentRiskScore(user.id);
      setRiskScore(score);
    } catch (error) {
      logger.error('Error fetching risk score:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRiskScore();
  }, [fetchRiskScore]);

  // Don't show anything for low risk or dismissed
  if (dismissed || loading || !riskScore || riskScore.level === 'low') {
    return null;
  }

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800';
    }
  };

  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-5 w-5" />;
      case 'moderate':
        return <TrendingDown className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  const getRiskMessage = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return "We've noticed you might be struggling. Let's get you back on track!";
      case 'high':
        return 'Your progress has slowed down. Here are some tips to help you succeed.';
      case 'moderate':
        return 'A gentle reminder to keep up your learning momentum.';
      default:
        return "You're doing well! Keep it up.";
    }
  };

  return (
    <Alert className={cn(getRiskColor(riskScore.level), className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {getRiskIcon(riskScore.level)}
          <div className="flex-1">
            <AlertTitle className="font-semibold mb-1">
              {riskScore.level === 'critical' ? 'Action Needed' : 'Stay on Track'}
            </AlertTitle>
            <AlertDescription>{getRiskMessage(riskScore.level)}</AlertDescription>

            {expanded && (
              <div className="mt-4 space-y-3">
                {/* Top Factor */}
                <div className="flex items-center gap-2 text-sm">
                  <Lightbulb className="h-4 w-4" />
                  <span>
                    <strong>Main area to focus:</strong> {riskScore.topFactor}
                  </span>
                </div>

                {/* Recommendations */}
                {riskScore.recommendedInterventions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Suggestions:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {riskScore.recommendedInterventions.slice(0, 3).map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 px-2"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 p-0"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}

// Instructor At-Risk Students Panel
function InstructorRiskPanel({ className }: { className?: string }) {
  const { user } = useAuth();
  const [atRiskStudents, setAtRiskStudents] = useState<
    Array<
      RiskScore & {
        studentName: string;
        studentEmail: string;
        courseName: string;
      }
    >
  >([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  const fetchAtRiskStudents = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const students = await AtRiskDetectionService.getAtRiskStudentsForInstructor(
        user.id,
        'moderate'
      );
      setAtRiskStudents(students);
    } catch (error) {
      logger.error('Error fetching at-risk students:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAtRiskStudents();
  }, [fetchAtRiskStudents]);

  if (loading) {
    return null;
  }

  if (atRiskStudents.length === 0) {
    return null;
  }

  const getRiskBadgeVariant = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'moderate':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const criticalCount = atRiskStudents.filter(s => s.level === 'critical').length;
  const highCount = atRiskStudents.filter(s => s.level === 'high').length;

  return (
    <Card className={cn('bg-white/5 backdrop-blur-sm border-white/10', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            At-Risk Students
            <Badge variant="destructive" className="ml-2">
              {atRiskStudents.length}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-white/60 hover:text-white"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-white/60 text-sm">
          Students who may need attention
          {criticalCount > 0 && (
            <span className="text-red-400 ml-2">({criticalCount} critical)</span>
          )}
        </p>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3">
          {atRiskStudents.slice(0, 5).map(student => (
            <div
              key={student.userId}
              className={cn(
                'p-3 rounded-lg border',
                student.level === 'critical' && 'border-red-500/30 bg-red-500/10',
                student.level === 'high' && 'border-orange-500/30 bg-orange-500/10',
                student.level === 'moderate' && 'border-yellow-500/30 bg-yellow-500/10'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-white">{student.studentName}</p>
                  <p className="text-xs text-white/60">{student.courseName}</p>
                </div>
                <Badge
                  variant={
                    getRiskBadgeVariant(student.level) as 'destructive' | 'secondary' | 'outline'
                  }
                >
                  {student.level}
                </Badge>
              </div>

              {/* Risk Score Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>Risk Score</span>
                  <span>{Math.round(student.score)}%</span>
                </div>
                <Progress
                  value={student.score}
                  className={cn(
                    'h-2',
                    student.level === 'critical' && '[&>div]:bg-red-500',
                    student.level === 'high' && '[&>div]:bg-orange-500',
                    student.level === 'moderate' && '[&>div]:bg-yellow-500'
                  )}
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-white/60">Main concern: {student.topFactor}</p>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-white/60 hover:text-white"
                    aria-label={`Email ${student.studentName}`}
                  >
                    <Mail className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {atRiskStudents.length > 5 && (
            <Button variant="ghost" className="w-full text-white/60 hover:text-white">
              View all {atRiskStudents.length} at-risk students
              <Users className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Export individual components
export { StudentRiskAlert, InstructorRiskPanel };
