import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Audience } from '@/contexts/PersonalizationContext';
import { usePersonalization } from '@/contexts/PersonalizationContext';
import {
  Users,
  GraduationCap,
  Briefcase,
  Building2,
  ChevronRight,
  ChevronLeft,
  Target,
  Sparkles,
  Info,
} from '@/components/ui/icons';

interface ProfilingData {
  audience_type: string;
  experience_level?: string;
  industry?: string;
  job_role?: string;
  years_experience?: number;
  company_size?: string;
  education_level?: string;
  grade_level?: string;
  interests?: string[];
  goals?: string[];
  current_tools?: string[];
  challenges?: string[];
}

interface ProfilingQuestionnaireProps {
  onComplete: (data: ProfilingData) => void;
  onSkip?: () => void;
}

export const ProfilingQuestionnaire: React.FC<ProfilingQuestionnaireProps> = ({
  onComplete,
  onSkip,
}) => {
  const { selectedAudience, setSelectedAudience } = usePersonalization();
  const [currentStep, setCurrentStep] = useState(0);
  const [profilingData, setProfilingData] = useState<ProfilingData>({
    audience_type: selectedAudience !== 'All' ? selectedAudience : '',
  });

  const audienceOptions = [
    {
      value: 'primary',
      label: 'Young Learners',
      description: 'Ages 8-14, elementary to middle school',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      value: 'secondary',
      label: 'Teenagers',
      description: 'Ages 15-19, high school to early college',
      icon: GraduationCap,
      color: 'bg-purple-500',
    },
    {
      value: 'professional',
      label: 'Professionals',
      description: 'Working individuals seeking to enhance AI skills',
      icon: Briefcase,
      color: 'bg-green-500',
    },
    {
      value: 'business',
      label: 'SMEs',
      description: 'Small and medium enterprise owners/managers',
      icon: Building2,
      color: 'bg-orange-500',
    },
  ];

  const experienceLevels = [
    { value: 'none', label: 'No Experience', description: "I haven't used AI tools before" },
    { value: 'basic', label: 'Basic', description: "I've tried a few AI tools occasionally" },
    {
      value: 'intermediate',
      label: 'Intermediate',
      description: 'I use AI tools regularly in my work/studies',
    },
    {
      value: 'advanced',
      label: 'Advanced',
      description: "I'm proficient with multiple AI tools and integrate them into my workflow",
    },
  ];

  const commonGoals = {
    primary: [
      'Learn about AI basics',
      'Find fun AI learning tools',
      'Improve homework and study skills',
      'Explore creative AI projects',
    ],
    secondary: [
      'Prepare for college/career',
      'Learn AI programming',
      'Build AI projects',
      'Understand AI ethics',
      'Explore AI career paths',
    ],
    professional: [
      'Increase productivity',
      'Learn new AI tools',
      'Automate repetitive tasks',
      'Enhance my skill set',
      'Stay competitive in my field',
    ],
    business: [
      'Improve business efficiency',
      'Reduce operational costs',
      'Enhance customer experience',
      'Make data-driven decisions',
      'Scale business operations',
    ],
  };

  const updateProfilingData = (updates: Partial<ProfilingData>) => {
    setProfilingData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (
      currentStep === 0 &&
      profilingData.audience_type &&
      profilingData.audience_type !== selectedAudience
    ) {
      setSelectedAudience(profilingData.audience_type as Audience);
    }

    if (currentStep < getSteps().length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(profilingData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleGoalToggle = (goal: string) => {
    const currentGoals = profilingData.goals || [];
    const newGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal];
    updateProfilingData({ goals: newGoals });
  };

  const getSteps = () => {
    const steps = [
      {
        title: 'Select Your Profile',
        description: 'Help us understand who you are',
        content: (
          <div className="space-y-4">
            <RadioGroup
              value={profilingData.audience_type}
              onValueChange={value => updateProfilingData({ audience_type: value })}
            >
              {audienceOptions.map(option => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    className="flex items-start space-x-3 p-4 rounded-lg hover:bg-muted/50 transition-colors border border-border"
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${option.color} bg-opacity-10`}>
                          <Icon className={`h-5 w-5 text-${option.color.replace('bg-', '')}`} />
                        </div>
                        <div className="font-semibold text-lg">{option.label}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        ),
      },
      {
        title: 'AI Experience Level',
        description: 'How familiar are you with AI tools?',
        content: (
          <div className="space-y-4">
            <RadioGroup
              value={profilingData.experience_level}
              onValueChange={value => updateProfilingData({ experience_level: value })}
            >
              {experienceLevels.map(level => (
                <div
                  key={level.value}
                  className="flex items-start space-x-3 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={level.value} id={level.value} className="mt-1" />
                  <Label htmlFor={level.value} className="flex-1 cursor-pointer">
                    <div className="font-medium mb-1">{level.label}</div>
                    <div className="text-sm text-muted-foreground">{level.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ),
      },
    ];

    // Add audience-specific questions
    if (profilingData.audience_type === 'professional') {
      steps.push({
        title: 'Professional Details',
        description: 'Tell us about your work',
        content: (
          <div className="space-y-4">
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g., Healthcare, Finance, Education"
                value={profilingData.industry || ''}
                onChange={e => updateProfilingData({ industry: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="job_role">Job Role</Label>
              <Input
                id="job_role"
                placeholder="e.g., Software Engineer, Marketing Manager"
                value={profilingData.job_role || ''}
                onChange={e => updateProfilingData({ job_role: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="years_experience">Years of Experience</Label>
              <Input
                id="years_experience"
                type="number"
                min="0"
                placeholder="e.g., 5"
                value={profilingData.years_experience || ''}
                onChange={e =>
                  updateProfilingData({ years_experience: parseInt(e.target.value) || 0 })
                }
                className="mt-2"
              />
            </div>
          </div>
        ),
      });
    } else if (profilingData.audience_type === 'business') {
      steps.push({
        title: 'Business Details',
        description: 'Tell us about your business',
        content: (
          <div className="space-y-4">
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g., Retail, Manufacturing, Services"
                value={profilingData.industry || ''}
                onChange={e => updateProfilingData({ industry: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="company_size">Company Size</Label>
              <RadioGroup
                value={profilingData.company_size}
                onValueChange={value => updateProfilingData({ company_size: value })}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1-10" id="size-1-10" />
                  <Label htmlFor="size-1-10">1-10 employees</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="11-50" id="size-11-50" />
                  <Label htmlFor="size-11-50">11-50 employees</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="51-200" id="size-51-200" />
                  <Label htmlFor="size-51-200">51-200 employees</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="201+" id="size-201" />
                  <Label htmlFor="size-201">201+ employees</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        ),
      });
    } else if (profilingData.audience_type === 'secondary') {
      steps.push({
        title: 'Education Details',
        description: 'Tell us about your education',
        content: (
          <div className="space-y-4">
            <div>
              <Label htmlFor="education_level">Current Education Level</Label>
              <RadioGroup
                value={profilingData.education_level}
                onValueChange={value => updateProfilingData({ education_level: value })}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high-school" id="high-school" />
                  <Label htmlFor="high-school">High School</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="college" id="college" />
                  <Label htmlFor="college">College/University</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gap-year" id="gap-year" />
                  <Label htmlFor="gap-year">Gap Year</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        ),
      });
    } else if (profilingData.audience_type === 'primary') {
      steps.push({
        title: 'Learning Details',
        description: 'Tell us about your learning',
        content: (
          <div className="space-y-4">
            <div>
              <Label htmlFor="grade_level">Grade Level</Label>
              <RadioGroup
                value={profilingData.grade_level}
                onValueChange={value => updateProfilingData({ grade_level: value })}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="elementary" id="elementary" />
                  <Label htmlFor="elementary">Elementary (Grades 1-5)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="middle" id="middle" />
                  <Label htmlFor="middle">Middle School (Grades 6-8)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        ),
      });
    }

    // Goals step for all audiences
    if (profilingData.audience_type) {
      const goals =
        commonGoals[profilingData.audience_type as keyof typeof commonGoals] ||
        commonGoals.professional;
      steps.push({
        title: 'Your Goals',
        description: 'What do you hope to achieve? (Select all that apply)',
        content: (
          <div className="space-y-3">
            {goals.map(goal => (
              <div
                key={goal}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={goal}
                  checked={profilingData.goals?.includes(goal) || false}
                  onCheckedChange={() => handleGoalToggle(goal)}
                />
                <Label htmlFor={goal} className="flex-1 cursor-pointer font-medium">
                  {goal}
                </Label>
              </div>
            ))}
          </div>
        ),
      });
    }

    return steps;
  };

  const steps = getSteps();
  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const canProceed = () => {
    if (currentStep === 0) return !!profilingData.audience_type;
    if (currentStep === 1) return !!profilingData.experience_level;
    return true;
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Profile Assessment</CardTitle>
                <CardDescription>Help us personalize your assessment experience</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {currentStep + 1} / {steps.length}
            </Badge>
          </div>

          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {currentStepData.title}
            </h3>
            <p className="text-sm text-muted-foreground flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {currentStepData.description}
            </p>
          </div>

          {currentStepData.content}
        </CardContent>

        <CardFooter className="flex justify-between">
          <div>
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {onSkip && currentStep === 0 && (
              <Button variant="ghost" onClick={onSkip}>
                Skip Profiling
              </Button>
            )}
            <Button onClick={handleNext} disabled={!canProceed()}>
              {currentStep === steps.length - 1 ? 'Start Assessment' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
