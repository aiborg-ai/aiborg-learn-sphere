import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSMEAssessmentReport } from '@/hooks/useSMEAssessmentReport';
import { exportSMEAssessmentReportToPDF } from '@/utils/pdfExport';
import {
  ArrowLeft,
  Download,
  Share2,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Target,
  Lightbulb,
  FileText,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export default function SMEAssessmentReport() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading, error } = useSMEAssessmentReport(assessmentId);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Report link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleExportPDF = async () => {
    if (!report) {
      toast.error('No report data available to export');
      return;
    }

    try {
      setIsExportingPDF(true);
      toast.info('Generating PDF... This may take a few moments', { duration: 3000 });

      await exportSMEAssessmentReportToPDF(report.assessment.company_name, report.assessment.id);

      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate PDF. Please try again.');
      logger.error('PDF export error:', error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navbar />
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading assessment report...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                Assessment Not Found
              </CardTitle>
              <CardDescription>
                The assessment report you're looking for could not be found or you don't have
                permission to view it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/sme-assessment')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Take a New Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const {
    assessment,
    painPoints,
    userImpacts,
    benefits,
    risks,
    resources,
    competitors,
    actionPlan,
  } = report;

  const overallRating = assessment.overall_opportunity_rating || 0;
  const ratingPercentage = (overallRating / 5) * 100;

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent Opportunity';
    if (rating >= 3.5) return 'Strong Opportunity';
    if (rating >= 2.5) return 'Moderate Opportunity';
    if (rating >= 1.5) return 'Limited Opportunity';
    return 'Low Opportunity';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header Actions - Hidden when printing */}
        <div className="mb-8 print:hidden">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">AI Opportunity Assessment Report</h1>
                <p className="text-muted-foreground">{assessment.company_name}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <FileText className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button onClick={handleExportPDF} disabled={isExportingPDF}>
                {isExportingPDF ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {isExportingPDF ? 'Generating PDF...' : 'Export PDF'}
              </Button>
            </div>
          </div>
        </div>

        {/* PDF Export Target Container */}
        <div id="sme-assessment-report-content">
          {/* Print Header */}
          <div className="hidden print:block mb-8">
            <div className="text-center border-b pb-4">
              <h1 className="text-2xl font-bold">AI Opportunity Assessment Report</h1>
              <p className="text-lg">{assessment.company_name}</p>
              <p className="text-sm text-muted-foreground">
                Completed on{' '}
                {new Date(assessment.completed_at || assessment.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Executive Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Overall AI Opportunity Rating</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Progress value={ratingPercentage} className="h-4" />
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getRatingColor(overallRating)}`}>
                      {overallRating.toFixed(1)}/5.0
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getRatingLabel(overallRating)}
                    </div>
                  </div>
                </div>
              </div>

              {assessment.ai_adoption_benefit_summary && (
                <div>
                  <h3 className="font-semibold mb-2">Summary of AI Benefits</h3>
                  <p className="text-muted-foreground">{assessment.ai_adoption_benefit_summary}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{painPoints.length}</div>
                  <div className="text-sm text-muted-foreground">Pain Points Identified</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{benefits.length}</div>
                  <div className="text-sm text-muted-foreground">Benefits Analyzed</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{risks.length}</div>
                  <div className="text-sm text-muted-foreground">Risks Assessed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Mission & AI Alignment */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Mission & AI Alignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assessment.company_mission && (
                <div>
                  <h3 className="font-semibold mb-2">Mission Statement</h3>
                  <p className="text-muted-foreground">{assessment.company_mission}</p>
                </div>
              )}

              {assessment.ai_enhancement_description && (
                <div>
                  <h3 className="font-semibold mb-2">How AI Can Enhance Mission</h3>
                  <p className="text-muted-foreground">{assessment.ai_enhancement_description}</p>
                </div>
              )}

              {assessment.strategic_alignment_rating && (
                <div>
                  <h3 className="font-semibold mb-2">Strategic Alignment Rating</h3>
                  <div className="flex items-center gap-3">
                    <Progress
                      value={(assessment.strategic_alignment_rating / 5) * 100}
                      className="h-3 flex-1"
                    />
                    <Badge variant="secondary">{assessment.strategic_alignment_rating}/5</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Capabilities */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                AI Capabilities Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Current AI Adoption Level</h3>
                  <Badge variant="outline" className="capitalize">
                    {assessment.current_ai_adoption_level || 'Not specified'}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Internal AI Expertise</h3>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(assessment.internal_ai_expertise || 0) * 20}
                      className="h-3 flex-1"
                    />
                    <span className="text-sm">{assessment.internal_ai_expertise}/5</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Data Availability</h3>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(assessment.data_availability_rating || 0) * 20}
                      className="h-3 flex-1"
                    />
                    <span className="text-sm">{assessment.data_availability_rating}/5</span>
                  </div>
                </div>
              </div>

              {assessment.additional_ai_capabilities && (
                <div>
                  <h3 className="font-semibold mb-2">Additional Capabilities Required</h3>
                  <p className="text-muted-foreground">{assessment.additional_ai_capabilities}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pain Points */}
          {painPoints.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Pain Points & AI Opportunities
                </CardTitle>
                <CardDescription>
                  Identified pain points and how AI can address them
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {painPoints.map((pp, index) => (
                    <div key={pp.id} className="border-l-4 border-orange-500 pl-4 py-2">
                      <h3 className="font-semibold mb-1">
                        {index + 1}. {pp.pain_point}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>AI Solution:</strong> {pp.ai_capability_to_address}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Current Impact:</span>
                          <Badge variant="destructive">{pp.current_impact}/5</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Expected Impact After AI:</span>
                          <Badge variant="default">{pp.impact_after_ai}/5</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Impacts */}
          {userImpacts.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Impact Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userImpacts.map((ui, index) => (
                    <div key={ui.id} className="p-4 bg-muted/30 rounded-lg">
                      <h3 className="font-semibold mb-2">
                        {index + 1}. {ui.user_group}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">
                            <strong>Current Satisfaction:</strong> {ui.satisfaction_rating}/5
                          </p>
                          <p className="text-muted-foreground">
                            <strong>Pain Points:</strong> {ui.user_pain_points}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">
                            <strong>Impact Rating:</strong> {ui.impact_rating}/5
                          </p>
                          <p className="text-muted-foreground">
                            <strong>AI Improvements:</strong> {ui.ai_improvements}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          {benefits.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Benefits Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {benefits.map(benefit => (
                    <div key={benefit.id} className="border-l-4 border-green-500 pl-4 py-2">
                      <h3 className="font-semibold mb-1">{benefit.benefit_area}</h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Current:</strong> {benefit.current_status}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>With AI:</strong> {benefit.ai_improvement}
                      </p>
                      <Badge variant="default">Impact: {benefit.impact_rating}/5</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risks */}
          {risks.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Risk Analysis & Mitigation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {risks.map((risk, index) => (
                    <div key={risk.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">
                          {index + 1}. {risk.risk_factor}
                        </h3>
                        <div className="flex gap-2">
                          <Badge variant="outline">Likelihood: {risk.likelihood}/5</Badge>
                          <Badge variant="destructive">Impact: {risk.impact_rating}/5</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Risk:</strong> {risk.specific_risk}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        <strong>Mitigation:</strong> {risk.mitigation_strategy}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resources */}
          {resources.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Resource Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources.map(resource => (
                    <div
                      key={resource.id}
                      className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{resource.resource_type}</h3>
                        {resource.additional_requirements && (
                          <p className="text-sm text-muted-foreground">
                            {resource.additional_requirements}
                          </p>
                        )}
                      </div>
                      <Badge variant={resource.is_available ? 'default' : 'secondary'}>
                        {resource.is_available ? 'Available' : 'Required'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competitors */}
          {competitors.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Competitive Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {competitors.map(comp => (
                    <div key={comp.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{comp.competitor_name}</h3>
                        <Badge
                          variant={
                            comp.threat_level >= 4
                              ? 'destructive'
                              : comp.threat_level >= 3
                                ? 'outline'
                                : 'secondary'
                          }
                        >
                          Threat Level: {comp.threat_level}/5
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>AI Use Case:</strong> {comp.ai_use_case}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Their Advantage:</strong> {comp.advantage}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Plan */}
          {actionPlan &&
            actionPlan.recommended_next_steps &&
            actionPlan.recommended_next_steps.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Recommended Next Steps
                  </CardTitle>
                  <CardDescription>Actionable steps for AI implementation</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {actionPlan.recommended_next_steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-sm">{step}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

          {/* Metadata */}
          <Card className="mb-6 print:mt-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>
                  <strong>Completed By:</strong> {assessment.completed_by || 'Not specified'}
                </div>
                <div>
                  <strong>Completed On:</strong>{' '}
                  {new Date(assessment.completed_at || assessment.created_at).toLocaleDateString()}
                </div>
                <div>
                  <strong>Assessment ID:</strong> {assessment.id.slice(0, 8)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* End PDF Export Target Container */}

        {/* Call to Action - Hidden when printing */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 print:hidden">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Ready to implement AI in your business?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Explore our training programs designed for SMEs
                </p>
              </div>
              <Button onClick={() => navigate('/programs')}>
                View Training Programs
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
