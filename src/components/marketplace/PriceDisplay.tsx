/**
 * Price Display Component
 * Shows course price with formatting, discounts, and price type badges
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PriceType } from '@/types/marketplace';
import { PRICE_TYPE_LABELS } from '@/types/marketplace';

interface PriceDisplayProps {
  priceType: PriceType;
  amount?: number | null;
  currency?: string;
  originalPrice?: number | null;
  compact?: boolean;
  showBadge?: boolean;
  className?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
  INR: '\u20B9',
  CNY: '\u00A5',
  JPY: '\u00A5',
};

const PRICE_TYPE_COLORS: Record<PriceType, string> = {
  free: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  freemium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  paid: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  subscription: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

export function PriceDisplay({
  priceType,
  amount,
  currency = 'USD',
  originalPrice,
  compact = false,
  showBadge = true,
  className,
}: PriceDisplayProps) {
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;
  const hasDiscount = originalPrice && amount && originalPrice > amount;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - amount) / originalPrice) * 100)
    : 0;

  // Free course
  if (priceType === 'free') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-lg font-bold text-green-600 dark:text-green-400">Free</span>
        {showBadge && (
          <Badge variant="secondary" className={PRICE_TYPE_COLORS.free}>
            {PRICE_TYPE_LABELS.free}
          </Badge>
        )}
      </div>
    );
  }

  // Freemium course
  if (priceType === 'freemium') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">Free to start</span>
        {showBadge && (
          <Badge variant="secondary" className={PRICE_TYPE_COLORS.freemium}>
            {PRICE_TYPE_LABELS.freemium}
          </Badge>
        )}
      </div>
    );
  }

  // Subscription course
  if (priceType === 'subscription') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {amount ? (
          <span className="text-lg font-bold">
            {currencySymbol}
            {amount.toFixed(2)}
            <span className="text-sm font-normal text-muted-foreground">/mo</span>
          </span>
        ) : (
          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
            Subscription
          </span>
        )}
        {showBadge && (
          <Badge variant="secondary" className={PRICE_TYPE_COLORS.subscription}>
            {PRICE_TYPE_LABELS.subscription}
          </Badge>
        )}
      </div>
    );
  }

  // Paid course
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="flex items-baseline gap-2">
        {/* Current price */}
        <span className="text-lg font-bold">
          {currencySymbol}
          {amount?.toFixed(2) || '0.00'}
        </span>

        {/* Original price (strikethrough) */}
        {hasDiscount && !compact && (
          <span className="text-sm text-muted-foreground line-through">
            {currencySymbol}
            {originalPrice.toFixed(2)}
          </span>
        )}
      </div>

      {/* Discount badge */}
      {hasDiscount && (
        <Badge variant="destructive" className="text-xs">
          -{discountPercent}%
        </Badge>
      )}

      {/* Price type badge */}
      {showBadge && !compact && (
        <Badge variant="secondary" className={PRICE_TYPE_COLORS.paid}>
          {PRICE_TYPE_LABELS.paid}
        </Badge>
      )}
    </div>
  );
}

/**
 * Compact price for cards
 */
interface CompactPriceProps {
  priceType: PriceType;
  amount?: number | null;
  currency?: string;
  className?: string;
}

export function CompactPrice({
  priceType,
  amount,
  currency = 'USD',
  className,
}: CompactPriceProps) {
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  if (priceType === 'free') {
    return (
      <span className={cn('font-semibold text-green-600 dark:text-green-400', className)}>
        Free
      </span>
    );
  }

  if (priceType === 'freemium') {
    return (
      <span className={cn('font-semibold text-blue-600 dark:text-blue-400', className)}>Free+</span>
    );
  }

  if (priceType === 'subscription') {
    return (
      <span className={cn('font-semibold', className)}>
        {amount ? `${currencySymbol}${amount}/mo` : 'Sub'}
      </span>
    );
  }

  return (
    <span className={cn('font-semibold', className)}>
      {currencySymbol}
      {amount?.toFixed(0) || '0'}
    </span>
  );
}

/**
 * Price type badge only
 */
interface PriceTypeBadgeProps {
  priceType: PriceType;
  className?: string;
}

export function PriceTypeBadge({ priceType, className }: PriceTypeBadgeProps) {
  return (
    <Badge variant="secondary" className={cn(PRICE_TYPE_COLORS[priceType], className)}>
      {PRICE_TYPE_LABELS[priceType]}
    </Badge>
  );
}

export default PriceDisplay;
