/**
 * Goal Setting Step - Step 1 of Learning Path Wizard
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Target, ArrowRight } from '@/components/ui/icons';
import { LEVEL_CONFIG, type WizardFormData } from './types';

interface GoalSettingStepProps {
  formData: WizardFormData;
  onUpdate: (data: Partial<WizardFormData>) => void;
  onNext: () => void;
}

export function GoalSettingStep({ formData, onUpdate, onNext }: GoalSettingStepProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="h-5 w-5" />
          What's Your Learning Goal?
        </CardTitle>
        <CardDescription className="text-white/70">Define what you want to achieve</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="goal-title" className="text-white">
            Goal Title *
          </Label>
          <Input
            id="goal-title"
            placeholder="e.g., Master AI Prompt Engineering"
            value={formData.goalTitle}
            onChange={e => onUpdate({ goalTitle: e.target.value })}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
        </div>

        <div>
          <Label htmlFor="goal-desc" className="text-white">
            Description (Optional)
          </Label>
          <Textarea
            id="goal-desc"
            placeholder="Describe what you want to learn and why..."
            value={formData.goalDescription}
            onChange={e => onUpdate({ goalDescription: e.target.value })}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            rows={3}
          />
        </div>

        <div>
          <div className="text-sm font-medium text-white mb-3">Target Level *</div>
          <RadioGroup
            value={formData.targetLevel}
            onValueChange={v => onUpdate({ targetLevel: v as WizardFormData['targetLevel'] })}
          >
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

        <Button onClick={onNext} className="w-full btn-hero" disabled={!formData.goalTitle.trim()}>
          Next: Choose Focus Areas
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
