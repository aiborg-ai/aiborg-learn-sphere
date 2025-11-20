/**
 * Focus Areas Step - Step 2 of Learning Path Wizard
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, ArrowRight, ArrowLeft, AlertCircle } from '@/components/ui/icons';
import type { Category, WizardFormData } from './types';

interface FocusAreasStepProps {
  formData: WizardFormData;
  categories: Category[];
  onUpdate: (data: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function FocusAreasStep({
  formData,
  categories,
  onUpdate,
  onNext,
  onBack,
}: FocusAreasStepProps) {
  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    if (checked) {
      onUpdate({ focusCategoryIds: [...formData.focusCategoryIds, categoryId] });
    } else {
      onUpdate({ focusCategoryIds: formData.focusCategoryIds.filter(id => id !== categoryId) });
    }
  };

  return (
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
                  checked={formData.focusCategoryIds.includes(category.id)}
                  onCheckedChange={checked => handleCategoryToggle(category.id, checked as boolean)}
                />
                <Label htmlFor={category.id} className="flex-1 cursor-pointer">
                  <div className="text-white font-medium">{category.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={category.percentage} className="h-1 w-24" />
                    <span className="text-white/60 text-sm">
                      {Math.round(category.percentage)}%
                    </span>
                  </div>
                </Label>
                {category.percentage < 60 && (
                  <Badge variant="destructive" className="text-xs">
                    Needs Improvement
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weeks" className="text-white">
              Duration (weeks)
            </Label>
            <Input
              id="weeks"
              type="number"
              min="4"
              max="24"
              value={formData.estimatedWeeks}
              onChange={e => onUpdate({ estimatedWeeks: parseInt(e.target.value) || 8 })}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <Label htmlFor="hours" className="text-white">
              Hours per week
            </Label>
            <Input
              id="hours"
              type="number"
              min="1"
              max="20"
              value={formData.hoursPerWeek}
              onChange={e => onUpdate({ hoursPerWeek: parseInt(e.target.value) || 5 })}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1 text-white border-white/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={onNext}
            className="flex-1 btn-hero"
            disabled={formData.focusCategoryIds.length === 0}
          >
            Next: Review & Generate
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
