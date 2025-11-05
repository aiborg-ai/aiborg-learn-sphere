/**
 * November 2025 Campaign Banner
 *
 * Special offer for FHOAI Vault subscribers:
 * Get FREE Family Pass for the month of November 2025
 *
 * Active: Until November 30, 2025
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Sparkles, Users, Crown, X, ChevronRight } from 'lucide-react';
import { useVaultAccess } from '@/hooks/useVaultAccess';
import { cn } from '@/lib/utils';

export function NovemberVaultCampaignBanner() {
  const { hasVaultAccess, isLoading } = useVaultAccess();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Check if campaign is active (November 2025)
  const isCampaignActive = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed (10 = November)

    // Active only in November 2025
    return year === 2025 && month === 10;
  };

  // Check if user has already claimed (stored in localStorage)
  const hasClaimedOffer = () => {
    return localStorage.getItem('november_vault_campaign_claimed') === 'true';
  };

  useEffect(() => {
    // Check if user has dismissed the banner
    const dismissed = sessionStorage.getItem('november_vault_campaign_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  useEffect(() => {
    // Show banner with animation after component mounts
    if (shouldShowBanner) {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('november_vault_campaign_dismissed', 'true');
  };

  const handleClaimOffer = () => {
    // Scroll to Family Pass Banner
    const familyPassSection = document.querySelector('#family-pass-banner');
    if (familyPassSection) {
      const yOffset = -100;
      const y = familyPassSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }

    // Mark as claimed
    localStorage.setItem('november_vault_campaign_claimed', 'true');
  };

  // Only show if:
  // 1. Campaign is active (November 2025) - DISABLED FOR NOW
  // 2. User has vault access (FHOAI Vault subscriber) - DISABLED FOR NOW
  // 3. User hasn't dismissed it (this session)
  // 4. User hasn't claimed it yet
  // 5. Not loading
  const shouldShowBanner =
    // isCampaignActive() &&  // Temporarily disabled - show to everyone
    // hasVaultAccess &&      // Temporarily disabled - show to everyone
    !isDismissed &&
    !hasClaimedOffer() &&
    !isLoading;

  if (!shouldShowBanner) {
    return null;
  }

  return (
    <div
      className={cn(
        'w-full transition-all duration-700 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      )}
    >
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white shadow-2xl">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10 px-6 py-8 md:px-12 md:py-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left side - Message */}
              <div className="space-y-6">
                {/* Badge */}
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-black border-0 px-4 py-1.5 text-sm font-bold animate-pulse">
                    <Sparkles className="h-4 w-4 mr-2" />
                    EXCLUSIVE NOVEMBER OFFER
                  </Badge>
                  <Badge variant="outline" className="border-white/30 text-white px-3 py-1">
                    Limited Time
                  </Badge>
                </div>

                {/* Heading */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Gift className="h-10 w-10 text-amber-400 animate-bounce" />
                    <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-amber-200 to-white bg-clip-text text-transparent">
                      FREE Family Pass
                    </h2>
                  </div>
                  <p className="text-xl md:text-2xl font-semibold text-blue-100">
                    Thank you for being a valued FHOAI Vault subscriber!
                  </p>
                </div>

                {/* Benefits */}
                <div className="space-y-3">
                  <p className="text-lg text-blue-50">
                    This November, upgrade to our premium Family Pass at{' '}
                    <span className="font-bold text-amber-300 text-2xl">absolutely FREE!</span>
                  </p>

                  <div className="grid gap-2">
                    {[
                      { icon: Users, text: 'Add up to 6 family members' },
                      { icon: Crown, text: 'Unlimited access to 50+ courses' },
                      { icon: Sparkles, text: 'Priority event registration' },
                    ].map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 text-blue-50"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                          <benefit.icon className="h-4 w-4 text-black" />
                        </div>
                        <span className="text-base font-medium">{benefit.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fine print */}
                <p className="text-sm text-blue-200/80">
                  * Free for November 2025. Offer valid until November 30, 2025.
                  Regular pricing applies from December onwards.
                </p>
              </div>

              {/* Right side - CTA */}
              <div className="flex flex-col items-center justify-center space-y-6">
                {/* Visual element */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-white to-blue-50 rounded-full p-12 shadow-2xl">
                    <Gift className="h-24 w-24 text-purple-900" />
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={handleClaimOffer}
                  size="lg"
                  className="w-full md:w-auto bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 hover:from-amber-500 hover:via-orange-600 hover:to-amber-500 text-black font-bold text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-0 animate-pulse hover:animate-none"
                >
                  <span className="flex items-center gap-3">
                    Claim Your FREE Family Pass
                    <ChevronRight className="h-6 w-6" />
                  </span>
                </Button>

                <p className="text-center text-sm text-blue-100">
                  Click to learn more about unlimited learning for your entire family
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500" />
      </Card>
    </div>
  );
}
