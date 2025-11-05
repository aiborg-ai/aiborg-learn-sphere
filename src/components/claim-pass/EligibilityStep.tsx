import { Shield, CheckCircle2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface EligibilityStepProps {
  declarationAccepted: boolean;
  termsAccepted: boolean;
  onDeclarationChange: (checked: boolean) => void;
  onTermsChange: (checked: boolean) => void;
  onNext: () => void;
}

export const EligibilityStep = ({
  declarationAccepted,
  termsAccepted,
  onDeclarationChange,
  onTermsChange,
  onNext,
}: EligibilityStepProps) => {
  const canProceed = declarationAccepted && termsAccepted;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-500 to-violet-600 text-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-center mb-4">
          <Gift className="w-16 h-16" />
        </div>
        <h2 className="text-3xl font-bold text-center mb-3">Claim Your FREE Family Pass!</h2>
        <p className="text-center text-lg opacity-90">
          As an FHOAI Vault subscriber, you're eligible for a complimentary Family Pass (normally
          £240/year)
        </p>
      </div>

      {/* Benefits Card */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            What You'll Get
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-semibold text-green-900">50+ AI Courses</div>
                <div className="text-sm text-green-700">Worth £2,500+ value</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-semibold text-blue-900">200+ Vault Resources</div>
                <div className="text-sm text-blue-700">Premium templates & guides</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-900">6 Family Members</div>
                <div className="text-sm text-amber-700">Full access for each</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <div className="font-semibold text-purple-900">Priority Events</div>
                <div className="text-sm text-purple-700">Early registration access</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eligibility Requirements */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-xl font-semibold mb-4">Eligibility Requirements</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm text-gray-700">
                Active FHOAI Vault subscription in good standing
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm text-gray-700">
                Subscription must have a valid end date (not expired)
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm text-gray-700">
                No existing pending or approved Family Pass claim
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm text-gray-700">
                Agree to Aiborg Learning Platform terms and conditions
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Declaration Section */}
      <Card className="border-2 border-purple-200 bg-purple-50/50">
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-xl font-semibold mb-4 text-purple-900">Declaration</h3>

          {/* Main Declaration */}
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-purple-200">
            <Checkbox
              id="declaration"
              checked={declarationAccepted}
              onCheckedChange={onDeclarationChange}
              className="mt-1"
            />
            <Label htmlFor="declaration" className="cursor-pointer flex-1">
              <div className="font-semibold mb-1">FHOAI Vault Subscriber Confirmation</div>
              <div className="text-sm text-gray-700">
                I confirm that I have an active FHOAI Vault subscription and understand that my
                Family Pass access will be synced with my vault subscription duration. I acknowledge
                that providing false information may result in immediate revocation of access.
              </div>
            </Label>
          </div>

          {/* Terms Acceptance */}
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-purple-200">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={onTermsChange}
              className="mt-1"
            />
            <Label htmlFor="terms" className="cursor-pointer flex-1">
              <div className="font-semibold mb-1">Terms & Conditions</div>
              <div className="text-sm text-gray-700">
                I agree to the{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  Privacy Policy
                </a>{' '}
                of Aiborg Learning Platform.
              </div>
            </Label>
          </div>

          {!canProceed && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              Please accept both declarations above to proceed with your claim.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button
          size="lg"
          onClick={onNext}
          disabled={!canProceed}
          className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
        >
          Continue to Next Step →
        </Button>
      </div>
    </div>
  );
};
