/**
 * Review & Generate Step - Step 3 of Learning Path Wizard
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, ArrowLeft, Loader2, Sparkles, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { LEVEL_CONFIG, type Category, type WizardFormData } from './types';

interface ReviewGenerateStepProps {
  formData: WizardFormData;
  categories: Category[];
  generating: boolean;
  onGenerate: () => void;
  onBack: () => void;
}

export function ReviewGenerateStep({
  formData,
  categories,
  generating,
  onGenerate,
  onBack,
}: ReviewGenerateStepProps) {
  const selectedCategories = categories.filter(c => formData.focusCategoryIds.includes(c.id));

  return (
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
            <div className="text-white font-medium">{formData.goalTitle}</div>
          </div>

          <div className="p-4 bg-white/5 rounded-lg">
            <div className="text-white/60 text-sm mb-1">Target Level</div>
            <Badge className={LEVEL_CONFIG[formData.targetLevel].color}>
              {LEVEL_CONFIG[formData.targetLevel].label}
            </Badge>
          </div>

          <div className="p-4 bg-white/5 rounded-lg">
            <div className="text-white/60 text-sm mb-2">
              Focus Areas ({selectedCategories.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map(c => (
                <Badge key={c.id} variant="outline" className="text-white border-white/30">
                  {c.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-lg text-center">
              <Clock className="h-6 w-6 text-white/60 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{formData.estimatedWeeks}</div>
              <div className="text-white/60 text-sm">weeks</div>
            </div>
            <div className="p-4 bg-white/5 rounded-lg text-center">
              <TrendingUp className="h-6 w-6 text-white/60 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{formData.hoursPerWeek}</div>
              <div className="text-white/60 text-sm">hours/week</div>
            </div>
          </div>
        </div>

        <Alert className="bg-green-500/20 border-green-500/30">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-white/80">
            Your path will include courses, exercises, {formData.includeWorkshops && 'workshops, '}{' '}
            and assessments tailored to your needs.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 text-white border-white/20"
            disabled={generating}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={onGenerate} className="flex-1 btn-hero" disabled={generating}>
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
  );
}
