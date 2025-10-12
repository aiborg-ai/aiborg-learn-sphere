/**
 * Animated Badge Component
 * 3D-style animated badge with sparkle effects and rarity indicators
 */

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, Sparkles, Star, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedBadgeProps {
  icon?: string | React.ReactNode;
  iconUrl?: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  points: number;
  isUnlocked: boolean;
  rarity?: number;
  earnedDate?: string;
  size?: 'sm' | 'md' | 'lg';
  showSparkles?: boolean;
  className?: string;
}

const TIER_CONFIG = {
  bronze: {
    gradient: 'from-amber-700 via-amber-500 to-amber-700',
    glow: 'shadow-amber-500/50',
    sparkle: 'text-amber-400',
    ring: 'ring-amber-500',
    text: 'text-amber-700',
  },
  silver: {
    gradient: 'from-gray-400 via-gray-200 to-gray-400',
    glow: 'shadow-gray-400/50',
    sparkle: 'text-gray-300',
    ring: 'ring-gray-400',
    text: 'text-gray-600',
  },
  gold: {
    gradient: 'from-yellow-600 via-yellow-400 to-yellow-600',
    glow: 'shadow-yellow-500/50',
    sparkle: 'text-yellow-300',
    ring: 'ring-yellow-500',
    text: 'text-yellow-700',
  },
  platinum: {
    gradient: 'from-cyan-400 via-cyan-200 to-cyan-400',
    glow: 'shadow-cyan-400/50',
    sparkle: 'text-cyan-300',
    ring: 'ring-cyan-400',
    text: 'text-cyan-600',
  },
  diamond: {
    gradient: 'from-purple-600 via-pink-400 to-purple-600',
    glow: 'shadow-purple-500/50',
    sparkle: 'text-pink-300',
    ring: 'ring-purple-500',
    text: 'text-purple-600',
  },
};

export function AnimatedBadge({
  icon,
  iconUrl,
  name,
  description,
  tier,
  points,
  isUnlocked,
  rarity,
  earnedDate,
  size = 'md',
  showSparkles = true,
  className,
}: AnimatedBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = TIER_CONFIG[tier];

  const sizeClasses = {
    sm: {
      container: 'w-24 h-24',
      badge: 'w-16 h-16 text-2xl',
      sparkle: 'h-3 w-3',
    },
    md: {
      container: 'w-32 h-32',
      badge: 'w-24 h-24 text-4xl',
      sparkle: 'h-4 w-4',
    },
    lg: {
      container: 'w-40 h-40',
      badge: 'w-32 h-32 text-5xl',
      sparkle: 'h-5 w-5',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn('relative flex items-center justify-center', sizes.container, className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Sparkle effects */}
            {isUnlocked && showSparkles && (
              <>
                <Sparkles
                  className={cn(
                    sizes.sparkle,
                    config.sparkle,
                    'absolute top-0 right-2 animate-pulse',
                    isHovered && 'animate-bounce'
                  )}
                />
                <Sparkles
                  className={cn(
                    sizes.sparkle,
                    config.sparkle,
                    'absolute bottom-2 left-0 animate-pulse delay-100',
                    isHovered && 'animate-bounce'
                  )}
                />
                <Sparkles
                  className={cn(
                    sizes.sparkle,
                    config.sparkle,
                    'absolute top-2 left-2 animate-pulse delay-200',
                    isHovered && 'animate-bounce'
                  )}
                />
              </>
            )}

            {/* Main badge circle */}
            <div
              className={cn(
                'relative rounded-full flex items-center justify-center transition-all duration-300',
                sizes.badge,
                isUnlocked
                  ? cn(
                      `bg-gradient-to-br ${config.gradient}`,
                      `${config.glow} shadow-2xl`,
                      isHovered && 'scale-110 rotate-12'
                    )
                  : 'bg-gray-300 grayscale opacity-50'
              )}
            >
              {/* Glossy overlay */}
              {isUnlocked && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
              )}

              {/* Icon or Lock */}
              <div className="relative z-10">
                {isUnlocked ? (
                  iconUrl ? (
                    <img src={iconUrl} alt={name} className="h-12 w-12 object-contain" />
                  ) : typeof icon === 'string' ? (
                    <span>{icon}</span>
                  ) : (
                    icon || <Trophy className="h-8 w-8 text-white" />
                  )
                ) : (
                  <Lock className="h-8 w-8 text-gray-600" />
                )}
              </div>

              {/* Rarity indicator */}
              {isUnlocked && rarity && rarity < 25 && (
                <div className="absolute -top-1 -right-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 animate-pulse" />
                </div>
              )}
            </div>

            {/* Points badge */}
            {isUnlocked && (
              <div
                className={cn(
                  'absolute -bottom-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full px-2 py-0.5 text-xs font-bold shadow-lg flex items-center gap-1',
                  isHovered && 'scale-110'
                )}
              >
                <Award className="h-3 w-3" />
                {points}
              </div>
            )}
          </div>
        </TooltipTrigger>

        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-2xl">
                {isUnlocked ? (
                  iconUrl ? (
                    <img src={iconUrl} alt={name} className="h-8 w-8 object-contain" />
                  ) : typeof icon === 'string' ? (
                    icon
                  ) : (
                    '🏆'
                  )
                ) : (
                  '🔒'
                )}
              </div>
              <div>
                <div className="font-bold">{name}</div>
                <Badge variant="outline" className={cn('text-[10px]', config.text)}>
                  {tier.toUpperCase()}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{description}</p>

            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="h-3 w-3 text-yellow-500" />
              <span className="font-semibold">{points} points</span>
            </div>

            {isUnlocked && earnedDate && (
              <div className="text-xs text-muted-foreground">
                Unlocked: {new Date(earnedDate).toLocaleDateString()}
              </div>
            )}

            {!isUnlocked && (
              <div className="text-xs text-muted-foreground italic">
                <Lock className="h-3 w-3 inline mr-1" />
                Not yet unlocked
              </div>
            )}

            {rarity && rarity < 25 && (
              <div className="text-xs font-semibold text-purple-600">
                ⭐ Rare Achievement ({rarity}% of users)
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
