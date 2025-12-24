// ============================================================================
// Rating Slider Component for AI-Readiness Assessment
// Interactive 1-5 rating scale with visual feedback and labels
// ============================================================================

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RatingSliderProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Fair',
  4: 'Good',
  5: 'Excellent',
};

const RATING_COLORS: Record<number, string> = {
  1: 'from-rose-500 to-red-600',
  2: 'from-orange-500 to-amber-600',
  3: 'from-amber-500 to-yellow-600',
  4: 'from-emerald-500 to-green-600',
  5: 'from-teal-500 to-cyan-600',
};

const RATING_BG_COLORS: Record<number, string> = {
  1: 'bg-rose-500/10',
  2: 'bg-orange-500/10',
  3: 'bg-amber-500/10',
  4: 'bg-emerald-500/10',
  5: 'bg-teal-500/10',
};

export function RatingSlider({
  value,
  onChange,
  label,
  helpText,
  required = false,
  disabled = false,
  className,
}: RatingSliderProps) {
  const currentRating = Math.max(1, Math.min(5, value || 3)); // Default to 3

  const handleValueChange = (values: number[]) => {
    onChange(values[0]);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Label and Help Text */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <Label className="text-base font-medium text-white flex items-center gap-2">
            {label}
            {required && <span className="text-rose-500">*</span>}
          </Label>
        </div>
        {helpText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-white/50 hover:text-white/80 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm">{helpText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Rating Display */}
      <div
        className={cn(
          'p-4 rounded-lg border transition-all',
          RATING_BG_COLORS[currentRating],
          disabled ? 'border-white/5 opacity-50' : 'border-white/20'
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center',
                RATING_COLORS[currentRating]
              )}
            >
              <span className="text-xl font-bold text-white">{currentRating}</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{RATING_LABELS[currentRating]}</div>
              <div className="text-xs text-white/60">
                {currentRating === 1 && 'Significant improvement needed'}
                {currentRating === 2 && 'Below expectations'}
                {currentRating === 3 && 'Meets basic requirements'}
                {currentRating === 4 && 'Exceeds expectations'}
                {currentRating === 5 && 'Best in class performance'}
              </div>
            </div>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <Slider
            value={[currentRating]}
            onValueChange={handleValueChange}
            min={1}
            max={5}
            step={1}
            disabled={disabled}
            className="w-full"
          />

          {/* Rating Scale Labels */}
          <div className="flex justify-between text-xs text-white/50 px-1">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
