# Mobile Responsiveness Guide

## Overview

Comprehensive mobile responsiveness fixes for the AIborg Learn Sphere platform, ensuring optimal
user experience across all devices.

## Implemented Fixes

### 1. Global Mobile Improvements

#### Typography

- **Responsive Headings**: Auto-scaling text sizes for mobile
- **Touch-Friendly**: Minimum 44px touch targets (iOS guidelines)
- **Readable Text**: 16px minimum font size to prevent iOS zoom

#### Layout

- **No Horizontal Scroll**: Overflow-x hidden on body
- **Safe Area Support**: Notch and dynamic island compatibility
- **Flexible Containers**: Responsive padding and margins

### 2. Navigation Fixes

#### Mobile Menu

- **Hamburger Menu**: Collapsible navigation on mobile
- **Touch Targets**: Larger tap areas for better usability
- **Scroll Support**: Vertical scrolling for long menus
- **Backdrop**: Proper overlay and close functionality

#### Search

- **Icon-Only Mode**: Compact search button on mobile
- **Full-Width Dialog**: Search modal fills screen
- **16px Input**: Prevents iOS auto-zoom on input focus

### 3. Dashboard Mobile Optimization

#### Stats Grid

- **2-Column Layout**: Stats in 2 columns on mobile (vs 4 on desktop)
- **Scrollable Tabs**: Horizontal scroll for tab navigation
- **Stacked Cards**: Course progress cards stack vertically

#### Calendar Widget

- **Compact View**: Scaled calendar for small screens
- **Touch Events**: Larger date selection targets
- **Scrollable Events**: Vertical scroll for event lists

### 4. Content Display

#### Tables

- **Card View**: Tables convert to card layout on mobile
- **Data Labels**: Each field shows its label
- **Horizontal Scroll**: When card view not suitable

#### PDF Viewer

- **Reduced Height**: 60vh on mobile (vs 800px desktop)
- **Stacked Controls**: PDF controls wrap on small screens
- **Smaller Thumbnails**: 60px thumbnails on mobile

#### Video Player

- **16:9 Aspect Ratio**: Maintains ratio on all screens
- **Compact Controls**: Smaller control bar
- **Full-Screen Ready**: Native full-screen support

### 5. Forms and Input

#### Input Fields

- **16px Font Size**: Prevents iOS zoom
- **Full Width**: Inputs expand to container
- **Touch-Friendly**: Larger checkboxes and radio buttons (24px)

#### Dialogs/Modals

- **95vw Width**: Nearly full-screen on mobile
- **Scrollable Content**: Max 85vh with overflow scroll
- **Touch Dismiss**: Swipe-friendly close gestures

### 6. Component-Specific Fixes

#### Profile Tabs

```tsx
// Before
<TabsList className="grid grid-cols-3">

// After
<TabsList className="grid grid-cols-3 overflow-x-auto">
```

#### Dashboard Stats

```css
@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
```

#### Calendar

```css
@media (max-width: 768px) {
  .calendar-container {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
}
```

## Breakpoints

### Tailwind Defaults

```css
sm: 640px   /* Small devices (phones) */
md: 768px   /* Medium devices (tablets) */
lg: 1024px  /* Large devices (laptops) */
xl: 1280px  /* Extra large (desktops) */
2xl: 1536px /* 2X Extra large (large desktops) */
```

### Custom Media Queries

```css
/* Small mobile */
@media (max-width: 375px) /* Mobile */ @media (max-width: 640px) /* Tablet */ @media (min-width: 641px) and (max-width: 1024px) /* Landscape mobile */ @media (max-width: 896px) and (orientation: landscape) /* Touch devices */ @media (hover: none) and (pointer: coarse);
```

## Utility Classes

### Mobile-Specific Classes

```css
.hide-mobile          /* Display none on mobile */
.full-width-mobile    /* 100% width on mobile */
.no-padding-mobile    /* Remove padding on mobile */
.stack-mobile         /* Flex column on mobile */
```

### Safe Area Classes

```css
.safe-area-top        /* Respects notch/dynamic island */
.safe-area-bottom     /* Respects home indicator */
.safe-area-left       /* Respects edge-to-edge */
.safe-area-right      /* Respects edge-to-edge */
```

## Testing Guidelines

### Device Testing

1. **iPhone SE (375px)** - Smallest modern iPhone
2. **iPhone 12/13/14 (390px)** - Standard iPhone
3. **iPhone Pro Max (428px)** - Large iPhone
4. **iPad Mini (768px)** - Small tablet
5. **iPad Pro (1024px)** - Large tablet
6. **Android (various)** - Samsung, Pixel, OnePlus

### Browser Dev Tools

```bash
# Chrome DevTools
1. Open DevTools (F12)
2. Click Device Toolbar (Ctrl+Shift+M)
3. Select device presets or custom dimensions
4. Test touch events toggle

# Firefox Responsive Design Mode
1. Open DevTools (F12)
2. Click Responsive Design Mode (Ctrl+Shift+M)
3. Select device or set custom size
```

### Real Device Testing

```bash
# Local network testing
1. Get local IP: `ipconfig` or `ifconfig`
2. Run dev server: `npm run dev`
3. Access on mobile: `http://192.168.x.x:8080`

# Using ngrok for remote testing
npx ngrok http 8080
```

## Common Mobile Issues Fixed

### ✅ Horizontal Scrolling

```css
/* Fixed with */
body {
  overflow-x: hidden;
}
```

### ✅ iOS Input Zoom

```css
/* Fixed with */
input,
textarea,
select {
  font-size: 16px !important;
}
```

### ✅ Small Touch Targets

```css
/* Fixed with */
button,
a {
  min-height: 44px;
  min-width: 44px;
}
```

### ✅ Grid Overflow

```css
/* Fixed with responsive grids */
.grid {
  grid-template-columns: 1fr;
}
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### ✅ Fixed Height Containers

```css
/* Changed from fixed to responsive */
.container {
  height: auto;
  min-height: 400px;
}
```

## Performance Optimizations

### Images

```tsx
// Responsive images
<img
  src="/image.jpg"
  srcSet="/image-mobile.jpg 640w, /image-tablet.jpg 1024w, /image-desktop.jpg 1920w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  loading="lazy"
/>
```

### Fonts

```css
/* Variable fonts for better mobile performance */
@font-face {
  font-family: 'Inter';
  font-display: swap; /* Faster text rendering */
}
```

### Touch Scrolling

```css
/* Smooth touch scrolling */
.scrollable {
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
}
```

## Accessibility on Mobile

### Screen Reader Support

```tsx
// Hidden text for screen readers
<span className="sr-only">Menu button</span>
```

### Focus Management

```css
/* Visible focus for keyboard users */
button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

### Color Contrast

```css
/* Ensure WCAG AA compliance */
--text-primary: hsl(0 0% 10%); /* 15:1 contrast */
--text-secondary: hsl(0 0% 40%); /* 7:1 contrast */
```

## Best Practices

### 1. Mobile-First Approach

```css
/* Start with mobile, enhance for desktop */
.component {
  /* Mobile styles */
  padding: 1rem;
}

@media (min-width: 768px) {
  .component {
    /* Desktop enhancements */
    padding: 2rem;
  }
}
```

### 2. Touch-Friendly Spacing

```css
/* Minimum 8px spacing between interactive elements */
.button-group {
  gap: 0.5rem; /* 8px */
}
```

### 3. Flexible Layouts

```tsx
// Use flex/grid for responsive layouts
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">Content</div>
  <div className="flex-1">Sidebar</div>
</div>
```

### 4. Progressive Enhancement

```tsx
// Mobile base → enhance for desktop
const isMobile = window.innerWidth < 768;

if (!isMobile) {
  // Add desktop-only features
  enableHoverEffects();
}
```

## Known Issues & Workarounds

### iOS Safari Viewport Height

```css
/* Use dvh instead of vh for iOS */
.fullscreen {
  height: 100dvh; /* Dynamic viewport height */
}
```

### Android Chrome Address Bar

```javascript
// Account for collapsing address bar
const getViewportHeight = () => {
  return window.visualViewport?.height || window.innerHeight;
};
```

### Touch vs Mouse Events

```typescript
// Handle both touch and mouse
const handleInteraction = (e: TouchEvent | MouseEvent) => {
  const point = 'touches' in e ? e.touches[0] : e;
  // Use point.clientX, point.clientY
};
```

## Testing Checklist

- [ ] All text is readable (minimum 14px)
- [ ] Touch targets are at least 44x44px
- [ ] No horizontal scrolling
- [ ] Forms work without zoom
- [ ] Navigation is accessible
- [ ] Images load properly
- [ ] Videos play correctly
- [ ] Modals/dialogs fit screen
- [ ] Tables are readable
- [ ] Charts/graphs are visible
- [ ] Safe area respected (notched devices)
- [ ] Landscape mode works
- [ ] Offline mode (if applicable)

## Files Modified

### Core Styles

- `src/index.css` - Added mobile fixes import
- `src/styles/mobile-fixes.css` - Comprehensive mobile CSS

### Components

- `src/pages/Profile.tsx` - Scrollable tabs
- `src/components/Navbar.tsx` - Mobile menu
- `src/components/GlobalSearch.tsx` - Mobile search
- `src/components/calendar/CalendarView.tsx` - Responsive calendar
- `src/pages/DashboardRefactored.tsx` - Mobile dashboard

## Resources

- [MDN Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Apple HIG - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/inputs)
- [Material Design - Touch Targets](https://m3.material.io/foundations/interaction/touch-targets)
- [WCAG Mobile Accessibility](https://www.w3.org/WAI/standards-guidelines/mobile/)

## Support

For mobile-specific issues:

1. Check browser console for errors
2. Test in device mode (DevTools)
3. Verify with real devices when possible
4. Check this documentation for common fixes
