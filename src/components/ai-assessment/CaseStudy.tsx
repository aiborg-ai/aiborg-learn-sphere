import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Users,
  Target,
  TrendingUp,
  AlertCircle,
  FileText,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CaseStudyData {
  company_name?: string;
  industry?: string;
  company_size?: string;
  background?: string;
  challenge?: string;
  current_situation?: string;
  goals?: string[];
  constraints?: string[];
  metrics?: Array<{
    name: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  }>;
  stakeholders?: Array<{
    role: string;
    concern: string;
  }>;
}

export interface CaseStudyProps {
  question: {
    id: string;
    question_text: string;
    question_type: 'case_study' | 'multiple_choice' | 'single_choice';
    case_study_data: CaseStudyData;
    help_text?: string;
    metadata?: {
      difficulty?: string;
      time_estimate?: string;
      real_world_company?: string;
    };
    options: Array<{
      id: string;
      option_text: string;
      description?: string;
      is_correct?: boolean;
      order_index: number;
    }>;
  };
  selectedOptions: string[];
  onSelectionChange: (optionIds: string[]) => void;
}

export const CaseStudy: React.FC<CaseStudyProps> = ({
  question,
  selectedOptions,
  onSelectionChange,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    background: true,
    challenge: true,
    metrics: false,
    stakeholders: false,
  });

  const caseData = question.case_study_data;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSingleChoice = (optionId: string) => {
    onSelectionChange([optionId]);
  };

  const handleMultipleChoice = (optionId: string) => {
    const newSelection = selectedOptions.includes(optionId)
      ? selectedOptions.filter(id => id !== optionId)
      : [...selectedOptions, optionId];
    onSelectionChange(newSelection);
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default:
        return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Case Study Header */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">Case Study</CardTitle>
              </div>
              {caseData.company_name && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="font-semibold text-lg">{caseData.company_name}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {caseData.industry && <Badge variant="secondary">{caseData.industry}</Badge>}
                {caseData.company_size && (
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {caseData.company_size}
                  </Badge>
                )}
                {question.metadata?.difficulty && (
                  <Badge variant="outline">{question.metadata.difficulty}</Badge>
                )}
              </div>
            </div>
            {question.metadata?.time_estimate && (
              <Badge className="text-sm">⏱️ {question.metadata.time_estimate}</Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Case Study Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="situation">Situation</TabsTrigger>
          <TabsTrigger value="data">Data & Metrics</TabsTrigger>
          <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Background */}
          {caseData.background && (
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection('background')}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Background</CardTitle>
                  {expandedSections.background ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </CardHeader>
              {expandedSections.background && (
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {caseData.background}
                  </p>
                </CardContent>
              )}
            </Card>
          )}

          {/* Goals */}
          {caseData.goals && caseData.goals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Goals & Objectives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {caseData.goals.map((goal, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">✓</span>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="situation" className="space-y-4">
          {/* Challenge */}
          {caseData.challenge && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-900">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  The Challenge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{caseData.challenge}</p>
              </CardContent>
            </Card>
          )}

          {/* Current Situation */}
          {caseData.current_situation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current Situation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {caseData.current_situation}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Constraints */}
          {caseData.constraints && caseData.constraints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Constraints</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {caseData.constraints.map((constraint, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-red-500 mt-1">⚠</span>
                      <span>{constraint}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          {caseData.metrics && caseData.metrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {caseData.metrics.map((metric, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="text-sm font-medium">{metric.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{metric.value}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stakeholders" className="space-y-4">
          {caseData.stakeholders && caseData.stakeholders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Key Stakeholders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {caseData.stakeholders.map((stakeholder, index) => (
                    <div key={index}>
                      {index > 0 && <Separator className="my-3" />}
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">{stakeholder.role}</p>
                        <p className="text-sm text-muted-foreground">{stakeholder.concern}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Question */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-lg">{question.question_text}</CardTitle>
          {question.help_text && <CardDescription>{question.help_text}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Answer Options */}
          {question.question_type === 'single_choice' || question.question_type === 'case_study' ? (
            <RadioGroup
              value={selectedOptions[0] || ''}
              onValueChange={handleSingleChoice}
              className="space-y-3"
            >
              {question.options
                .sort((a, b) => a.order_index - b.order_index)
                .map(option => (
                  <div
                    key={option.id}
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors ${
                      selectedOptions.includes(option.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={option.id} id={option.id} className="mt-0.5" />
                    <Label
                      htmlFor={option.id}
                      className="flex-1 cursor-pointer space-y-1 leading-relaxed"
                    >
                      <span className="font-medium">{option.option_text}</span>
                      {option.description && (
                        <p className="text-sm text-muted-foreground font-normal">
                          {option.description}
                        </p>
                      )}
                    </Label>
                  </div>
                ))}
            </RadioGroup>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Select all that apply:</p>
              {question.options
                .sort((a, b) => a.order_index - b.order_index)
                .map(option => (
                  <div
                    key={option.id}
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors ${
                      selectedOptions.includes(option.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <Checkbox
                      id={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={() => handleMultipleChoice(option.id)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor={option.id}
                      className="flex-1 cursor-pointer space-y-1 leading-relaxed"
                    >
                      <span className="font-medium">{option.option_text}</span>
                      {option.description && (
                        <p className="text-sm text-muted-foreground font-normal">
                          {option.description}
                        </p>
                      )}
                    </Label>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {question.metadata?.real_world_company && (
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground italic">
              💡 This case study is inspired by real-world challenges faced by companies like{' '}
              {question.metadata.real_world_company}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
