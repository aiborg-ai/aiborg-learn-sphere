/**
 * Google AdSense Component
 *
 * Displays Google AdSense ads with proper configuration and error handling
 *
 * Usage:
 * <AdSense slot="blog" />
 * <AdSense slot="dashboard" />
 * <AdSense slot="assessment" />
 * <AdSense slot="custom" adSlot="1234567890" />
 */

import { useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';

interface AdSenseProps {
  slot: 'blog' | 'dashboard' | 'assessment' | 'custom';
  adSlot?: string; // For custom slots
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

// Configuration
const ADSENSE_ENABLED = import.meta.env.VITE_ENABLE_ADSENSE === 'true';
const PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID || '';

const AD_SLOTS = {
  blog: import.meta.env.VITE_ADSENSE_BLOG_SLOT || '',
  dashboard: import.meta.env.VITE_ADSENSE_DASHBOARD_SLOT || '',
  assessment: import.meta.env.VITE_ADSENSE_ASSESSMENT_SLOT || '',
};

export function AdSense({
  slot,
  adSlot,
  format = 'auto',
  responsive = true,
  style,
  className = '',
}: AdSenseProps) {
  const adRef = useRef<HTMLModElement>(null);
  const hasLoadedRef = useRef(false);

  // Determine the ad slot ID
  const slotId = slot === 'custom' ? adSlot : AD_SLOTS[slot];

  useEffect(() => {
    // Don't load ads if AdSense is disabled or no publisher ID
    if (!ADSENSE_ENABLED || !PUBLISHER_ID) {
      return;
    }

    // Don't load if no slot ID
    if (!slotId) {
      logger.warn(`AdSense: No slot ID configured for "${slot}"`);
      return;
    }

    // Load AdSense script if not already loaded
    if (!window.adsbygoogle && !document.querySelector('script[src*="adsbygoogle.js"]')) {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // Push ad for display
    if (adRef.current && !hasLoadedRef.current) {
      try {
        // Wait for script to load
        const checkAdsbygoogle = setInterval(() => {
          if (window.adsbygoogle) {
            clearInterval(checkAdsbygoogle);
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            hasLoadedRef.current = true;
          }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => clearInterval(checkAdsbygoogle), 5000);
      } catch (_error) {
        logger.error('AdSense _error:', _error);
      }
    }

    return () => {
      // Cleanup if needed
    };
  }, [slotId, slot]);

  // Don't render anything if AdSense is disabled
  if (!ADSENSE_ENABLED || !PUBLISHER_ID || !slotId) {
    return null;
  }

  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          ...style,
        }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}

// Predefined ad components for common placements
export function BlogAd({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <AdSense slot="blog" format="auto" responsive className={className} style={style} />;
}

export function DashboardAd({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <AdSense slot="dashboard" format="rectangle" responsive className={className} style={style} />
  );
}

export function AssessmentAd({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <AdSense slot="assessment" format="auto" responsive className={className} style={style} />;
}

// Extend Window interface for adsbygoogle
declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}
