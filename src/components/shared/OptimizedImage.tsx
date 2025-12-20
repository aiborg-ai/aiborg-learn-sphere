/**
 * OptimizedImage Component
 *
 * Provides automatic image optimization with:
 * - Lazy loading via Intersection Observer
 * - WebP format with fallback
 * - Responsive images with srcset
 * - Fade-in animation on load
 * - Blur placeholder while loading
 */

import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  /**
   * Source URL of the image (without extension)
   * Component will automatically add .webp and fallback formats
   */
  src: string;

  /**
   * Alt text for accessibility (required)
   */
  alt: string;

  /**
   * Optional responsive sizes for srcset generation
   * Example: { small: 320, medium: 768, large: 1024 }
   */
  sizes?: Record<string, number>;

  /**
   * Root margin for intersection observer (default: '50px')
   * Loads images slightly before they enter viewport
   */
  rootMargin?: string;

  /**
   * Whether to show a blur placeholder while loading
   */
  showPlaceholder?: boolean;

  /**
   * Custom placeholder image URL
   */
  placeholderSrc?: string;

  /**
   * Priority loading (disables lazy loading for above-fold images)
   */
  priority?: boolean;
}

/**
 * Checks if browser supports WebP format
 */
const supportsWebP = (() => {
  if (typeof window === 'undefined') return false;

  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
})();

/**
 * Generates WebP source with original format fallback
 */
const getImageSrc = (src: string, useWebP: boolean): string => {
  if (!useWebP) return src;

  // If src already has extension, replace it with .webp
  const lastDot = src.lastIndexOf('.');
  if (lastDot > 0) {
    return src.substring(0, lastDot) + '.webp';
  }

  // Otherwise append .webp
  return `${src}.webp`;
};

/**
 * Generates srcset string for responsive images
 */
const generateSrcSet = (
  src: string,
  sizes?: Record<string, number>,
  useWebP?: boolean
): string | undefined => {
  if (!sizes) return undefined;

  const ext = useWebP ? '.webp' : '';
  const baseSrc = src.substring(0, src.lastIndexOf('.')) || src;

  return Object.entries(sizes)
    .map(([name, width]) => `${baseSrc}-${name}${ext} ${width}w`)
    .join(', ');
};

export function OptimizedImage({
  src,
  alt,
  sizes,
  rootMargin = '50px',
  showPlaceholder = true,
  placeholderSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWUiLz48L3N2Zz4=',
  priority = false,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Priority images start visible
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (priority || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, priority]);

  // Determine which image source to use
  const imageSrc = isInView
    ? hasError
      ? src
      : getImageSrc(src, supportsWebP)
    : showPlaceholder
      ? placeholderSrc
      : '';

  const imageSrcSet = isInView && !hasError ? generateSrcSet(src, sizes, supportsWebP) : undefined;

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onLoad/onError handlers are necessary for image loading state and fallback management
    <img
      ref={imgRef}
      src={imageSrc}
      srcSet={imageSrcSet}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setIsLoaded(true)}
      onError={() => {
        setHasError(true);
        setIsLoaded(true);
      }}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        showPlaceholder && !isLoaded && 'blur-sm',
        className
      )}
      {...props}
    />
  );
}

/**
 * Preset component for hero/banner images
 */
export function HeroImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      priority
      sizes={{
        small: 640,
        medium: 1024,
        large: 1920,
      }}
    />
  );
}

/**
 * Preset component for thumbnail images
 */
export function ThumbnailImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      sizes={{
        small: 150,
        medium: 300,
        large: 450,
      }}
    />
  );
}

/**
 * Preset component for card images
 */
export function CardImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      sizes={{
        small: 320,
        medium: 640,
        large: 960,
      }}
    />
  );
}
