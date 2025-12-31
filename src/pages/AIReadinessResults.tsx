// ============================================================================
// AI-Readiness Assessment Results Page
// Displays comprehensive results with scores, benchmarks, and recommendations
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAssessment } from '@/hooks/useAIReadinessAssessment';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ReadinessScoreCard,
  DimensionBreakdown,
  RecommendationsRoadmap,
} from '@/components/ai-readiness/results';
import { PDFReport } from '@/components/ai-readiness/results/PDFReport';
import { createRoadmap } from '@/services/ai-readiness/RecommendationGenerator';
import { Loader2, AlertCircle, ArrowLeft, Download, Share2, RefreshCw } from 'lucide-react';
import type { ReadinessRecommendation, DimensionScore, DimensionType } from '@/types/aiReadiness';

export default function AIReadinessResults() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: assessment, isLoading: assessmentLoading } = useAssessment(assessmentId || null);
  const [recommendations, setRecommendations] = useState<ReadinessRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Check authentication
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to view assessment results.',
        variant: 'destructive',
      });
      navigate('/auth', {
        state: { returnTo: `/assessment/ai-readiness/results/${assessmentId}` },
      });
    }
  }, [authLoading, user, navigate, toast, assessmentId]);

  // Load recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!assessmentId) return;

      try {
        const { data, error } = await supabase
          .from('readiness_recommendations')
          .select('*')
          .eq('assessment_id', assessmentId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setRecommendations((data as ReadinessRecommendation[]) || []);
      } catch (_error) {
        toast({
          title: 'Error',
          description: 'Failed to load recommendations.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    loadRecommendations();
  }, [assessmentId, toast]);

  // Handle share
  const handleShare = () => {
    const shareText = `I completed an AI-Readiness Assessment and scored ${Math.round(
      assessment?.overall_readiness_score || 0
    )}/100! Check out my ${assessment?.maturity_level} level results.`;

    if (navigator.share) {
      navigator.share({
        title: 'My AI-Readiness Results',
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: 'Copied to clipboard',
        description: 'Share text copied to clipboard!',
      });
    }
  };

  // Handle PDF download
  const handleDownload = async () => {
    if (!assessment) return;

    setIsGeneratingPDF(true);
    try {
      // Prepare dimension scores
      const dimensionScores: DimensionScore[] = [
        {
          dimension: 'overall' as DimensionType,
          score: assessment.overall_readiness_score || 0,
          weighted_score: assessment.overall_readiness_score || 0,
          question_count: 64,
          answered_count: 64,
        },
        {
          dimension: 'strategic' as DimensionType,
          score: assessment.strategic_alignment_score || 0,
          weighted_score: assessment.strategic_alignment_score || 0,
          question_count: 10,
          answered_count: 10,
        },
        {
          dimension: 'data' as DimensionType,
          score: assessment.data_maturity_score || 0,
          weighted_score: assessment.data_maturity_score || 0,
          question_count: 12,
          answered_count: 12,
        },
        {
          dimension: 'tech' as DimensionType,
          score: assessment.tech_infrastructure_score || 0,
          weighted_score: assessment.tech_infrastructure_score || 0,
          question_count: 10,
          answered_count: 10,
        },
        {
          dimension: 'human' as DimensionType,
          score: assessment.human_capital_score || 0,
          weighted_score: assessment.human_capital_score || 0,
          question_count: 12,
          answered_count: 12,
        },
        {
          dimension: 'process' as DimensionType,
          score: assessment.process_maturity_score || 0,
          weighted_score: assessment.process_maturity_score || 0,
          question_count: 10,
          answered_count: 10,
        },
        {
          dimension: 'change' as DimensionType,
          score: assessment.change_readiness_score || 0,
          weighted_score: assessment.change_readiness_score || 0,
          question_count: 10,
          answered_count: 10,
        },
      ];

      // Generate PDF
      const blob = await pdf(
        <PDFReport
          assessment={assessment}
          dimensionScores={dimensionScores}
          recommendations={recommendations}
        />
      ).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AI-Readiness-Report-${assessment.company_name || 'Assessment'}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'PDF Downloaded',
        description: 'Your AI-Readiness report has been downloaded successfully!',
      });
    } catch (_error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Handle retake
  const handleRetake = () => {
    navigate('/assessment/ai-readiness');
  };

  // Loading state
  if (authLoading || assessmentLoading || isLoadingRecommendations) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/80">Loading your results...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-hero py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Assessment not found. Please check the URL or try again.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/assessment/ai-readiness')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessment
          </Button>
        </div>
      </div>
    );
  }

  // Check if assessment is completed
  if (assessment.status !== 'completed') {
    return (
      <div className="min-h-screen bg-gradient-hero py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This assessment is not yet completed. Please complete all sections to see your
              results.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => navigate(`/assessment/ai-readiness?id=${assessmentId}`)}
            className="mt-4"
          >
            Continue Assessment
          </Button>
        </div>
      </div>
    );
  }

  // Prepare dimension scores
  const dimensionScores: DimensionScore[] = [
    {
      dimension: 'overall' as DimensionType,
      score: assessment.overall_readiness_score || 0,
      weighted_score: assessment.overall_readiness_score || 0,
      question_count: 64,
      answered_count: 64,
    },
    {
      dimension: 'strategic' as DimensionType,
      score: assessment.strategic_alignment_score || 0,
      weighted_score: assessment.strategic_alignment_score || 0,
      question_count: 10,
      answered_count: 10,
    },
    {
      dimension: 'data' as DimensionType,
      score: assessment.data_maturity_score || 0,
      weighted_score: assessment.data_maturity_score || 0,
      question_count: 12,
      answered_count: 12,
    },
    {
      dimension: 'tech' as DimensionType,
      score: assessment.tech_infrastructure_score || 0,
      weighted_score: assessment.tech_infrastructure_score || 0,
      question_count: 10,
      answered_count: 10,
    },
    {
      dimension: 'human' as DimensionType,
      score: assessment.human_capital_score || 0,
      weighted_score: assessment.human_capital_score || 0,
      question_count: 12,
      answered_count: 12,
    },
    {
      dimension: 'process' as DimensionType,
      score: assessment.process_maturity_score || 0,
      weighted_score: assessment.process_maturity_score || 0,
      question_count: 10,
      answered_count: 10,
    },
    {
      dimension: 'change' as DimensionType,
      score: assessment.change_readiness_score || 0,
      weighted_score: assessment.change_readiness_score || 0,
      question_count: 10,
      answered_count: 10,
    },
  ];

  // Create roadmap from recommendations
  const roadmap = createRoadmap(recommendations);

  return (
    <div className="min-h-screen bg-gradient-hero py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Your AI-Readiness Results</h1>
            <p className="text-white/70">
              Completed on {new Date(assessment.completed_at || '').toLocaleDateString()}
              {assessment.company_name && ` • ${assessment.company_name}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleShare}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={isGeneratingPDF}
              className="text-white border-white/20 hover:bg-white/10"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleRetake}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retake
            </Button>
          </div>
        </div>

        {/* Overall Score Card */}
        <ReadinessScoreCard
          score={assessment.overall_readiness_score || 0}
          maturityLevel={assessment.maturity_level || 'awareness'}
          industryPercentile={assessment.industry_percentile || undefined}
        />

        {/* Dimension Breakdown */}
        <DimensionBreakdown dimensions={dimensionScores} />

        {/* Recommendations Roadmap */}
        {recommendations.length > 0 && <RecommendationsRoadmap roadmap={roadmap} />}

        {/* Footer Actions */}
        <div className="flex justify-center gap-4 pt-8">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button
            onClick={handleRetake}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Take Assessment Again
          </Button>
        </div>
      </div>
    </div>
  );
}
