import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2, AlertCircle, Brain } from '@/components/ui/icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { pathGenerator, type LearningGoal } from '@/services/learning-path';
import { logger } from '@/utils/logger';
import {
  GoalSettingStep,
  FocusAreasStep,
  ReviewGenerateStep,
  type AssessmentData,
  type Category,
  type WizardFormData,
} from './wizard-steps';

export default function LearningPathWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Assessment data
  const [latestAssessment, setLatestAssessment] = useState<AssessmentData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryInsights, setCategoryInsights] = useState<
    Array<{ category_id: string; score: number; insights: string }>
  >([]);

  // Form data
  const [formData, setFormData] = useState<WizardFormData>({
    goalTitle: '',
    goalDescription: '',
    targetLevel: 'intermediate',
    focusCategoryIds: [],
    estimatedWeeks: 8,
    hoursPerWeek: 5,
    learningStyle: 'mixed',
    includeWorkshops: true,
    includeEvents: true,
  });

  const fetchAssessmentData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch latest completed assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('user_ai_assessments')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_complete', true)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (assessmentError) throw assessmentError;
      setLatestAssessment(assessmentData);

      // Fetch category performance insights
      const { data: insightsData, error: insightsError } = await supabase
        .from('category_performance_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('assessment_id', assessmentData.id);

      if (insightsError) throw insightsError;
      setCategoryInsights(insightsData || []);

      // Fetch categories and calculate percentages
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('assessment_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) throw categoriesError;

      const enrichedCategories: Category[] = (categoriesData || []).map(cat => {
        const insight = insightsData?.find(i => i.category_id === cat.id);
        const percentage = insight ? Math.round(insight.score) : 0;

        return {
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          percentage,
          strength_level: percentage >= 80 ? 'strong' : percentage >= 60 ? 'moderate' : 'weak',
        };
      });

      setCategories(enrichedCategories);

      // Pre-select weak areas (< 60%)
      const weakCategories = enrichedCategories.filter(c => c.percentage < 60).map(c => c.id);

      setFormData(prev => ({ ...prev, focusCategoryIds: weakCategories }));
    } catch (error) {
      logger.error('Error fetching assessment data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assessment data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAssessmentData();
  }, [user, navigate, fetchAssessmentData]);

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleGeneratePath = async () => {
    if (!user || !latestAssessment) return;

    try {
      setGenerating(true);

      const goal: LearningGoal = {
        goal_title: formData.goalTitle,
        goal_description: formData.goalDescription,
        target_augmentation_level: formData.targetLevel,
        focus_category_ids: formData.focusCategoryIds,
        estimated_weeks: formData.estimatedWeeks,
        hours_per_week: formData.hoursPerWeek,
        preferred_learning_style: formData.learningStyle,
        include_workshops: formData.includeWorkshops,
        include_events: formData.includeEvents,
      };

      // Generate path using AI algorithm
      const generatedPath = await pathGenerator.generatePath(
        user.id,
        latestAssessment,
        categoryInsights,
        goal
      );

      // Save goal to database
      const { data: goalData, error: goalError } = await supabase
        .from('user_learning_goals')
        .insert({
          user_id: user.id,
          assessment_id: latestAssessment.id,
          goal_title: formData.goalTitle,
          goal_description: formData.goalDescription,
          current_augmentation_level: latestAssessment.augmentation_level,
          target_augmentation_level: formData.targetLevel,
          current_irt_ability: latestAssessment.current_ability_estimate,
          focus_category_ids: formData.focusCategoryIds,
          estimated_weeks: formData.estimatedWeeks,
          hours_per_week: formData.hoursPerWeek,
          preferred_learning_style: formData.learningStyle,
          include_workshops: formData.includeWorkshops,
          include_events: formData.includeEvents,
          current_status: 'active',
        })
        .select()
        .single();

      if (goalError) throw goalError;

      // Save generated path
      const { data: pathData, error: pathError } = await supabase
        .from('ai_generated_learning_paths')
        .insert({
          user_id: user.id,
          goal_id: goalData.id,
          assessment_id: latestAssessment.id,
          path_title: generatedPath.path_title,
          path_description: generatedPath.path_description,
          generated_by_ai: true,
          generation_algorithm: generatedPath.generation_metadata.algorithm,
          generation_metadata: generatedPath.generation_metadata,
          difficulty_start: generatedPath.difficulty_start,
          difficulty_end: generatedPath.difficulty_end,
          estimated_completion_weeks: generatedPath.estimated_completion_weeks,
          estimated_total_hours: generatedPath.estimated_total_hours,
          total_courses: generatedPath.items.filter(i => i.item_type === 'course').length,
          total_exercises: generatedPath.items.filter(i => i.item_type === 'exercise').length,
          total_workshops: generatedPath.items.filter(i => i.item_type === 'workshop').length,
          total_items: generatedPath.items.length,
          total_milestones: generatedPath.milestones.length,
          is_active: true,
        })
        .select()
        .single();

      if (pathError) throw pathError;

      // Save path items
      const itemsToInsert = generatedPath.items.map((item, index) => ({
        ai_learning_path_id: pathData.id,
        order_index: index,
        week_number: item.week_number,
        item_type: item.item_type,
        item_id: item.item_id,
        item_title: item.item_title,
        item_description: item.item_description,
        difficulty_level: item.difficulty_level,
        irt_difficulty: item.irt_difficulty,
        estimated_hours: item.estimated_hours,
        is_required: item.is_required,
        prerequisites: item.prerequisites || [],
        skill_tags: item.skill_tags || [],
        reason_for_inclusion: item.reason_for_inclusion,
        addresses_weaknesses: item.addresses_weaknesses || [],
        confidence_score: item.confidence_score,
        status: index === 0 ? 'available' : 'locked',
      }));

      const { error: itemsError } = await supabase
        .from('learning_path_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({
        title: 'Success!',
        description: 'Your personalized learning path has been generated.',
      });

      navigate(`/learning-paths/${pathData.id}`);
    } catch (error) {
      logger.error('Error generating path:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate learning path',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/80">Loading your assessment data...</p>
        </div>
      </div>
    );
  }

  if (!latestAssessment) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-md">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              Assessment Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-white/80">
              You need to complete an AI assessment before generating a personalized learning path.
            </p>
            <Button onClick={() => navigate('/ai-assessment')} className="w-full btn-hero">
              <Brain className="h-4 w-4 mr-2" />
              Take Assessment Now
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full text-white border-white/20 hover:bg-white/10"
            >
              Go Back Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-hero py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-yellow-400" />
            Create Your Learning Path
          </h1>
          <p className="text-white/80">AI-powered personalized learning journey</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-white/60">
            <span className={step >= 1 ? 'text-white font-medium' : ''}>1. Set Goal</span>
            <span className={step >= 2 ? 'text-white font-medium' : ''}>2. Choose Focus</span>
            <span className={step >= 3 ? 'text-white font-medium' : ''}>3. Generate</span>
          </div>
        </div>

        {/* Steps */}
        {step === 1 && (
          <GoalSettingStep
            formData={formData}
            onUpdate={updateFormData}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <FocusAreasStep
            formData={formData}
            categories={categories}
            onUpdate={updateFormData}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <ReviewGenerateStep
            formData={formData}
            categories={categories}
            generating={generating}
            onGenerate={handleGeneratePath}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
}
