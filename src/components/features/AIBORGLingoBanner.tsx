/**
 * AIBORGLingo Banner Component
 *
 * Promotional banner for the AIBORGLingo gamified AI learning tool.
 * Features:
 * - Eye-catching gradient design with Duolingo-inspired elements
 * - Dismissible with sessionStorage persistence
 * - Responsive design for all screen sizes
 * - Call-to-action linking to the AIBORGLingo app
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Gamepad2,
  Sparkles,
  ArrowRight,
  Flame,
  Trophy,
  Heart,
  Zap,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STORAGE_KEY = 'aiborglingo-banner-dismissed';

export function AIBORGLingoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if banner should be shown
    const isDismissed = sessionStorage.getItem(STORAGE_KEY) === 'true';

    if (!isDismissed) {
      // Small delay for smooth entrance animation
      setTimeout(() => setIsVisible(true), 100);
    }
  }, []);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    sessionStorage.setItem(STORAGE_KEY, 'true');

    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  const handleTryNow = () => {
    navigate('/lingo');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <header
      className={`relative w-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 overflow-hidden transition-all duration-300 ${
        isAnimatingOut ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'
      }`}
      aria-label="AIBORGLingo announcement"
    >
      {/* Animated Background Patterns - Duolingo-style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {/* Floating circles */}
        <div className="absolute top-1/4 left-1/6 w-20 h-20 bg-white rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-yellow-300 rounded-full animate-bounce delay-300" />
        <div className="absolute bottom-1/4 left-1/3 w-12 h-12 bg-white rounded-full animate-pulse delay-500" />
        <div className="absolute top-1/2 right-1/6 w-10 h-10 bg-yellow-300 rounded-full animate-bounce delay-700" />

        {/* Glowing effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-4 sm:py-5">
          {/* Left Icon - Game Controller */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="relative">
              <Gamepad2 className="w-10 h-10 text-white animate-bounce" aria-hidden="true" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse" />
            </div>
            <div className="h-10 w-px bg-white/30" />
          </div>

          {/* Mobile Icon */}
          <div className="flex sm:hidden items-center">
            <Gamepad2 className="w-7 h-7 text-white animate-bounce" aria-hidden="true" />
          </div>

          {/* Center Message */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Badge className="bg-yellow-400 text-yellow-900 border-yellow-300 px-3 py-1 text-sm font-bold animate-pulse">
                <Sparkles className="w-3 h-3 mr-1 inline" />
                NEW
              </Badge>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                Introducing AIBORGLingo!
              </h2>
            </div>

            <p className="text-sm sm:text-base md:text-lg text-emerald-50 drop-shadow-md max-w-2xl font-medium">
              Learn AI the fun way - Duolingo-style with XP, streaks, hearts & AI-powered feedback
            </p>

            {/* Gamification Icons Row */}
            <div className="flex items-center gap-4 text-white/90 text-xs sm:text-sm">
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-300" />
                <span>Streaks</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-yellow-300" />
                <span>XP Points</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-300" />
                <span>Lives</span>
              </div>
              <div className="flex items-center gap-1 hidden sm:flex">
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>Achievements</span>
              </div>
            </div>

            {/* Call-to-Action Button */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-1">
              <Button
                onClick={handleTryNow}
                className="bg-white text-emerald-600 hover:bg-yellow-50 font-bold shadow-lg hover:shadow-xl transition-all group px-6"
                size="sm"
              >
                <Gamepad2 className="w-4 h-4 mr-2" />
                Try AIBORGLingo Now
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-100 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                <Sparkles className="w-3 h-3" />
                <span className="font-medium">5-min lessons</span>
              </div>
            </div>
          </div>

          {/* Right Icon - Trophy */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="h-10 w-px bg-white/30" />
            <div className="relative">
              <Trophy className="w-10 h-10 text-yellow-300 animate-pulse" aria-hidden="true" />
              <Sparkles className="absolute -top-1 -left-1 w-4 h-4 text-white animate-pulse delay-300" />
            </div>
          </div>

          {/* Mobile Trophy Icon */}
          <div className="flex sm:hidden items-center">
            <Trophy className="w-7 h-7 text-yellow-300 animate-pulse" aria-hidden="true" />
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-white hover:text-white hover:bg-white/20 transition-colors shrink-0 ml-2"
            aria-label="Dismiss AIBORGLingo banner"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Decorative Border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-emerald-300 to-teal-400 opacity-80" />
    </header>
  );
}
