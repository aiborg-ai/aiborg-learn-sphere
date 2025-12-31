/**
 * SkillsAssessmentResultsPage
 * Career-focused skills assessment results with actionable insights
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssessmentAttempt } from '@/hooks/useAssessmentAttempts';
import { useUserSkills } from '@/hooks/useUserSkills';
import { useCareerGoals } from '@/hooks/useCareerGoals';
import { useJobRoleMatch } from '@/hooks/useJobRoleMatch';
import { useSkillBenchmarks, useOverallPercentile } from '@/hooks/useSkillBenchmarks';
import { useSkillRecommendations } from '@/hooks/useSkillRecommendations';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  RotateCcw,
  Share2,
  Target,
  Loader2,
  AlertCircle,
  LayoutDashboard,
  ClipboardList,
  GitCompare,
  BarChart3,
  Lightbulb,
  Trophy,
  Briefcase,
} from '@/components/ui/icons';
import { PrintHeader } from '@/components/skills-assessment-results/print/PrintHeader';
import { ReportActions } from '@/components/skills-assessment-results/print/ReportActions';
import { SkillsInventoryTable } from '@/components/skills-assessment-results/print/SkillsInventoryTable';
import { SkillGapsTable } from '@/components/skills-assessment-results/print/SkillGapsTable';
import { BenchmarkingTable } from '@/components/skills-assessment-results/print/BenchmarkingTable';
import { RecommendationsSection } from '@/components/skills-assessment-results/print/RecommendationsSection';
import { TimelineRoadmap } from '@/components/skills-assessment-results/print/TimelineRoadmap';
import { exportSkillsAssessmentToPDF } from '@/utils/pdfExport';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export default function SkillsAssessmentResultsPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Fetch attempt data
  const { data: attempt, isLoading: attemptLoading } = useAssessmentAttempt(assessmentId);

  // Fetch user skills
  const { data: userSkills = [], isLoading: skillsLoading } = useUserSkills(user?.id);

  // Fetch career goals
  const { data: careerGoals = [], isLoading: goalsLoading } = useCareerGoals(user?.id);

  // Get primary career goal (highest priority)
  const primaryGoal = careerGoals.length > 0 ? careerGoals[0] : null;

  // Fetch job role match for primary goal
  const { data: careerMatch, isLoading: matchLoading } = useJobRoleMatch(
    user?.id,
    primaryGoal?.job_role_id
  );

  // Get skill IDs for benchmarking
  const skillIds = userSkills.map(s => s.skill_id);

  // Fetch skill benchmarks
  const { data: benchmarks = [], isLoading: benchmarksLoading } = useSkillBenchmarks(
    user?.id,
    skillIds,
    'role'
  );

  // Fetch overall percentile
  const { data: percentileRank = 0 } = useOverallPercentile(user?.id, 'role');

  // Fetch recommendations
  const { data: recommendations, isLoading: recommendationsLoading } = useSkillRecommendations(
    user?.id
  );

  // Calculate verified skills count
  const verifiedSkillsCount = userSkills.filter(s => s.verified).length;

  // Calculate skill gaps
  const skillGapsCount = careerMatch?.skill_gaps.length || 0;

  const isLoading =
    attemptLoading ||
    skillsLoading ||
    goalsLoading ||
    matchLoading ||
    benchmarksLoading ||
    recommendationsLoading;

  // Print/Export handlers
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!user || !assessmentId) {
      toast.error('Unable to export PDF');
      return;
    }

    try {
      setIsExportingPDF(true);
      toast.info('Generating PDF... This may take a few moments', { duration: 3000 });

      await exportSkillsAssessmentToPDF(user.email || 'User', assessmentId);

      toast.success('PDF downloaded successfully!');
    } catch (_error) {
      toast._error('Failed to generate PDF. Please try again.');
      logger.error('PDF export error:', error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Report link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!attempt || !user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container max-w-4xl mx-auto py-16 px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Results not found. Please try again.</AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const careerMatchPercentage = careerMatch?.match_percentage || 0;
  const readinessLevel = careerMatch?.readiness_level || 'not_ready';
  const targetRole = primaryGoal?.job_role.title || 'Your Career Goal';

  const readinessColors = {
    not_ready: 'text-red-600',
    developing: 'text-orange-600',
    ready: 'text-green-600',
    exceeds: 'text-blue-600',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 print:bg-white print:min-h-0">
      <div className="print:hidden">
        <Navbar />
      </div>

      <div className="container max-w-5xl mx-auto py-8 px-4 print:max-w-full print:py-0 print:px-8">
        {/* Back Button - hidden on print */}
        <Button variant="ghost" onClick={() => navigate('/skills')} className="mb-6 print:hidden">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Skills
        </Button>

        {/* Report Actions - hidden on print */}
        <ReportActions
          onPrint={handlePrint}
          onExportPDF={handleExportPDF}
          onShare={handleShare}
          isExportingPDF={isExportingPDF}
        />

        {/* Report Content Container */}
        <div id="skills-assessment-report-content">
          {/* Print-only header */}
          <PrintHeader
            userName={user?.email || 'User'}
            assessmentDate={attempt?.completed_at || new Date().toISOString()}
            careerGoal={primaryGoal?.job_role.title}
          />

          {/* Result Hero Card */}
          <Card className="mb-8 overflow-hidden relative print:shadow-none print:border-2 print:border-black print:break-inside-avoid print:mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent print:hidden" />
            <CardHeader className="relative text-center pb-8">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                {careerMatchPercentage >= 70 ? (
                  <Trophy className="h-10 w-10 text-yellow-600" />
                ) : (
                  <Briefcase className="h-10 w-10 text-primary" />
                )}
              </div>
              <CardTitle className="text-3xl mb-2">Skills Assessment Results</CardTitle>
              <CardDescription className="text-lg">
                {primaryGoal ? `Career Readiness for ${targetRole}` : 'Your Skills Profile'}
              </CardDescription>
            </CardHeader>

            <CardContent className="relative space-y-6 pb-8">
              {/* Score Display */}
              {primaryGoal && careerMatch ? (
                <div className="text-center">
                  <div className={`text-6xl font-bold ${readinessColors[readinessLevel]} mb-2`}>
                    {careerMatchPercentage.toFixed(0)}%
                  </div>
                  <div className="text-muted-foreground">Ready for {targetRole}</div>
                  <div className="mt-4">
                    <Progress value={careerMatchPercentage} className="h-3" />
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {verifiedSkillsCount} skills verified, {skillGapsCount} critical gaps remaining
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-6xl font-bold text-primary mb-2">{verifiedSkillsCount}</div>
                  <div className="text-muted-foreground">Skills Verified</div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 print:grid-cols-4">
                <div className="text-center p-4 rounded-lg bg-muted/50 print:bg-gray-100 print:border print:border-black">
                  <div className="text-2xl font-bold text-green-600 print:text-black">
                    {verifiedSkillsCount}
                  </div>
                  <div className="text-sm text-muted-foreground print:text-black">Verified</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50 print:bg-gray-100 print:border print:border-black">
                  <div className="text-2xl font-bold text-orange-600 print:text-black">
                    {skillGapsCount}
                  </div>
                  <div className="text-sm text-muted-foreground print:text-black">Gaps</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50 print:bg-gray-100 print:border print:border-black">
                  <div className="text-2xl font-bold text-blue-600 print:text-black">
                    {percentileRank}th
                  </div>
                  <div className="text-sm text-muted-foreground print:text-black">Percentile</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50 print:bg-gray-100 print:border print:border-black">
                  <div className="text-2xl font-bold text-purple-600 print:text-black">
                    {careerMatch?.estimated_weeks_to_close || 0}
                  </div>
                  <div className="text-sm text-muted-foreground print:text-black">
                    Weeks to Goal
                  </div>
                </div>
              </div>

              {/* Next Milestone */}
              {careerMatch && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Next Milestone: {careerMatch.next_milestone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs - hidden on print */}
          <Tabs defaultValue="overview" className="mb-8 print:hidden">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="skills-inventory" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Skills
              </TabsTrigger>
              <TabsTrigger value="career-gaps" className="gap-2">
                <GitCompare className="h-4 w-4" />
                Career Gaps
              </TabsTrigger>
              <TabsTrigger value="benchmarking" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Benchmarking
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="gap-2">
                <Lightbulb className="h-4 w-4" />
                Learn Next
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Career Overview</CardTitle>
                  <CardDescription>Your career readiness and key insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Overview tab content coming soon in Phase 2
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skills Inventory Tab */}
            <TabsContent value="skills-inventory">
              <Card>
                <CardHeader>
                  <CardTitle>Skills Inventory</CardTitle>
                  <CardDescription>Detailed breakdown of your skills</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Skills inventory tab content coming soon in Phase 2
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Career Gaps Tab */}
            <TabsContent value="career-gaps">
              <Card>
                <CardHeader>
                  <CardTitle>Career Gaps</CardTitle>
                  <CardDescription>Skills needed to reach your career goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Career gaps tab content coming soon in Phase 2
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Benchmarking Tab */}
            <TabsContent value="benchmarking">
              <Card>
                <CardHeader>
                  <CardTitle>Peer Benchmarking</CardTitle>
                  <CardDescription>Compare your skills with industry peers</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Benchmarking tab content coming soon in Phase 2
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Path</CardTitle>
                  <CardDescription>
                    Personalized recommendations to accelerate your career
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Recommendations tab content coming soon in Phase 2
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Print-only sections (hidden on screen, visible on print) */}
          <div className="hidden print:block space-y-8 mt-8">
            <div className="print:break-before-page print:pt-8">
              <SkillsInventoryTable skills={userSkills} />
            </div>

            <div className="print:break-before-page print:pt-8">
              <SkillGapsTable
                gaps={careerMatch?.skill_gaps || []}
                targetRole={primaryGoal?.job_role.title}
              />
            </div>

            <div className="print:break-before-page print:pt-8">
              <BenchmarkingTable benchmarks={benchmarks} showTopSkills maxRows={10} />
            </div>

            <div className="print:break-before-page print:pt-8">
              <RecommendationsSection recommendations={recommendations} />
            </div>

            <div className="print:break-before-page print:pt-8">
              <TimelineRoadmap
                weeksToGoal={careerMatch?.estimated_weeks_to_close || 0}
                nextMilestone={careerMatch?.next_milestone || ''}
                currentReadiness={careerMatchPercentage}
              />
            </div>
          </div>
        </div>
        {/* End Report Content Container */}

        {/* Action Buttons - hidden on print */}
        <div className="print:hidden flex flex-wrap gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/skills')} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Take Another Assessment
          </Button>

          <Button size="lg" variant="outline" className="gap-2">
            <Target className="h-4 w-4" />
            Set Career Goal
          </Button>

          <Button size="lg" variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share Results
          </Button>
        </div>
      </div>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
