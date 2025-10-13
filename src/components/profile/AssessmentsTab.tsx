import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, Target, Brain, Star } from 'lucide-react';
import AssessmentResultsCard from '@/components/assessment/AssessmentResultsCard';

interface AssessmentsTabProps {
  assessments: unknown[];
  loading: boolean;
  onRefresh: () => void;
  onTakeAssessment: () => void;
}

export function AssessmentsTab({
  assessments,
  loading,
  onRefresh,
  onTakeAssessment,
}: AssessmentsTabProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Your AI Assessments
            </CardTitle>
            <CardDescription className="text-white/80">
              Track your AI skill progress over time
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
            <p className="text-white/80">Loading your assessments...</p>
          </div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-white/50 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2 text-xl">No Assessments Yet</h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Take your first AI assessment to discover your augmentation level and get personalized
              learning recommendations
            </p>
            <Button onClick={onTakeAssessment} className="btn-hero">
              <Brain className="h-4 w-4 mr-2" />
              Take Assessment
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Latest Assessment - Full Card */}
            {assessments[0] && (
              <div>
                <h3 className="text-white/80 text-sm font-medium mb-4 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Latest Assessment
                </h3>
                <AssessmentResultsCard assessment={assessments[0]} />
              </div>
            )}

            {/* Previous Assessments - Compact */}
            {assessments.length > 1 && (
              <div>
                <h3 className="text-white/80 text-sm font-medium mb-4">Assessment History</h3>
                <div className="space-y-3">
                  {assessments.slice(1).map((assessment: { id: string }) => (
                    <AssessmentResultsCard key={assessment.id} assessment={assessment} compact />
                  ))}
                </div>
              </div>
            )}

            {/* Take New Assessment Button */}
            <div className="pt-4">
              <Button onClick={onTakeAssessment} className="w-full btn-hero">
                <RefreshCw className="h-4 w-4 mr-2" />
                Take New Assessment
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
