import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle } from '@/components/ui/icons';

// Components
import { ResultsHeader } from '@/components/assessment-results/ResultsHeader';
import { AchievementsAlert } from '@/components/assessment-results/AchievementsAlert';
import { ScoreCard } from '@/components/assessment-results/ScoreCard';
import { CategoryBreakdownTab } from '@/components/assessment-results/tabs/CategoryBreakdownTab';
import { PeerComparisonTab } from '@/components/assessment-results/tabs/PeerComparisonTab';
import { RecommendationsTab } from '@/components/assessment-results/tabs/RecommendationsTab';
import { GrowthRoadmapTab } from '@/components/assessment-results/tabs/GrowthRoadmapTab';
import { ActionButtons } from '@/components/assessment-results/ActionButtons';

// Hooks
import { useAssessmentResults } from '@/components/assessment-results/hooks/useAssessmentResults';
import { useAchievements } from '@/components/assessment-results/hooks/useAchievements';

// Utils
import {
  handleShare,
  handleDownloadReport,
} from '@/components/assessment-results/utils/shareUtils';

export default function AIAssessmentResults() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Custom hooks
  const { loading, assessment, insights, benchmarks, toolRecommendations, fetchResults } =
    useAssessmentResults(assessmentId);

  const { achievements, checkAchievements } = useAchievements(user?.id);

  // Fetch results on mount
  useEffect(() => {
    if (assessmentId) {
      fetchResults().then(() => {
        if (assessment) {
          checkAchievements(assessment);
        }
      });
    }
  }, [assessmentId, fetchResults, assessment, checkAchievements]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (!assessment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Assessment not found. Please complete an assessment first.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Computed values
  const scorePercentage = Math.round(
    (assessment.total_score / assessment.max_possible_score) * 100
  );
  const radarData = insights.map(insight => ({
    category: insight.category_name,
    score: insight.percentage,
    fullMark: 100,
  }));

  // Event handlers
  const onShare = () => handleShare(assessment);
  const onDownload = () => handleDownloadReport();
  const onRetake = () => navigate('/ai-assessment');
  const onBrowse = () => navigate('/training-programs');

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <ResultsHeader completedAt={assessment.completed_at} />

      {/* New Achievements Alert */}
      <AchievementsAlert achievements={achievements} />

      {/* Main Score Card */}
      <ScoreCard assessment={assessment} scorePercentage={scorePercentage} />

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="breakdown" className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="breakdown">Category Breakdown</TabsTrigger>
          <TabsTrigger value="comparison">Peer Comparison</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="roadmap">Growth Roadmap</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown">
          <CategoryBreakdownTab insights={insights} radarData={radarData} />
        </TabsContent>

        <TabsContent value="comparison">
          <PeerComparisonTab benchmarks={benchmarks} audienceType={assessment.audience_type} />
        </TabsContent>

        <TabsContent value="recommendations">
          <RecommendationsTab insights={insights} toolRecommendations={toolRecommendations} />
        </TabsContent>

        <TabsContent value="roadmap">
          <GrowthRoadmapTab scorePercentage={scorePercentage} />
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <ActionButtons
        onShare={onShare}
        onDownload={onDownload}
        onRetake={onRetake}
        onBrowse={onBrowse}
      />
    </div>
  );
}
