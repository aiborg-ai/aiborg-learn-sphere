# Google AdSense Integration

This document describes the Google AdSense integration in the AiBorg Learn Sphere platform.

## Overview

The application supports Google AdSense ads in three strategic locations:

- **Blog Posts**: Display ads after article content
- **Dashboard**: Show ads in the user dashboard overview
- **Assessment Results**: Display ads on assessment results pages

All ads are controlled by feature flags and can be easily enabled/disabled without code changes.

## Setup Instructions

### 1. Create Google AdSense Account

1. Visit [Google AdSense](https://www.google.com/adsense/)
2. Sign up for an AdSense account
3. Add your website domain for verification
4. Wait for approval (typically 1-3 days)

**Prerequisites for Approval**:

- ✅ Privacy Policy page (already implemented at `/privacy`)
- ✅ Terms of Service page (already implemented at `/terms`)
- Quality content and traffic
- Compliance with AdSense policies

### 2. Create Ad Units

After approval, create ad units in your AdSense dashboard:

1. **Blog Ad Unit**
   - Type: Display ad
   - Format: Responsive (auto)
   - Name: "Blog Post Ad"
   - Copy the Ad Slot ID (e.g., `1234567890`)

2. **Dashboard Ad Unit**
   - Type: Display ad
   - Format: Rectangle (300x250 or larger)
   - Name: "Dashboard Ad"
   - Copy the Ad Slot ID

3. **Assessment Results Ad Unit**
   - Type: Display ad
   - Format: Responsive (auto)
   - Name: "Assessment Results Ad"
   - Copy the Ad Slot ID

### 3. Configure Environment Variables

Add the following variables to your `.env.local` file:

```bash
# Google AdSense Configuration
VITE_ENABLE_ADSENSE=true
VITE_ADSENSE_PUBLISHER_ID=ca-pub-YOUR-PUBLISHER-ID
VITE_ADSENSE_BLOG_SLOT=1234567890
VITE_ADSENSE_DASHBOARD_SLOT=0987654321
VITE_ADSENSE_ASSESSMENT_SLOT=5678901234
```

**Where to find these values**:

- `VITE_ADSENSE_PUBLISHER_ID`: AdSense Dashboard → Account → Account Information
- Ad Slot IDs: AdSense Dashboard → Ads → By ad unit → Click on ad unit

### 4. Deploy to Production

**For Vercel**:

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add all AdSense variables:
   - `VITE_ENABLE_ADSENSE` = `true`
   - `VITE_ADSENSE_PUBLISHER_ID` = `ca-pub-YOUR-PUBLISHER-ID`
   - `VITE_ADSENSE_BLOG_SLOT` = Your blog slot ID
   - `VITE_ADSENSE_DASHBOARD_SLOT` = Your dashboard slot ID
   - `VITE_ADSENSE_ASSESSMENT_SLOT` = Your assessment slot ID
4. Redeploy the application

## Architecture

### Component Structure

```
src/components/ads/
└── AdSense.tsx           # Main AdSense component with pre-configured variants
```

### Component API

#### Base Component: `AdSense`

```typescript
interface AdSenseProps {
  slot: 'blog' | 'dashboard' | 'assessment' | 'custom';
  adSlot?: string; // Required for 'custom' slot
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: boolean; // Default: true
  style?: React.CSSProperties;
  className?: string;
}
```

#### Pre-configured Components

```typescript
// Blog ad - Auto format, responsive
<BlogAd className="max-w-3xl mx-auto" />

// Dashboard ad - Rectangle format, responsive
<DashboardAd />

// Assessment results ad - Auto format, responsive
<AssessmentAd className="max-w-4xl mx-auto" />
```

### Ad Placements

| Location           | Component          | File                                  | Line    |
| ------------------ | ------------------ | ------------------------------------- | ------- |
| Blog Posts         | `<BlogAd />`       | `src/pages/Blog/BlogPost.tsx`         | 336-339 |
| Dashboard          | `<DashboardAd />`  | `src/pages/DashboardRefactored.tsx`   | 505-508 |
| Assessment Results | `<AssessmentAd />` | `src/pages/AssessmentResultsPage.tsx` | 291-294 |

### How It Works

1. **Feature Flag Check**: Component checks `VITE_ENABLE_ADSENSE` environment variable
2. **Configuration Validation**: Verifies `PUBLISHER_ID` and slot IDs are set
3. **Script Loading**: Dynamically loads Google AdSense script on first render
4. **Ad Rendering**: Renders `<ins>` element with proper data attributes
5. **Ad Initialization**: Pushes ad to `window.adsbygoogle` queue for display

**Key Implementation Details**:

- Ads only render when `VITE_ENABLE_ADSENSE=true`
- Script loads asynchronously to avoid blocking page load
- Uses `useRef` to prevent duplicate ad pushes
- Implements proper cleanup on component unmount

## Enabling/Disabling Ads

### Local Development

**Disable ads** (recommended for development):

```bash
# .env.local
VITE_ENABLE_ADSENSE=false
```

**Enable ads** (for testing):

```bash
# .env.local
VITE_ENABLE_ADSENSE=true
VITE_ADSENSE_PUBLISHER_ID=ca-pub-YOUR-PUBLISHER-ID
# ... other ad slot IDs
```

### Production

**Via Vercel Dashboard**:

1. Go to Project Settings → Environment Variables
2. Toggle `VITE_ENABLE_ADSENSE` between `true` and `false`
3. Redeploy the application

**Emergency Disable** (without redeployment): If you need to disable ads immediately:

1. Create a new environment variable: `VITE_ENABLE_ADSENSE=false`
2. Click "Redeploy" on the latest deployment

## Best Practices

### 1. User Experience

- ✅ **Do**: Place ads at natural content breaks (after articles, between sections)
- ❌ **Don't**: Place too many ads on a single page (max 3 per page)
- ✅ **Do**: Use responsive ad units for better mobile experience
- ❌ **Don't**: Place ads that interfere with navigation or primary content

### 2. Performance

- Script loads asynchronously to avoid blocking page render
- Ads render only when feature flag is enabled
- Uses lazy loading for ad script
- Implements proper error handling

### 3. Compliance

- ✅ Privacy Policy page implemented (`/privacy`)
- ✅ Terms of Service page implemented (`/terms`)
- Follow Google AdSense policies
- Avoid placing ads on pages with restricted content

### 4. Testing

**Before going live**:

1. Test with AdSense test mode (use test publisher ID)
2. Verify ads display correctly on all placements
3. Check mobile responsiveness
4. Confirm no layout shifts (CLS)
5. Test with ad blockers enabled (graceful degradation)

## Troubleshooting

### Ads not showing

**Check**:

1. ✅ `VITE_ENABLE_ADSENSE=true` in environment variables
2. ✅ Publisher ID is correct (format: `ca-pub-XXXXXXXXXXXXXXXX`)
3. ✅ Ad slot IDs are correct
4. ✅ AdSense account is approved
5. ✅ No ad blocker is active
6. ✅ Browser console for errors

**Common Issues**:

- **"AdSense: No slot ID configured"**: Missing ad slot in environment variables
- **Ads showing blank space**: AdSense still reviewing site or no ads available
- **Script not loading**: Check network tab for blocked requests

### AdSense Policy Violations

If you receive a policy violation notice:

1. Read the violation email carefully
2. Fix the issue on your site
3. Request a review in AdSense dashboard
4. Disable ads temporarily: `VITE_ENABLE_ADSENSE=false`

## Revenue Optimization

### 1. Ad Placement Strategy

**High-performing locations** (already implemented):

- ✅ After blog post content (high engagement point)
- ✅ Dashboard overview (regular user visits)
- ✅ Assessment results (high user attention)

**Future considerations**:

- Sidebar ads on blog listing page
- Footer ads on course pages
- In-feed ads in blog feed

### 2. Ad Formats

- **Responsive ads**: Best for all screen sizes (currently used)
- **Rectangle (300x250)**: High fill rate, used on dashboard
- **Large rectangle (336x280)**: Higher RPM potential
- **Leaderboard (728x90)**: Good for header/footer

### 3. Monitoring Performance

**Key metrics to track in AdSense**:

- Page RPM (Revenue per 1000 impressions)
- CTR (Click-through rate)
- CPC (Cost per click)
- Fill rate

**Recommended actions**:

- Review metrics weekly
- A/B test ad placements
- Adjust ad formats based on performance
- Remove low-performing ad units

## Custom Ad Placements

To add ads to other locations:

```typescript
import { AdSense } from '@/components/ads/AdSense';

// Custom placement with custom slot
<AdSense
  slot="custom"
  adSlot="YOUR_CUSTOM_SLOT_ID"
  format="auto"
  responsive={true}
  className="my-8"
/>
```

## Future Enhancements

Potential improvements:

1. **A/B Testing**: Test different ad positions and formats
2. **Ad Refresh**: Auto-refresh ads after user interaction
3. **Lazy Loading**: Load ads only when they enter viewport
4. **Analytics Integration**: Track ad performance with Google Analytics
5. **Ad Density Control**: Limit ads based on content length
6. **Personalization**: Show different ads based on user preferences

## Support

For issues or questions:

- Google AdSense Help: https://support.google.com/adsense
- AdSense Policy: https://support.google.com/adsense/answer/48182
- Internal Documentation: See `docs/FEATURE_FLAGS.md`

## References

- [Google AdSense Documentation](https://developers.google.com/adsense/management)
- [AdSense Ad Code Implementation](https://support.google.com/adsense/answer/181950)
- [AdSense Policy Center](https://www.google.com/adsense/new/localized-terms)
- [React Integration Best Practices](https://developers.google.com/adsense/management/spa)
