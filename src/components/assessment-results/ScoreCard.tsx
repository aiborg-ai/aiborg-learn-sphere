import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { AssessmentResult } from './types';
import type { AugmentationLevel } from './constants';
import { COLORS, LEVEL_DESCRIPTIONS } from './constants';

interface ScoreCardProps {
  assessment: AssessmentResult;
  scorePercentage: number;
}

export function ScoreCard({ assessment, scorePercentage }: ScoreCardProps) {
  const augmentationLevel = assessment.augmentation_level as AugmentationLevel;

  return (
    <Card className="mb-8">
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Score Circle */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-8 border-muted flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold">{scorePercentage}%</div>
                  <div className="text-sm text-muted-foreground">AI Score</div>
                </div>
              </div>
              <div
                className="absolute inset-0 w-32 h-32 rounded-full border-8"
                style={{
                  borderColor: COLORS[augmentationLevel],
                  borderRightColor: 'transparent',
                  borderBottomColor: 'transparent',
                  transform: `rotate(${(scorePercentage / 100) * 180 - 45}deg)`,
                }}
              />
            </div>
          </div>

          {/* Level Badge */}
          <div className="flex flex-col items-center justify-center text-center">
            <Badge
              className="text-lg px-4 py-2 mb-4"
              style={{
                backgroundColor: COLORS[augmentationLevel],
                color: 'white',
              }}
            >
              {assessment.augmentation_level.toUpperCase()}
            </Badge>
            <p className="text-sm text-muted-foreground">{LEVEL_DESCRIPTIONS[augmentationLevel]}</p>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Score</span>
              <span className="font-semibold">
                {assessment.total_score}/{assessment.max_possible_score}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Completion Time</span>
              <span className="font-semibold">
                {Math.floor(assessment.completion_time_seconds / 60)}m{' '}
                {assessment.completion_time_seconds % 60}s
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Audience Group</span>
              <span className="font-semibold">{assessment.audience_type || 'General'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
