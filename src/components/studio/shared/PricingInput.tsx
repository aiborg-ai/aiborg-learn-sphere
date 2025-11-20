/**
 * PricingInput Component
 * Pricing input fields with currency, discounts, and payment options
 */

import React from 'react';
import { DollarSign, Tag, Users, Percent } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PricingInputProps {
  price: string;
  earlyBirdPrice?: string;
  groupDiscount?: string;
  paymentOptions?: string[];
  onPriceChange: (price: string) => void;
  onEarlyBirdPriceChange?: (price: string) => void;
  onGroupDiscountChange?: (discount: string) => void;
  onPaymentOptionsChange?: (options: string[]) => void;
  currency?: string;
  onCurrencyChange?: (currency: string) => void;
  required?: boolean;
  error?: string;
  className?: string;
}

const CURRENCIES = [
  { value: 'USD', symbol: '$', label: 'US Dollar (USD)' },
  { value: 'GBP', symbol: '£', label: 'British Pound (GBP)' },
  { value: 'EUR', symbol: '€', label: 'Euro (EUR)' },
  { value: 'INR', symbol: '₹', label: 'Indian Rupee (INR)' },
  { value: 'AUD', symbol: 'A$', label: 'Australian Dollar (AUD)' },
  { value: 'CAD', symbol: 'C$', label: 'Canadian Dollar (CAD)' },
];

const PAYMENT_OPTIONS = [
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'bank-transfer', label: 'Bank Transfer' },
  { value: 'invoice', label: 'Invoice (for corporate)' },
  { value: 'installments', label: 'Installments' },
];

export function PricingInput({
  price,
  earlyBirdPrice,
  groupDiscount,
  paymentOptions = [],
  onPriceChange,
  onEarlyBirdPriceChange,
  onGroupDiscountChange,
  onPaymentOptionsChange,
  currency = 'GBP',
  onCurrencyChange,
  required,
  error,
  className,
}: PricingInputProps) {
  const selectedCurrency = CURRENCIES.find(c => c.value === currency);

  // Toggle payment option
  const togglePaymentOption = (option: string) => {
    const isSelected = paymentOptions.includes(option);
    if (isSelected) {
      onPaymentOptionsChange?.(paymentOptions.filter(o => o !== option));
    } else {
      onPaymentOptionsChange?.([...paymentOptions, option]);
    }
  };

  // Calculate savings
  const calculateSavings = () => {
    const mainPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    const discountPrice = parseFloat(earlyBirdPrice?.replace(/[^0-9.]/g, '') || '0');

    if (mainPrice && discountPrice && mainPrice > discountPrice) {
      const savings = mainPrice - discountPrice;
      const percentage = ((savings / mainPrice) * 100).toFixed(0);
      return {
        amount: savings.toFixed(2),
        percentage,
      };
    }
    return null;
  };

  const savings = calculateSavings();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Price */}
      <div className="space-y-2">
        <Label htmlFor="price">
          Price
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="flex gap-2">
          {/* Currency Selector */}
          {onCurrencyChange && (
            <Select value={currency} onValueChange={onCurrencyChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(curr => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.symbol} {curr.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Price Input */}
          <div className="relative flex-1">
            <div className="absolute left-3 top-2.5 text-muted-foreground">
              {selectedCurrency?.symbol}
            </div>
            <Input
              id="price"
              type="text"
              value={price}
              onChange={e => onPriceChange(e.target.value)}
              placeholder="0.00"
              className={cn('pl-8', error && 'border-destructive')}
              required={required}
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">Enter the regular price for this offering</p>
      </div>

      {/* Optional: Early Bird Price */}
      {onEarlyBirdPriceChange && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Early Bird Discount (Optional)
            </CardTitle>
            <CardDescription>Offer a discounted price for early registrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-muted-foreground">
                {selectedCurrency?.symbol}
              </div>
              <Input
                type="text"
                value={earlyBirdPrice || ''}
                onChange={e => onEarlyBirdPriceChange(e.target.value)}
                placeholder="0.00"
                className="pl-8"
              />
            </div>

            {savings && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Percent className="w-3 h-3 mr-1" />
                  Save {selectedCurrency?.symbol}
                  {savings.amount} ({savings.percentage}% off)
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Optional: Group Discount */}
      {onGroupDiscountChange && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Group Discount (Optional)
            </CardTitle>
            <CardDescription>Offer a discount for group enrollments</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              value={groupDiscount || ''}
              onChange={e => onGroupDiscountChange(e.target.value)}
              placeholder="e.g., 10% off for 5+ participants"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Describe your group discount offer (e.g., percentage, minimum size)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Options */}
      {onPaymentOptionsChange && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Payment Options
            </CardTitle>
            <CardDescription>Select available payment methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {PAYMENT_OPTIONS.map(option => {
              const isSelected = paymentOptions.includes(option.value);
              return (
                <div key={option.value} className="flex items-center gap-3">
                  <Checkbox
                    id={option.value}
                    checked={isSelected}
                    onCheckedChange={() => togglePaymentOption(option.value)}
                  />
                  <Label htmlFor={option.value} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              );
            })}

            {paymentOptions.length === 0 && (
              <p className="text-sm text-muted-foreground">No payment options selected</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pricing Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Regular Price:</span>
              <span className="text-lg font-bold">
                {selectedCurrency?.symbol}
                {price || '0.00'}
              </span>
            </div>

            {earlyBirdPrice && parseFloat(earlyBirdPrice) > 0 && (
              <div className="flex justify-between items-center text-green-700">
                <span className="text-sm">Early Bird Price:</span>
                <span className="font-semibold">
                  {selectedCurrency?.symbol}
                  {earlyBirdPrice}
                </span>
              </div>
            )}

            {groupDiscount && (
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Group Discount:</span>
                <span>{groupDiscount}</span>
              </div>
            )}

            {paymentOptions.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">Payment methods:</p>
                <div className="flex flex-wrap gap-1">
                  {paymentOptions.map(opt => {
                    const option = PAYMENT_OPTIONS.find(o => o.value === opt);
                    return (
                      <Badge key={opt} variant="outline" className="text-xs">
                        {option?.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
