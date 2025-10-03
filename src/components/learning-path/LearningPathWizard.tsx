import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Target,
  Brain,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { pathGenerator, type LearningGoal } from '@/services/LearningPathGenerator';
import { logger } from '@/utils/logger';

interface AssessmentData {
  id: string;
  total_score: number;
  max_possible_score: number;
  augmentation_level: string;
  current_ability_estimate?: number;
  ability_standard_error?: number;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  percentage: number;
  strength_level: string;
}

const LEVEL_CONFIG = {
  beginner: { label: 'Beginner', desc: 'Foundation building', color: 'bg-green-500' },
  intermediate: { label: 'Intermediate', desc: 'Practical application', color: 'bg-blue-500' },
  advanced: { label: 'Advanced', desc: 'Expert-level mastery', color: 'bg-purple-500' },
  expert: { label: 'Expert', desc: 'Industry leadership', color: 'bg-orange-500' }
};

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
  const [categoryInsights, setCategoryInsights] = useState<any[]>([]);

  // Goal form data
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [targetLevel, setTargetLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [focusCategoryIds, setFocusCategoryIds] = useState<string[]>([]);
  const [estimatedWeeks, setEstimatedWeeks] = useState(8);
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [learningStyle, setLearningStyle] = useState<'visual' | 'reading' | 'hands-on' | 'mixed'>('mixed');
  const [includeWorkshops, setIncludeWorkshops] = useState(true);
  const [includeEvents, setIncludeEvents] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAssessmentData();
  }, [user]);

  const fetchAssessmentData = async () => {
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
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows

      // Handle error cases (but not "no rows" which is expected)
      if (assessmentError) {
        logger.error('Error fetching assessment:', assessmentError);
        toast({
          title: 'Error',
          description: 'Failed to load assessment data',
          variant: 'destructive'
        });
        return;
      }

      if (!assessmentData) {
        toast({
          title: 'No Assessment Found',
          description: 'Please complete an AI assessment first to generate a personalized learning path.',
          variant: 'destructive'
        });
        navigate('/ai-assessment');
        return;
      }

      setLatestAssessment(assessmentData);

      // Fetch category insights
      const { data: insightsData } = await supabase
        .from('assessment_insights')
        .select(`
          *,
          assessment_categories (id, name, icon)
        `)
        .eq('assessment_id', assessmentData.id);

      if (insightsData) {
        const insights = insightsData.map(insight => ({
          category_id: insight.assessment_categories.id,
          category_name: insight.assessment_categories.name,
          category_score: insight.category_score,
          category_max_score: insight.category_max_score,
          strength_level: insight.strength_level,
          percentage: (insight.category_score / insight.category_max_score) * 100
        }));

        setCategoryInsights(insights);

        const cats = insights.map(i => ({
          id: i.category_id,
          name: i.category_name,
          icon: insightsData.find(d => d.category_id === i.category_id)?.assessment_categories?.icon,
          percentage: i.percentage,
          strength_level: i.strength_level
        }));

        setCategories(cats);

        // Auto-select weak categories
        const weakCats = cats
          .filter(c => c.percentage < 60 || c.strength_level === 'weak')
          .map(c => c.id);
        setFocusCategoryIds(weakCats);
      }
    } catch (error) {
      logger.error('Error fetching assessment data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assessment data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePath = async () => {
    if (!user || !latestAssessment) return;

    // Validation
    if (!goalTitle.trim()) {
      toast({
        title: 'Goal Required',
        description: 'Please enter a learning goal title',
        variant: 'destructive'
      });
      return;
    }

    if (focusCategoryIds.length === 0) {
      toast({
        title: 'Focus Areas Required',
        description: 'Please select at least one focus area',
        variant: 'destructive'
      });
      return;
    }

    try {
      setGenerating(true);

      const goal: LearningGoal = {
        goal_title: goalTitle,
        goal_description: goalDescription,
        target_augmentation_level: targetLevel,
        focus_category_ids: focusCategoryIds,
        estimated_weeks: estimatedWeeks,
        hours_per_week: hoursPerWeek,
        preferred_learning_style: learningStyle,
        include_workshops: includeWorkshops,
        include_events: includeEvents
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
          goal_title: goalTitle,
          goal_description: goalDescription,
          current_augmentation_level: latestAssessment.augmentation_level,
          target_augmentation_level: targetLevel,
          current_irt_ability: latestAssessment.current_ability_estimate,
          focus_category_ids: focusCategoryIds,
          estimated_weeks: estimatedWeeks,
          hours_per_week: hoursPerWeek,
          preferred_learning_style: learningStyle,
          include_workshops: includeWorkshops,
          include_events: includeEvents,
          current_status: 'active'
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
          is_active: true
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
        status: index === 0 ? 'available' : 'locked'
      }));

      const { error: itemsError } = await supabase
        .from('learning_path_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Save milestones
      const milestonesToInsert = generatedPath.milestones.map(m => ({
        ai_learning_path_id: pathData.id,
        milestone_order: m.milestone_order,
        milestone_title: m.milestone_title,
        milestone_description: m.milestone_description,
        minimum_completion_percentage: m.minimum_completion_percentage,
        reward_badge: m.reward_badge,
        reward_points: m.reward_points,
        reward_message: m.reward_message
      }));

      const { error: milestonesError } = await supabase
        .from('learning_path_milestones')
        .insert(milestonesToInsert);

      if (milestonesError) throw milestonesError;

      // Log generation
      await supabase.from('path_generation_logs').insert({
        user_id: user.id,
        ai_learning_path_id: pathData.id,
        algorithm_version: generatedPath.generation_metadata.algorithm,
        input_assessment_scores: { assessment_id: latestAssessment.id },
        input_goals: goal,
        items_generated: generatedPath.items.length,
        computation_time_ms: generatedPath.generation_metadata.computation_time_ms,
        success: true
      });

      toast({
        title: 'Learning Path Created! 🎉',
        description: `Your personalized ${estimatedWeeks}-week learning path is ready!`
      });

      navigate(`/learning-path/ai/${pathData.id}`);
    } catch (error) {
      logger.error('Error generating learning path:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to create learning path. Please try again.',
        variant: 'destructive'
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
            <Button
              onClick={() => navigate('/ai-assessment')}
              className="w-full btn-hero"
            >
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

        {/* Step 1: Goal Setting */}
        {step === 1 && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5" />
                What's Your Learning Goal?
              </CardTitle>
              <CardDescription className="text-white/70">
                Define what you want to achieve
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="goal-title" className="text-white">Goal Title *</Label>
                <Input
                  id="goal-title"
                  placeholder="e.g., Master AI Prompt Engineering"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              <div>
                <Label htmlFor="goal-desc" className="text-white">Description (Optional)</Label>
                <Textarea
                  id="goal-desc"
                  placeholder="Describe what you want to learn and why..."
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-white mb-3 block">Target Level *</Label>
                <RadioGroup value={targetLevel} onValueChange={(v: any) => setTargetLevel(v)}>
                  {Object.entries(LEVEL_CONFIG).map(([key, config]) => (
                    <div key={key} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                      <RadioGroupItem value={key} id={key} />
                      <Label htmlFor={key} className="flex-1 cursor-pointer">
                        <div className="text-white font-medium">{config.label}</div>
                        <div className="text-white/60 text-sm">{config.desc}</div>
                      </Label>
                      <Badge className={config.color}>{config.label}</Badge>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button onClick={() => setStep(2)} className="w-full btn-hero" disabled={!goalTitle.trim()}>
                Next: Choose Focus Areas
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Focus Areas */}
        {step === 2 && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Choose Your Focus Areas
              </CardTitle>
              <CardDescription className="text-white/70">
                Based on your assessment results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-blue-500/20 border-blue-500/30">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-white/80">
                  We've pre-selected your weak areas. You can adjust these based on your priorities.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {categories.map(category => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        id={category.id}
                        checked={focusCategoryIds.includes(category.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFocusCategoryIds([...focusCategoryIds, category.id]);
                          } else {
                            setFocusCategoryIds(focusCategoryIds.filter(id => id !== category.id));
                          }
                        }}
                      />
                      <Label htmlFor={category.id} className="flex-1 cursor-pointer">
                        <div className="text-white font-medium">{category.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={category.percentage} className="h-1 w-24" />
                          <span className="text-white/60 text-sm">{Math.round(category.percentage)}%</span>
                        </div>
                      </Label>
                      {category.percentage < 60 && (
                        <Badge variant="destructive" className="text-xs">Needs Improvement</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weeks" className="text-white">Duration (weeks)</Label>
                  <Input
                    id="weeks"
                    type="number"
                    min="4"
                    max="24"
                    value={estimatedWeeks}
                    onChange={(e) => setEstimatedWeeks(parseInt(e.target.value) || 8)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="hours" className="text-white">Hours per week</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="1"
                    max="20"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(parseInt(e.target.value) || 5)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 text-white border-white/20">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1 btn-hero" disabled={focusCategoryIds.length === 0}>
                  Next: Review & Generate
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Generate */}
        {step === 3 && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Ready to Generate Your Path
              </CardTitle>
              <CardDescription className="text-white/70">
                Review your selections and generate your personalized learning path
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-white/60 text-sm mb-1">Goal</div>
                  <div className="text-white font-medium">{goalTitle}</div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-white/60 text-sm mb-1">Target Level</div>
                  <Badge className={LEVEL_CONFIG[targetLevel].color}>
                    {LEVEL_CONFIG[targetLevel].label}
                  </Badge>
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-white/60 text-sm mb-2">Focus Areas ({focusCategoryIds.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {categories.filter(c => focusCategoryIds.includes(c.id)).map(c => (
                      <Badge key={c.id} variant="outline" className="text-white border-white/30">
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg text-center">
                    <Clock className="h-6 w-6 text-white/60 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{estimatedWeeks}</div>
                    <div className="text-white/60 text-sm">weeks</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg text-center">
                    <TrendingUp className="h-6 w-6 text-white/60 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{hoursPerWeek}</div>
                    <div className="text-white/60 text-sm">hours/week</div>
                  </div>
                </div>
              </div>

              <Alert className="bg-green-500/20 border-green-500/30">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-white/80">
                  Your path will include courses, exercises, {includeWorkshops && 'workshops, '} and assessments tailored to your needs.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 text-white border-white/20" disabled={generating}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleGeneratePath} className="flex-1 btn-hero" disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate My Path
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
