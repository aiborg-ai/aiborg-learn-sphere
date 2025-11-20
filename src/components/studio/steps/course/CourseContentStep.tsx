/**
 * CourseContentStep Component
 * Step 2: Course content - features, level, mode, duration, prerequisites
 */

import React, { useState } from 'react';
import { BookOpen, Plus, X, GripVertical } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { StepComponentProps, CourseWizardData } from '@/types/studio.types';

export function CourseContentStep({ data, onUpdate }: StepComponentProps<CourseWizardData>) {
  const [newFeature, setNewFeature] = useState('');

  // Add feature
  const addFeature = () => {
    if (newFeature.trim()) {
      onUpdate({ features: [...data.features, newFeature.trim()] });
      setNewFeature('');
    }
  };

  // Remove feature
  const removeFeature = (index: number) => {
    onUpdate({ features: data.features.filter((_, i) => i !== index) });
  };

  // Move feature up/down
  const moveFeature = (index: number, direction: 'up' | 'down') => {
    const newFeatures = [...data.features];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newFeatures.length) {
      [newFeatures[index], newFeatures[newIndex]] = [newFeatures[newIndex], newFeatures[index]];
      onUpdate({ features: newFeatures });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Content & Features</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Define what students will learn and how the course is delivered
          </p>
        </div>
      </div>

      {/* Course Features/Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Course Features</CardTitle>
          <CardDescription>
            List the key features, modules, or highlights of your course (at least 1 required)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Feature Input */}
          <div className="flex gap-2">
            <Input
              value={newFeature}
              onChange={e => setNewFeature(e.target.value)}
              placeholder="e.g., Live Q&A sessions with instructors"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addFeature();
                }
              }}
            />
            <Button onClick={addFeature} disabled={!newFeature.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Features List */}
          {data.features.length > 0 ? (
            <div className="space-y-2">
              {data.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md group">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveFeature(index, 'up')}
                      disabled={index === 0}
                      className="h-4 w-4 p-0"
                    >
                      <GripVertical className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveFeature(index, 'down')}
                      disabled={index === data.features.length - 1}
                      className="h-4 w-4 p-0"
                    >
                      <GripVertical className="w-3 h-3" />
                    </Button>
                  </div>
                  <span className="flex-1 text-sm">{feature}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFeature(index)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No features added yet. Add at least one feature to continue.
            </p>
          )}

          <Badge variant={data.features.length > 0 ? 'default' : 'secondary'}>
            {data.features.length} feature{data.features.length !== 1 ? 's' : ''} added
          </Badge>
        </CardContent>
      </Card>

      {/* Course Level */}
      <div className="space-y-2">
        <div className="text-sm font-medium">
          Course Level
          <span className="text-destructive ml-1">*</span>
        </div>
        <RadioGroup
          value={data.level}
          onValueChange={(level: CourseWizardData['level']) => onUpdate({ level })}
          className="grid grid-cols-3 gap-4"
        >
          <div>
            <RadioGroupItem value="beginner" id="beginner" className="peer sr-only" />
            <Label
              htmlFor="beginner"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <span className="text-sm font-semibold">Beginner</span>
              <span className="text-xs text-muted-foreground text-center mt-1">
                No prior knowledge required
              </span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="intermediate" id="intermediate" className="peer sr-only" />
            <Label
              htmlFor="intermediate"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <span className="text-sm font-semibold">Intermediate</span>
              <span className="text-xs text-muted-foreground text-center mt-1">
                Some experience needed
              </span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="advanced" id="advanced" className="peer sr-only" />
            <Label
              htmlFor="advanced"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <span className="text-sm font-semibold">Advanced</span>
              <span className="text-xs text-muted-foreground text-center mt-1">
                Expert-level content
              </span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Delivery Mode */}
      <div className="space-y-2">
        <div className="text-sm font-medium">
          Delivery Mode
          <span className="text-destructive ml-1">*</span>
        </div>
        <Select
          value={data.mode}
          onValueChange={(mode: CourseWizardData['mode']) => onUpdate({ mode })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="online">🌐 Online</SelectItem>
            <SelectItem value="in-person">🏢 In-Person</SelectItem>
            <SelectItem value="hybrid">🔄 Hybrid (Online + In-Person)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label htmlFor="duration">
          Course Duration
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="duration"
          value={data.duration}
          onChange={e => onUpdate({ duration: e.target.value })}
          placeholder="e.g., 8 weeks, 3 months, 40 hours"
          required
        />
        <p className="text-xs text-muted-foreground">
          Specify how long the course takes to complete
        </p>
      </div>

      {/* Prerequisites */}
      <div className="space-y-2">
        <Label htmlFor="prerequisites">Prerequisites (Optional)</Label>
        <Textarea
          id="prerequisites"
          value={data.prerequisites || ''}
          onChange={e => onUpdate({ prerequisites: e.target.value })}
          placeholder="List any prerequisites, prior knowledge, or requirements for taking this course..."
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Help students understand if they're ready for this course
        </p>
      </div>
    </div>
  );
}
