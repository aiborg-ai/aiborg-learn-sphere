/**
 * CoursePricingStep Component
 * Step 5: Pricing information and payment options
 */

import React from 'react';
import { DollarSign } from '@/components/ui/icons';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PricingInput } from '@/components/studio/shared/PricingInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StepComponentProps, CourseWizardData } from '@/types/studio.types';

export function CoursePricingStep({ data, onUpdate }: StepComponentProps<CourseWizardData>) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <DollarSign className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Pricing</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Set the price and payment options for your course
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Transparent pricing helps students make informed decisions. You can offer discounts to
          encourage early enrollment.
        </AlertDescription>
      </Alert>

      {/* Pricing Input Component */}
      <PricingInput
        price={data.price}
        earlyBirdPrice={data.early_bird_price}
        groupDiscount={data.group_discount}
        paymentOptions={data.payment_options}
        onPriceChange={price => onUpdate({ price })}
        onEarlyBirdPriceChange={early_bird_price => onUpdate({ early_bird_price })}
        onGroupDiscountChange={group_discount => onUpdate({ group_discount })}
        onPaymentOptionsChange={payment_options => onUpdate({ payment_options })}
        required
      />

      {/* Currently Enrolling Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="enrolling">Currently Accepting Enrollments</Label>
          <p className="text-sm text-muted-foreground">
            Allow students to enroll in this course right now
          </p>
        </div>
        <Switch
          id="enrolling"
          checked={data.currently_enrolling}
          onCheckedChange={currently_enrolling => onUpdate({ currently_enrolling })}
        />
      </div>
    </div>
  );
}
