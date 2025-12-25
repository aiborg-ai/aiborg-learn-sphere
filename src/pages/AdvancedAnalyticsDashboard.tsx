import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

// Existing components
import { SkillGapAnalysis } from '@/components/analytics/SkillGapAnalysis';
import { PeerComparison } from '@/components/analytics/PeerComparison';
import { StudyTimeRecommendations } from '@/components/analytics/StudyTimeRecommendations';
import ExportModal from '@/components/analytics/ExportModal';

// New components
import { GoalProgressDashboard } from '@/components/analytics/GoalProgressDashboard';
import { LearningVelocityCard } from '@/components/analytics/LearningVelocityCard';
import { CompetencyHeatMap } from '@/components/analytics/CompetencyHeatMap';

import {
  BarChart3,
  Target,
  Zap,
  TrendingUp,
  Award,
  Download,
  Activity,
  BookOpen,
  Lightbulb,
  Loader2,
} from '@/components/ui/icons';
import { exportAnalyticsToPDF, type AnalyticsSection, type DateRange } from '@/utils/pdfExport';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export default function AdvancedAnalyticsDashboard() {
  const { user } = useAuth();
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      toast.info('Generating PDF report... This may take a few moments', { duration: 3000 });

      const sections: AnalyticsSection[] = [
        {
          title: 'Performance Overview',
          elementId: 'advanced-analytics-overview',
          includeInExport: true,
        },
        { title: 'Goal Progress', elementId: 'advanced-analytics-goals', includeInExport: true },
        {
          title: 'Learning Velocity',
          elementId: 'advanced-analytics-velocity',
          includeInExport: true,
        },
        {
          title: 'Competency Analysis',
          elementId: 'advanced-analytics-competency',
          includeInExport: true,
        },
        {
          title: 'Personalized Insights',
          elementId: 'advanced-analytics-insights',
          includeInExport: true,
        },
      ];

      const dateRange: DateRange = {
        startDate: null,
        endDate: null,
        preset: 'All Time',
      };

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Advanced-Analytics-${timestamp}.pdf`;

      await exportAnalyticsToPDF(sections, dateRange, filename);
      toast.success('PDF report generated successfully!');
    } catch (error) {
      logger.error('PDF export error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Advanced Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into your learning journey
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">
            <Activity className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
          <Button onClick={handleExportPDF} variant="outline" disabled={isExportingPDF}>
            {isExportingPDF ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExportingPDF ? 'Exporting...' : 'Export PDF'}
          </Button>
          <Button onClick={() => setShowExportModal(true)} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Main Content - Tabbed Interface */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Goals</span>
          </TabsTrigger>
          <TabsTrigger value="velocity" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Velocity</span>
          </TabsTrigger>
          <TabsTrigger value="competency" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Competency</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div id="advanced-analytics-overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Overview
                </CardTitle>
                <CardDescription>
                  Quick snapshot of your learning performance across all metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Learning Velocity - Compact View */}
                  <LearningVelocityCard />

                  {/* Quick Stats */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Quick Insights
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Study Streak</p>
                          <p className="text-2xl font-bold mt-1">-</p>
                          <p className="text-xs text-muted-foreground mt-1">days</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">This Week</p>
                          <p className="text-2xl font-bold mt-1">-</p>
                          <p className="text-xs text-muted-foreground mt-1">hours</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Assessments</p>
                          <p className="text-2xl font-bold mt-1">-</p>
                          <p className="text-xs text-muted-foreground mt-1">completed</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Avg Score</p>
                          <p className="text-2xl font-bold mt-1">-%</p>
                          <p className="text-xs text-muted-foreground mt-1">accuracy</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skill Gap Analysis */}
            <SkillGapAnalysis />

            {/* Peer Comparison */}
            <PeerComparison />
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div id="advanced-analytics-goals">
            <GoalProgressDashboard />
          </div>
        </TabsContent>

        {/* Velocity Tab */}
        <TabsContent value="velocity" className="space-y-6">
          <div id="advanced-analytics-velocity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <LearningVelocityCard />
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">How to Improve</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Study Consistently</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Regular daily sessions boost learning velocity more than long cramming
                        sessions.
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-900">Challenge Yourself</p>
                      <p className="text-xs text-green-700 mt-1">
                        Tackle content slightly above your current level to accelerate growth.
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-900">Active Recall</p>
                      <p className="text-xs text-purple-700 mt-1">
                        Test yourself frequently instead of passive reviewing to improve retention.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Detailed breakdown of your learning performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Questions/Hour</p>
                    <p className="text-3xl font-bold mt-2">-</p>
                    <p className="text-xs text-muted-foreground mt-1">Completion speed indicator</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Focus Duration</p>
                    <p className="text-3xl font-bold mt-2">- min</p>
                    <p className="text-xs text-muted-foreground mt-1">Average session length</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Peak Time</p>
                    <p className="text-3xl font-bold mt-2">-</p>
                    <p className="text-xs text-muted-foreground mt-1">Most productive hour</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Competency Tab */}
        <TabsContent value="competency" className="space-y-6">
          <div id="advanced-analytics-competency">
            <CompetencyHeatMap />
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div id="advanced-analytics-insights" className="space-y-6">
            {/* Study Time Recommendations */}
            <StudyTimeRecommendations />

            {/* Additional Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Personalized Recommendations
                </CardTitle>
                <CardDescription>AI-powered suggestions to optimize your learning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded">
                    <h4 className="font-semibold text-blue-900">Focus Area</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Complete assessments to receive personalized recommendations.
                    </p>
                  </div>
                  <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded">
                    <h4 className="font-semibold text-green-900">Next Milestone</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Set learning goals to track your progress toward milestones.
                    </p>
                  </div>
                  <div className="p-4 border-l-4 border-purple-500 bg-purple-50 rounded">
                    <h4 className="font-semibold text-purple-900">Skill Development</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      View your competency heat map to identify areas for growth.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Modal */}
      <ExportModal open={showExportModal} onOpenChange={setShowExportModal} />
    </div>
  );
}
