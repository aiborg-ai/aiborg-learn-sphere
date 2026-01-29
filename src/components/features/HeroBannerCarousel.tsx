/**
 * Hero Banner Carousel Component
 *
 * Auto-rotating carousel for promotional banners on the homepage.
 * Features:
 * - AIBORGLingo introduction
 * - Season 2 Free AI Classes announcement
 * - Auto-advancement with manual navigation
 * - Responsive design with dot indicators
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  Sparkles,
  ArrowRight,
  Flame,
  Trophy,
  Heart,
  Zap,
  Calendar,
  Users,
  Clock,
  GraduationCap,
  Briefcase,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';

export function HeroBannerCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  // Auto-advance carousel every 6 seconds
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [api]);

  // Track current slide
  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api]
  );

  return (
    <div className="relative w-full">
      <Carousel
        setApi={setApi}
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="ml-0">
          {/* Slide 1: AIBORGLingo */}
          <CarouselItem className="pl-0">
            <LingoSlide onNavigate={() => navigate('/lingo')} />
          </CarouselItem>

          {/* Slide 2: Season 2 */}
          <CarouselItem className="pl-0">
            <Season2Slide
              onNavigate={() => {
                // Scroll to events section on homepage
                const eventsSection = document.getElementById('events');
                if (eventsSection) {
                  eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  // If not on homepage, navigate there first
                  navigate('/#events');
                }
              }}
            />
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      {/* Dot Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {[0, 1].map(index => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              current === index ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// AIBORGLingo Slide
function LingoSlide({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div
      className="relative w-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 overflow-hidden"
      aria-label="AIBORGLingo announcement"
    >
      {/* Animated Background Patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/6 w-20 h-20 bg-white rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-yellow-300 rounded-full animate-bounce delay-300" />
        <div className="absolute bottom-1/4 left-1/3 w-12 h-12 bg-white rounded-full animate-pulse delay-500" />
        <div className="absolute top-1/2 right-1/6 w-10 h-10 bg-yellow-300 rounded-full animate-bounce delay-700" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-5 sm:py-6">
          {/* Left Icon */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="relative">
              <Gamepad2 className="w-10 h-10 text-white animate-bounce" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse" />
            </div>
            <div className="h-10 w-px bg-white/30" />
          </div>

          {/* Mobile Icon */}
          <div className="flex sm:hidden items-center">
            <Gamepad2 className="w-7 h-7 text-white animate-bounce" />
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

            {/* Gamification Icons */}
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
              <div className="hidden sm:flex items-center gap-1">
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>Achievements</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-1">
              <Button
                onClick={onNavigate}
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

          {/* Right Icon */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="h-10 w-px bg-white/30" />
            <div className="relative">
              <Trophy className="w-10 h-10 text-yellow-300 animate-pulse" />
              <Sparkles className="absolute -top-1 -left-1 w-4 h-4 text-white animate-pulse delay-300" />
            </div>
          </div>

          {/* Mobile Trophy */}
          <div className="flex sm:hidden items-center">
            <Trophy className="w-7 h-7 text-yellow-300 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Bottom Border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-emerald-300 to-teal-400 opacity-80" />
    </div>
  );
}

// Season 2 Slide
function Season2Slide({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div
      className="relative w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 overflow-hidden"
      aria-label="Season 2 Free AI Classes announcement"
    >
      {/* Animated Background Patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/6 w-24 h-24 bg-pink-400 rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-yellow-300 rounded-full animate-bounce delay-300" />
        <div className="absolute bottom-1/4 left-1/3 w-14 h-14 bg-cyan-300 rounded-full animate-pulse delay-500" />
        <div className="absolute top-1/2 right-1/6 w-12 h-12 bg-pink-300 rounded-full animate-bounce delay-700" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-5 sm:py-6">
          {/* Left Icon */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="relative">
              <Calendar className="w-10 h-10 text-white animate-bounce" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse" />
            </div>
            <div className="h-10 w-px bg-white/30" />
          </div>

          {/* Mobile Icon */}
          <div className="flex sm:hidden items-center">
            <Calendar className="w-7 h-7 text-white animate-bounce" />
          </div>

          {/* Center Message */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Badge className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white border-0 px-3 py-1 text-sm font-bold animate-pulse">
                <Sparkles className="w-3 h-3 mr-1 inline" />
                FREE
              </Badge>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                Season 2: Free AI Classes Starting Feb 6!
              </h2>
            </div>

            <p className="text-sm sm:text-base md:text-lg text-purple-100 drop-shadow-md max-w-2xl font-medium">
              12-week AI education programs for all ages - completely FREE!
            </p>

            {/* Schedule Icons */}
            <div className="flex items-center gap-4 text-white/90 text-xs sm:text-sm flex-wrap justify-center">
              <div className="flex items-center gap-1">
                <GraduationCap className="w-4 h-4 text-pink-300" />
                <span>Under 14: Sat 11AM UK</span>
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="w-4 h-4 text-cyan-300" />
                <span>14+ & Pros: Fri 8PM UK</span>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <Users className="w-4 h-4 text-yellow-300" />
                <span>Global Online</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-1">
              <Button
                onClick={onNavigate}
                className="bg-white text-purple-600 hover:bg-yellow-50 font-bold shadow-lg hover:shadow-xl transition-all group px-6"
                size="sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Register Now - It's Free!
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="hidden sm:flex items-center gap-2 text-xs text-purple-100 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                <Clock className="w-3 h-3" />
                <span className="font-medium">12 weeks of learning</span>
              </div>
            </div>
          </div>

          {/* Right Icon */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="h-10 w-px bg-white/30" />
            <div className="relative">
              <Users className="w-10 h-10 text-cyan-300 animate-pulse" />
              <Sparkles className="absolute -top-1 -left-1 w-4 h-4 text-white animate-pulse delay-300" />
            </div>
          </div>

          {/* Mobile Users Icon */}
          <div className="flex sm:hidden items-center">
            <Users className="w-7 h-7 text-cyan-300 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Bottom Border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400 opacity-80" />
    </div>
  );
}
