/**
 * VoteButtons Component
 * Reddit-style upvote/downvote buttons
 */

import { ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VoteButtonsProps } from '@/types/forum';

export function VoteButtons({
  upvotes,
  downvotes,
  userVote,
  onUpvote,
  onDownvote,
  disabled = false,
  size = 'md',
}: VoteButtonsProps) {
  const score = upvotes - downvotes;

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          sizeClasses[size],
          'rounded-full transition-colors',
          userVote === 'upvote'
            ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
            : 'text-gray-400 hover:bg-gray-100 hover:text-orange-600'
        )}
        onClick={onUpvote}
        disabled={disabled}
        aria-label="Upvote"
      >
        <ArrowUp className={iconSizeClasses[size]} />
      </Button>

      <span
        className={cn(
          'font-bold tabular-nums',
          textSizeClasses[size],
          score > 0 && 'text-orange-600',
          score < 0 && 'text-blue-600',
          score === 0 && 'text-gray-500'
        )}
      >
        {score >= 1000
          ? `${(score / 1000).toFixed(1)}k`
          : score <= -1000
            ? `${(score / 1000).toFixed(1)}k`
            : score}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          sizeClasses[size],
          'rounded-full transition-colors',
          userVote === 'downvote'
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            : 'text-gray-400 hover:bg-gray-100 hover:text-blue-600'
        )}
        onClick={onDownvote}
        disabled={disabled}
        aria-label="Downvote"
      >
        <ArrowDown className={iconSizeClasses[size]} />
      </Button>
    </div>
  );
}
