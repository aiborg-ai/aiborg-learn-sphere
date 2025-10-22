/**
 * AIComputerAssemblyBanner Component
 *
 * Announcement banner for AI Computer Assembly Programme
 * Features:
 * - Time-based visibility (active until Friday evening)
 * - Dismissible with localStorage persistence
 * - Tech-themed design with circuit patterns and animations
 * - Clear call-to-action linking to the programme
 * - Fully responsive and accessible
 */

import { useState, useEffect } from 'react';
import { X, Cpu, Sparkles, ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// Banner active period: Until Friday evening (Oct 24, 2025 at 6 PM)
const BANNER_END = new Date('2025-10-24T18:00:00');
const STORAGE_KEY = 'ai-computer-assembly-banner-dismissed-2025';

export function AIComputerAssemblyBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if banner should be shown
    const now = new Date();
    const isBeforeDeadline = now < BANNER_END;
    const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';

    if (isBeforeDeadline && !isDismissed) {
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

  const handleLearnMore = () => {
    // Navigate to training programs section with AI Computer Assembly focus
    navigate('/#training-programs');
    // Small delay to allow navigation before scrolling
    setTimeout(() => {
      const element = document.getElementById('training-programs');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <header
      className={`relative w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 overflow-hidden transition-all duration-300 ${
        isAnimatingOut ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'
      }`}
      aria-label="AI Computer Assembly Programme announcement"
    >
      {/* Animated Circuit Board Background Patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {/* Circuit lines */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse delay-300" />
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse delay-700" />

        {/* Circuit nodes */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
        <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-500" />
        <div className="absolute top-3/4 left-2/3 w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-1000" />

        {/* Glowing effect */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-4 sm:py-5">
          {/* Left Icon - CPU */}
          <div className="hidden sm:flex items-center gap-3">
            <Cpu className="w-8 h-8 text-cyan-300 animate-pulse" aria-hidden="true" />
            <div className="h-10 w-px bg-white/30" />
          </div>

          {/* Mobile CPU Icon */}
          <div className="flex sm:hidden items-center">
            <Cpu className="w-6 h-6 text-cyan-300 animate-pulse" aria-hidden="true" />
          </div>

          {/* Center Message */}
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" aria-hidden="true" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                🚀 AI Computer Assembly Programme Starts This Friday!
              </h2>
              <Sparkles
                className="w-5 h-5 text-yellow-300 animate-pulse delay-500"
                aria-hidden="true"
              />
            </div>

            <p className="text-sm sm:text-base text-cyan-100 drop-shadow-md max-w-2xl">
              Join us for hands-on learning experience in building AI-powered computers from scratch
            </p>

            {/* Call-to-Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
              <Button
                onClick={handleLearnMore}
                className="bg-white text-blue-600 hover:bg-cyan-50 font-semibold shadow-lg hover:shadow-xl transition-all group"
                size="sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Learn More
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="hidden sm:flex items-center gap-2 text-xs text-cyan-100 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                <Calendar className="w-3 h-3" />
                <span className="font-medium">Limited Seats Available</span>
              </div>
            </div>
          </div>

          {/* Right Icon - CPU */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="h-10 w-px bg-white/30" />
            <Cpu className="w-8 h-8 text-purple-300 animate-pulse delay-500" aria-hidden="true" />
          </div>

          {/* Mobile CPU Icon */}
          <div className="flex sm:hidden items-center">
            <Cpu className="w-6 h-6 text-purple-300 animate-pulse delay-500" aria-hidden="true" />
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-white hover:text-white hover:bg-white/20 transition-colors shrink-0 ml-2"
            aria-label="Dismiss AI Computer Assembly banner"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Decorative Border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 opacity-70" />

      {/* Animated Sparkle Elements (Tech particles) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-200 rounded-full animate-pulse"
            style={{
              left: `${5 + i * 8}%`,
              top: `${20 + (i % 4) * 20}%`,
              animationDelay: `${i * 150}ms`,
              opacity: 0.6,
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    </header>
  );
}
