import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  TrendingUp,
  Award,
  Target,
  Sparkles,
  RefreshCw,
  Share2,
  ChevronRight,
  Zap,
  Trophy,
} from '@/components/ui/icons';
import { useNavigate } from 'react-router-dom';

interface AssessmentResult {
  id: string;
  total_score: number;
  max_possible_score: number;
  augmentation_level?: string;
  current_ability_estimate?: number;
  ability_standard_error?: number;
  questions_answered_count?: number;
  completion_time_seconds?: number;
  completed_at: string;
  is_adaptive?: boolean;
}

interface CategoryInsight {
  category_name: string;
  category_score: number;
  category_max_score: number;
  strength_level: string;
  percentage: number;
}

interface AssessmentResultsCardProps {
  assessment: AssessmentResult;
  insights?: CategoryInsight[];
  compact?: boolean;
}

const LEVEL_CONFIG = {
  expert: {
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: Trophy,
    label: 'AI Expert',
    description: 'Mastery level AI user',
  },
  advanced: {
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: Award,
    label: 'Advanced User',
    description: 'Strong AI adoption',
  },
  intermediate: {
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: Target,
    label: 'Intermediate',
    description: 'Growing AI skills',
  },
  beginner: {
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    icon: Sparkles,
    label: 'Beginner',
    description: 'Starting AI journey',
  },
};

export default function AssessmentResultsCard({
  assessment,
  insights = [],
  compact = false,
}: AssessmentResultsCardProps) {
  const navigate = useNavigate();
  const scorePercentage = Math.round(
    (assessment.total_score / assessment.max_possible_score) * 100
  );
  const level = assessment.augmentation_level || 'beginner';
  const config = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.beginner;
  const LevelIcon = config.icon;

  const handleShare = () => {
    const shareText = `I scored ${scorePercentage}% on the AIBORG Assessment! ${config.label} level 🎉`;
    if (navigator.share) {
      navigator.share({
        title: 'My AI Assessment Results',
        text: shareText,
        url: window.location.origin + `/ai-assessment/results/${assessment.id}`,
      });
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  if (compact) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20 transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center`}
              >
                <span className="text-2xl font-bold text-white">{scorePercentage}%</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`bg-gradient-to-r ${config.color} text-white border-0`}>
                    {config.label}
                  </Badge>
                  {assessment.is_adaptive && (
                    <Badge variant="outline" className="text-white/70 border-white/20">
                      <Zap className="h-3 w-3 mr-1" />
                      Adaptive
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-white/60">
                  Completed {new Date(assessment.completed_at).toLocaleDateString()}
                </p>
                {assessment.is_adaptive && assessment.current_ability_estimate !== undefined && (
                  <p className="text-xs text-white/50 mt-1">
                    IRT Ability: {assessment.current_ability_estimate.toFixed(2)} ±{' '}
                    {assessment.ability_standard_error?.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => navigate(`/ai-assessment/results/${assessment.id}`)}
            >
              View Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <Card
        className={`border-2 ${config.borderColor} ${config.bgColor} backdrop-blur-md overflow-hidden`}
      >
        <CardContent className="p-0">
          <div className={`h-2 bg-gradient-to-r ${config.color}`} />
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Score Circle */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative mb-4">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-white/10"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(scorePercentage / 100) * 352} 352`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white">{scorePercentage}%</div>
                      <div className="text-sm text-white/60">Score</div>
                    </div>
                  </div>
                </div>
                {assessment.is_adaptive && (
                  <Badge variant="outline" className="text-white/80 border-white/30">
                    <Zap className="h-3 w-3 mr-1" />
                    Adaptive Assessment
                  </Badge>
                )}
              </div>

              {/* Level Badge */}
              <div className="flex flex-col items-center justify-center text-center">
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center mb-4`}
                >
                  <LevelIcon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{config.label}</h3>
                <p className="text-white/70 text-sm">{config.description}</p>
                {assessment.is_adaptive && assessment.current_ability_estimate !== undefined && (
                  <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-xs text-white/50 mb-1">IRT Ability Estimate</div>
                    <div className="text-lg font-semibold text-white">
                      {assessment.current_ability_estimate.toFixed(2)}
                      <span className="text-sm text-white/60 ml-1">
                        ± {assessment.ability_standard_error?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-white/70">Total Score</span>
                  <span className="font-semibold text-white">
                    {assessment.total_score}/{assessment.max_possible_score}
                  </span>
                </div>
                {assessment.questions_answered_count && (
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-sm text-white/70">Questions</span>
                    <span className="font-semibold text-white">
                      {assessment.questions_answered_count}
                    </span>
                  </div>
                )}
                {assessment.completion_time_seconds && (
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-sm text-white/70">Time</span>
                    <span className="font-semibold text-white">
                      {Math.floor(assessment.completion_time_seconds / 60)}m{' '}
                      {assessment.completion_time_seconds % 60}s
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-white/70">Completed</span>
                  <span className="font-semibold text-white">
                    {new Date(assessment.completed_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Insights */}
      {insights.length > 0 && (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Performance by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white">{insight.category_name}</span>
                    <Badge
                      variant={
                        insight.strength_level === 'strong'
                          ? 'default'
                          : insight.strength_level === 'proficient'
                            ? 'secondary'
                            : 'outline'
                      }
                      className="text-white"
                    >
                      {Math.round(insight.percentage)}%
                    </Badge>
                  </div>
                  <Progress value={insight.percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-white/50">
                    <span>
                      {insight.category_score}/{insight.category_max_score} points
                    </span>
                    <span className="capitalize">{insight.strength_level}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-4">
        <Button
          onClick={() => navigate('/learning-path/generate')}
          className="w-full btn-hero bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Create Personalized Learning Path
        </Button>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => navigate('/ai-assessment')}
            variant="outline"
            className="flex-1 text-white border-white/20 hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retake Assessment
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex-1 text-white border-white/20 hover:bg-white/10"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Results
          </Button>
          <Button
            onClick={() => navigate(`/ai-assessment/results/${assessment.id}`)}
            variant="outline"
            className="flex-1 text-white border-white/20 hover:bg-white/10"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Full Report
          </Button>
        </div>
      </div>
    </div>
  );
}
