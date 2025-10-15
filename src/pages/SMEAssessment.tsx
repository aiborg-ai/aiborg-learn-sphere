import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Navbar, Footer } from '@/components/navigation';
import { ArrowLeft, ArrowRight, Save, CheckCircle2, FileText, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSMEAssessmentSubmit } from '@/hooks/useSMEAssessmentSubmit';
import type { AssessmentFormData } from '@/types/aiAssessment';
import { supabase } from '@/integrations/supabase/client';

// Import form sections
import { Section1Mission } from '@/components/sme-assessment/Section1Mission';
import { Section2Capabilities } from '@/components/sme-assessment/Section2Capabilities';
import { Section3PainPoints } from '@/components/sme-assessment/Section3PainPoints';
import { Section4UserImpact } from '@/components/sme-assessment/Section4UserImpact';
import { Section5Benefits } from '@/components/sme-assessment/Section5Benefits';
import { Section6Risks } from '@/components/sme-assessment/Section6Risks';
import { Section7Resources } from '@/components/sme-assessment/Section7Resources';
import { Section8Competitive } from '@/components/sme-assessment/Section8Competitive';
import { Section9ActionPlan } from '@/components/sme-assessment/Section9ActionPlan';

const TOTAL_SECTIONS = 9;

export default function SMEAssessment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isCompanyAdmin } = useAuth();
  const [currentSection, setCurrentSection] = useState(1);
  const [companyProfileId, setCompanyProfileId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AssessmentFormData>>({
    companyName: '',
    companyMission: '',
    aiEnhancementDescription: '',
    strategicAlignmentRating: 3,
    currentAIAdoptionLevel: 'none',
    internalAIExpertise: 1,
    dataAvailabilityRating: 1,
    additionalAICapabilities: '',
    painPoints: [],
    userImpacts: [],
    benefits: [],
    risks: [],
    resources: [],
    competitors: [],
    aiAdoptionBenefitSummary: '',
    overallOpportunityRating: 3,
    recommendedNextSteps: [],
    completedBy: '',
  });

  // Enforce authentication requirement
  useEffect(() => {
    if (!user) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to access the SME Assessment and save your results.',
        variant: 'destructive',
      });
      navigate('/auth', {
        state: {
          returnTo: '/sme-assessment',
          message: 'Please sign in to access the SME Assessment.',
        },
      });
    }
  }, [user, navigate, toast]);

  // Fetch company profile for company admins
  useEffect(() => {
    const fetchCompanyProfile = async () => {
      if (!user || !isCompanyAdmin) return;

      try {
        const { data, error } = await supabase
          .from('company_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') {
            // PGRST116 means no rows found, which is okay for new company admins
            toast({
              title: 'Warning',
              description: 'Could not load company profile. You can still complete the assessment.',
              variant: 'default',
            });
          }
          return;
        }

        if (data) {
          // Store company profile ID for later use
          setCompanyProfileId(data.id);

          // Auto-populate form with company data
          setFormData(prev => ({
            ...prev,
            companyName: data.company_name || '',
            companyMission: data.description || prev.companyMission || '',
          }));

          toast({
            title: 'Company Profile Loaded',
            description: `Assessment for ${data.company_name}`,
          });
        }
      } catch (error) {
        // Silently handle errors - company profile is optional
      }
    };

    fetchCompanyProfile();
  }, [user, isCompanyAdmin, toast]);

  // Receive profiling data from navigation state and pre-fill form
  useEffect(() => {
    const state = location.state as {
      profilingData?: {
        industry?: string;
        company_size?: string;
        job_role?: string;
        current_tools?: string[];
        challenges?: string[];
      };
    } | null;

    if (state?.profilingData) {
      const profiling = state.profilingData;
      setFormData(prev => ({
        ...prev,
        // Pre-fill industry if available
        ...(profiling.industry && { companyMission: `Operating in ${profiling.industry}` }),
        // Store profiling data for later use
        _profilingData: profiling,
      }));
    }
  }, [location.state]);

  // Use the assessment submission hook
  const { saveDraft, submitAssessment, isSaving } = useSMEAssessmentSubmit({
    user,
    formData,
    companyId: companyProfileId,
    onSuccess: assessmentId => {
      toast({
        title: 'Assessment Completed',
        description: 'Your AI Opportunity Assessment has been submitted successfully.',
      });
    },
  });

  const progress = (currentSection / TOTAL_SECTIONS) * 100;

  const handleUpdateFormData = (data: Partial<AssessmentFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentSection < TOTAL_SECTIONS) {
      setCurrentSection(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentSection > 1) {
      setCurrentSection(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      toast({
        title: 'Draft Saved',
        description: 'Your assessment progress has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save draft. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    try {
      toast({
        title: 'Processing',
        description: 'Submitting your AI Opportunity Assessment...',
      });
      await submitAssessment();
      // Navigation happens in the hook
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit assessment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderSection = () => {
    switch (currentSection) {
      case 1:
        return <Section1Mission formData={formData} onUpdate={handleUpdateFormData} />;
      case 2:
        return <Section2Capabilities formData={formData} onUpdate={handleUpdateFormData} />;
      case 3:
        return <Section3PainPoints formData={formData} onUpdate={handleUpdateFormData} />;
      case 4:
        return <Section4UserImpact formData={formData} onUpdate={handleUpdateFormData} />;
      case 5:
        return <Section5Benefits formData={formData} onUpdate={handleUpdateFormData} />;
      case 6:
        return <Section6Risks formData={formData} onUpdate={handleUpdateFormData} />;
      case 7:
        return <Section7Resources formData={formData} onUpdate={handleUpdateFormData} />;
      case 8:
        return <Section8Competitive formData={formData} onUpdate={handleUpdateFormData} />;
      case 9:
        return <Section9ActionPlan formData={formData} onUpdate={handleUpdateFormData} />;
      default:
        return null;
    }
  };

  const sectionTitles = [
    'Company Mission & AI Alignment',
    'AI Capabilities Assessment',
    'Pain Points & AI Opportunities',
    'User Impact & AI Benefits',
    'Benefits Analysis',
    'Risk Analysis & Mitigation',
    'Resource Requirements',
    'Competitive Analysis',
    'Implementation Decision & Action Plan',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />

      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">AI Opportunity Assessment</h1>
              <p className="text-muted-foreground">For Small & Medium Enterprises</p>
            </div>
          </div>

          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Complete this worksheet to evaluate AI opportunities aligned with your company's
                    objectives
                  </p>
                  <ul className="text-blue-700 dark:text-blue-300 space-y-1 ml-4 list-disc">
                    <li>Involve stakeholders from Product, Engineering, Business, and Users</li>
                    <li>Provide quantitative, specific answers where possible</li>
                    <li>Ratings use a scale from 1 (lowest) to 5 (highest)</li>
                    <li>Takes approximately 30-45 minutes to complete</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                Section {currentSection} of {TOTAL_SECTIONS}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{sectionTitles[currentSection - 1]}</CardTitle>
            <CardDescription>
              Section {currentSection}: {sectionTitles[currentSection - 1]}
            </CardDescription>
          </CardHeader>
          <CardContent>{renderSection()}</CardContent>
        </Card>

        <div className="flex justify-between items-center gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSection === 1 || isSaving}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>

          {currentSection < TOTAL_SECTIONS ? (
            <Button onClick={handleNext} disabled={isSaving}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700"
              disabled={isSaving}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isSaving ? 'Submitting...' : 'Complete Assessment'}
            </Button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
