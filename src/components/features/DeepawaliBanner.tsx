/**
 * DeepawaliBanner Component
 *
 * Festive banner for Deepawali/Diwali celebration
 * Features:
 * - Time-based visibility (active for 48 hours)
 * - Dismissible with localStorage persistence
 * - Traditional festive design with diyas, rangoli patterns, and animations
 * - Fully responsive and accessible
 */

import { useState, useEffect } from 'react';
import { X, Flame, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Banner active period: 48 hours from deployment
const BANNER_START = new Date('2025-10-19T00:00:00');
const BANNER_END = new Date('2025-10-21T00:00:00');
const STORAGE_KEY = 'deepawali-banner-dismissed-2025';

export function DeepawaliBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    // Check if banner should be shown
    const now = new Date();
    const isWithinActivePeriod = now >= BANNER_START && now < BANNER_END;
    const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';

    if (isWithinActivePeriod && !isDismissed) {
      // Small delay for smooth entrance animation
      setTimeout(() => setIsVisible(true), 100);
    }
  }, []);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    localStorage.setItem(STORAGE_KEY, 'true');

    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <header
      className={`relative w-full bg-gradient-to-r from-orange-600 via-amber-500 to-purple-600 overflow-hidden transition-all duration-300 ${
        isAnimatingOut ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'
      }`}
      aria-label="Deepawali celebration banner"
    >
      {/* Animated Background Patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Rangoli-inspired decorative circles */}
        <div className="absolute top-0 left-10 w-32 h-32 border-4 border-yellow-400/20 rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-10 w-24 h-24 border-4 border-orange-400/20 rounded-full animate-pulse delay-500" />
        <div className="absolute top-1/2 left-1/4 w-20 h-20 border-4 border-purple-400/20 rounded-full animate-pulse delay-1000" />

        {/* Glowing effect */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-3 sm:py-4">
          {/* Left Decorative Diyas */}
          <div className="hidden sm:flex items-center gap-2">
            <Flame className="w-5 h-5 text-yellow-300 animate-pulse" aria-hidden="true" />
            <Sparkles
              className="w-4 h-4 text-yellow-200 animate-pulse delay-300"
              aria-hidden="true"
            />
            <Flame className="w-5 h-5 text-yellow-300 animate-pulse delay-500" aria-hidden="true" />
          </div>

          {/* Mobile Diya */}
          <div className="flex sm:hidden items-center">
            <Flame className="w-5 h-5 text-yellow-300 animate-pulse" aria-hidden="true" />
          </div>

          {/* Center Message */}
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
            {/* Sparkles decoration */}
            <Sparkles
              className="hidden md:block w-6 h-6 text-yellow-200 animate-pulse"
              aria-hidden="true"
            />

            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white drop-shadow-lg font-display">
                ✨ Happy Deepawali! ✨
              </h2>
              <p className="text-xs sm:text-sm text-yellow-100 drop-shadow-md hidden sm:block">
                Wishing you and your family joy, prosperity, and endless light
              </p>
            </div>

            {/* Sparkles decoration */}
            <Sparkles
              className="hidden md:block w-6 h-6 text-yellow-200 animate-pulse delay-500"
              aria-hidden="true"
            />
          </div>

          {/* Right Decorative Diyas */}
          <div className="hidden sm:flex items-center gap-2">
            <Flame className="w-5 h-5 text-yellow-300 animate-pulse delay-700" aria-hidden="true" />
            <Sparkles
              className="w-4 h-4 text-yellow-200 animate-pulse delay-1000"
              aria-hidden="true"
            />
            <Flame className="w-5 h-5 text-yellow-300 animate-pulse delay-300" aria-hidden="true" />
          </div>

          {/* Mobile Diya */}
          <div className="flex sm:hidden items-center">
            <Flame className="w-5 h-5 text-yellow-300 animate-pulse delay-500" aria-hidden="true" />
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-white hover:text-white hover:bg-white/20 transition-colors shrink-0 ml-2"
            aria-label="Dismiss Deepawali banner"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Decorative Border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-purple-400 opacity-50" />

      {/* Animated Sparkle Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-200 rounded-full animate-pulse"
            style={{
              left: `${10 + i * 12}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 200}ms`,
              opacity: 0.6,
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    </header>
  );
}
