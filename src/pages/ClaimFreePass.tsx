import { useState } from 'react';
import { Gift } from '@/components/ui/icons';
import { ClaimProgressIndicator } from '@/components/claim-pass/ClaimProgressIndicator';
import { EligibilityStep } from '@/components/claim-pass/EligibilityStep';
import { UserInfoStep } from '@/components/claim-pass/UserInfoStep';
import { FamilyMembersStep } from '@/components/claim-pass/FamilyMembersStep';
import { ReviewStep } from '@/components/claim-pass/ReviewStep';
import { ClaimSuccessModal } from '@/components/claim-pass/ClaimSuccessModal';
import { useVaultClaim } from '@/hooks/useVaultClaim';
import type { ClaimFormData, FamilyMemberInput } from '@/types';
import { logger } from '@/utils/logger';

const STEPS = [
  { number: 1, title: 'Eligibility', description: 'Confirm your eligibility' },
  { number: 2, title: 'Your Info', description: 'Provide your details' },
  { number: 3, title: 'Family', description: 'Add family members' },
  { number: 4, title: 'Review', description: 'Review and submit' },
];

export default function ClaimFreePass() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedClaimId, setSubmittedClaimId] = useState<string>();

  const { submitClaim, isSubmitting } = useVaultClaim();

  // Form data state
  const [formData, setFormData] = useState<Partial<ClaimFormData>>({
    declarationAccepted: false,
    termsAccepted: false,
    userName: '',
    userEmail: '',
    vaultEmail: '',
    vaultSubscriptionEndDate: undefined,
    familyMembers: [],
  });

  // Step 1 handlers
  const handleStep1Next = () => {
    setCurrentStep(2);
  };

  const handleDeclarationChange = (checked: boolean) => {
    setFormData({ ...formData, declarationAccepted: checked });
  };

  const handleTermsChange = (checked: boolean) => {
    setFormData({ ...formData, termsAccepted: checked });
  };

  // Step 2 handlers
  const handleStep2Next = (data: {
    userName: string;
    userEmail: string;
    vaultEmail: string;
    vaultSubscriptionEndDate: Date;
  }) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(3);
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  // Step 3 handlers
  const handleStep3Next = (members: FamilyMemberInput[]) => {
    setFormData({ ...formData, familyMembers: members });
    setCurrentStep(4);
  };

  const handleStep3Back = () => {
    setCurrentStep(2);
  };

  // Step 4 handlers
  const handleStep4Back = () => {
    setCurrentStep(3);
  };

  const handleEditStep = (step: number) => {
    setCurrentStep(step);
  };

  const handleSubmit = async () => {
    // Validate we have all required data
    if (
      !formData.userName ||
      !formData.userEmail ||
      !formData.vaultEmail ||
      !formData.vaultSubscriptionEndDate ||
      !formData.declarationAccepted ||
      !formData.termsAccepted
    ) {
      return;
    }

    try {
      const result = await submitClaim.mutateAsync(formData as ClaimFormData);

      if (result.success && result.claimId) {
        setSubmittedClaimId(result.claimId);
        setShowSuccessModal(true);
      }
    } catch {
      // Error is handled in the hook with toast
      logger.error('Claim submission error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                Claim FREE Family Pass
              </h1>
              <p className="text-sm text-gray-600">Exclusive offer for FHOAI Vault subscribers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="max-w-6xl mx-auto px-4">
        <ClaimProgressIndicator currentStep={currentStep} steps={STEPS} />
      </div>

      {/* Step Content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {currentStep === 1 && (
          <EligibilityStep
            declarationAccepted={formData.declarationAccepted || false}
            termsAccepted={formData.termsAccepted || false}
            onDeclarationChange={handleDeclarationChange}
            onTermsChange={handleTermsChange}
            onNext={handleStep1Next}
          />
        )}

        {currentStep === 2 && (
          <UserInfoStep
            initialData={{
              userName: formData.userName,
              userEmail: formData.userEmail,
              vaultEmail: formData.vaultEmail,
              vaultSubscriptionEndDate: formData.vaultSubscriptionEndDate,
            }}
            onNext={handleStep2Next}
            onBack={handleStep2Back}
          />
        )}

        {currentStep === 3 && (
          <FamilyMembersStep
            initialData={formData.familyMembers || []}
            onNext={handleStep3Next}
            onBack={handleStep3Back}
          />
        )}

        {currentStep === 4 && (
          <ReviewStep
            formData={formData as ClaimFormData}
            onBack={handleStep4Back}
            onEdit={handleEditStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {/* Success Modal */}
      <ClaimSuccessModal
        isOpen={showSuccessModal}
        claimId={submittedClaimId}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
