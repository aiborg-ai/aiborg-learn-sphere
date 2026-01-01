/**
 * TrustIndicators Component
 * Displays trust badges at the bottom of the enrollment page
 */

import { CheckCircle2 } from '@/components/ui/icons';

export function TrustIndicators() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        <span>Secure Checkout</span>
      </div>
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        <span>30-Day Guarantee</span>
      </div>
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        <span>Cancel Anytime</span>
      </div>
    </div>
  );
}
