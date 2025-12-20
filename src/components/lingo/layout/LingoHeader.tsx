/**
 * LingoHeader Component
 * Top bar with hearts, streak, XP for Lingo pages
 */

import { ArrowLeft, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HeartsDisplay } from '../game/HeartsDisplay';
import { StreakBadge } from '../game/StreakBadge';
import { XPDisplay } from '../game/XPDisplay';
import { DailyGoalTracker } from '../game/DailyGoalTracker';

interface LingoHeaderProps {
  hearts: number;
  streak: number;
  xp: number;
  xpToday: number;
  dailyGoal: number;
  showBackButton?: boolean;
  backTo?: string;
  title?: string;
  className?: string;
}

export function LingoHeader({
  hearts,
  streak,
  xp,
  xpToday,
  dailyGoal,
  showBackButton = false,
  backTo = '/lingo',
  title,
  className,
}: LingoHeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(backTo)}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                AIBORG
              </span>
              <span className="text-xl font-bold text-green-500">Lingo</span>
            </Link>
          )}
          {title && <h1 className="text-lg font-semibold hidden sm:block">{title}</h1>}
        </div>

        {/* Center section - Daily goal (hidden on mobile) */}
        <div className="hidden md:flex flex-1 justify-center max-w-xs">
          <DailyGoalTracker current={xpToday} goal={dailyGoal} size="sm" className="w-full" />
        </div>

        {/* Right section - Stats */}
        <div className="flex items-center gap-4">
          <HeartsDisplay hearts={hearts} size="sm" />
          <StreakBadge streak={streak} size="sm" />
          <XPDisplay xp={xp} size="sm" />
          <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
            <Link to="/settings" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
