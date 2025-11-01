/**
 * FamilyPassBanner Component
 *
 * Eye-catching home page banner promoting the Family Membership Pass
 * Features:
 * - Scarcity counter (limited spots)
 * - Social proof (family count)
 * - Value proposition
 * - Clear CTAs
 * - Warm, inviting design
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Sparkles, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useHasActiveMembership } from '@/hooks/useMembership';

interface FamilyPassBannerProps {
  /**
   * Show in compact mode (smaller, less prominent)
   */
  compact?: boolean;
}

// Simulated live counter (in production, fetch from database)
const INITIAL_SPOTS_REMAINING = 47;
const TOTAL_FAMILIES = 523; // Families already joined

export function FamilyPassBanner({ compact = false }: FamilyPassBannerProps) {
  const [spotsRemaining, setSpotsRemaining] = useState(INITIAL_SPOTS_REMAINING);
  const { data: hasActiveMembership } = useHasActiveMembership();

  // Simulate spot counter decreasing (for demo purposes)
  // In production, this would be real-time from database
  useEffect(() => {
    const interval = setInterval(() => {
      setSpotsRemaining(prev => {
        // Randomly decrease by 1-2 spots every 5-15 minutes
        const shouldDecrease = Math.random() > 0.95;
        if (shouldDecrease && prev > 30) {
          return prev - (Math.random() > 0.5 ? 1 : 2);
        }
        return prev;
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Don't show banner if user already has membership
  if (hasActiveMembership) {
    return null;
  }

  if (compact) {
    return <CompactBanner spotsRemaining={spotsRemaining} />;
  }

  return (
    <div className="relative w-full bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50 py-8 sm:py-12">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-amber-200/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-rose-200/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700" />
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-orange-200/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-6 sm:p-8 md:p-10 bg-white/95 backdrop-blur-sm shadow-2xl border-2 border-amber-200/50">
          {/* NEW Badge */}
          <div className="flex items-center justify-center mb-4">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 text-sm font-semibold animate-pulse">
              <Sparkles className="w-4 h-4 mr-1.5" />
              NEW: All Access Family Pass
            </Badge>
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Left Column: Value Proposition */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Unlimited Learning for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                  Your Entire Family
                </span>
              </h2>

              <p className="text-xl sm:text-2xl font-semibold text-gray-700">Just £20/Month</p>

              <p className="text-base sm:text-lg text-gray-600">
                Access 50+ AI courses, exclusive vault content, and priority event invitations for
                up to 6 family members.
              </p>

              {/* Feature List */}
              <div className="grid sm:grid-cols-2 gap-3 pt-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">All Courses</p>
                    <p className="text-sm text-gray-600">£2,500+ value</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Vault Content</p>
                    <p className="text-sm text-gray-600">200+ resources</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Event Access</p>
                    <p className="text-sm text-gray-600">Priority registration</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">6 Members</p>
                    <p className="text-sm text-gray-600">Whole family</p>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <Link to="/family-membership">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-2 border-amber-500 text-amber-700 hover:bg-amber-50"
                >
                  <Link to="/family-membership">Learn More</Link>
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-4 pt-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>30-Day Guarantee</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Cancel Anytime</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>No Credit Card</span>
                </div>
              </div>
            </div>

            {/* Right Column: Social Proof & Urgency */}
            <div className="space-y-4">
              {/* Social Proof */}
              <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex -space-x-3">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white flex items-center justify-center text-white font-semibold text-sm"
                      >
                        <Users className="w-5 h-5" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{TOTAL_FAMILIES}+ Families</p>
                    <p className="text-sm text-gray-600">Already learning together</p>
                  </div>
                </div>
              </Card>

              {/* Scarcity/Urgency */}
              <Card className="p-5 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg mb-1">
                      Early Bird Pricing Ends Soon
                    </p>
                    <p className="text-2xl font-bold text-red-600 mb-2">
                      Only {spotsRemaining} Spots Left
                    </p>
                    <p className="text-sm text-gray-600">
                      Lock in £20/month forever (normally £30/month)
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                    <span>Early Bird Spots</span>
                    <span>{spotsRemaining} remaining</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-red-500 to-orange-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${(spotsRemaining / 100) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </Card>

              {/* Value Comparison */}
              <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">Savings Calculator</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-green-600">Save £2,400</span>
                  <span className="text-gray-600">per year</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">vs. £49/course × 4 members × 12 months</p>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Compact version of banner for secondary placements
 */
function CompactBanner({ spotsRemaining }: { spotsRemaining: number }) {
  return (
    <div className="w-full bg-gradient-to-r from-amber-500 to-orange-600 py-3 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3">
          <Badge className="bg-white text-amber-600 font-semibold">NEW</Badge>
          <p className="font-semibold">Family Pass: Unlimited Learning for £20/Month</p>
          <span className="hidden md:inline text-sm opacity-90">
            • Only {spotsRemaining} spots left at this price
          </span>
        </div>

        <Button
          asChild
          size="sm"
          variant="secondary"
          className="bg-white text-amber-600 hover:bg-amber-50 font-semibold whitespace-nowrap"
        >
          <Link to="/family-membership">
            Learn More
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
