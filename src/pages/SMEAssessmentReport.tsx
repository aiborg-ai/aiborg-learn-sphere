import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar, Footer } from '@/components/navigation';
import {
  useSMEAssessmentReport,
  useSMERoadmapData,
  useSMEROIData,
  useSMENurturingData,
} from '@/hooks/useSMEAssessmentReport';
import { exportSMEAssessmentReportToPDF } from '@/utils/pdfExport';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import {
  LoadingState,
  ErrorState,
  ReportHeader,
  PrintHeader,
  ExecutiveSummary,
  CompanyMissionSection,
  AICapabilitiesSection,
  PainPointsSection,
  UserImpactsSection,
  BenefitsSection,
  RisksSection,
  ResourcesSection,
  CompetitorsSection,
  ActionPlanSection,
  MetadataSection,
  CallToAction,
} from './sme-report';
import { RoadmapSection } from '@/components/sme-report/RoadmapSection';
import { RoadmapSkeleton } from '@/components/sme-report/RoadmapSkeleton';
import { ROISection } from '@/components/sme-report/ROISection';
import { ROISkeleton } from '@/components/sme-report/ROISkeleton';
import { NurturingSection } from '@/components/sme-report/NurturingSection';
import { NurturingSkeleton } from '@/components/sme-report/NurturingSkeleton';

export default function SMEAssessmentReport() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading, error } = useSMEAssessmentReport(assessmentId);
  const { data: roadmapData, isLoading: isLoadingRoadmap } = useSMERoadmapData(assessmentId);
  const { data: roiData, isLoading: isLoadingROI } = useSMEROIData(assessmentId);
  const { data: nurturingData, isLoading: isLoadingNurturing } = useSMENurturingData(assessmentId);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handlePrint = () => {
    window.print();
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
    } catch {
      toast.error('Failed to generate PDF. Please try again.');
      logger.error('PDF export error:', error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !report) {
    return <ErrorState />;
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <ReportHeader
          companyName={assessment.company_name}
          onShare={handleShare}
          onPrint={handlePrint}
          onExportPDF={handleExportPDF}
          isExportingPDF={isExportingPDF}
        />

        <div id="sme-assessment-report-content">
          <PrintHeader
            companyName={assessment.company_name}
            completedAt={assessment.completed_at || assessment.created_at}
          />

          <ExecutiveSummary
            assessment={assessment}
            painPoints={painPoints}
            benefits={benefits}
            risks={risks}
          />

          <CompanyMissionSection assessment={assessment} />

          <AICapabilitiesSection assessment={assessment} />

          <PainPointsSection painPoints={painPoints} />

          <UserImpactsSection userImpacts={userImpacts} />

          <BenefitsSection benefits={benefits} />

          <RisksSection risks={risks} />

          <ResourcesSection resources={resources} />

          <CompetitorsSection competitors={competitors} />

          <ActionPlanSection actionPlan={actionPlan} />

          {/* New: Implementation Roadmap */}
          <div className="mt-12">
            {isLoadingRoadmap ? (
              <RoadmapSkeleton />
            ) : roadmapData?.items && roadmapData?.phases ? (
              <RoadmapSection
                roadmapItems={roadmapData.items}
                roadmapPhases={roadmapData.phases}
                roadmapMilestones={roadmapData.milestones || []}
              />
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Implementation Roadmap</h2>
                  <p className="text-muted-foreground">
                    Roadmap generation in progress. Please refresh the page in a moment.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* New: ROI Analysis */}
          <div className="mt-12">
            {isLoadingROI ? (
              <ROISkeleton />
            ) : roiData?.summary ? (
              <ROISection
                roiSummary={roiData.summary}
                roiCosts={roiData.costs || []}
                roiBenefits={roiData.benefits || []}
              />
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">ROI Analysis</h2>
                  <p className="text-muted-foreground">
                    ROI calculation in progress. Please refresh the page in a moment.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* New: Lead Nurturing Campaign (Admin Only) */}
          <div className="mt-12">
            {isLoadingNurturing ? (
              <NurturingSkeleton />
            ) : nurturingData ? (
              <NurturingSection nurturingCampaign={nurturingData} isAdmin={false} />
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Lead Nurturing Campaign</h2>
                  <p className="text-muted-foreground">
                    Campaign setup in progress. Please refresh the page in a moment.
                  </p>
                </div>
              </div>
            )}
          </div>

          <MetadataSection
            completedBy={assessment.completed_by}
            completedAt={assessment.completed_at}
            createdAt={assessment.created_at}
            assessmentId={assessment.id}
          />
        </div>

        <CallToAction onViewPrograms={() => navigate('/programs')} />
      </div>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
