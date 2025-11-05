import { CheckCircle2, Mail, Clock, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

interface ClaimSuccessModalProps {
  isOpen: boolean;
  claimId?: string;
  onClose: () => void;
}

export const ClaimSuccessModal = ({ isOpen, claimId, onClose }: ClaimSuccessModalProps) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    onClose();
    navigate('/');
  };

  const handleViewDashboard = () => {
    onClose();
    navigate('/dashboard');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Claim Submitted Successfully! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Your FREE Family Pass claim has been submitted and is now under review by our admin
            team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Claim ID */}
          {claimId && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <div className="text-sm font-medium text-purple-900 mb-1">Your Claim ID</div>
              <div className="text-lg font-bold text-purple-600 font-mono">{claimId}</div>
              <div className="text-xs text-purple-700 mt-1">Save this ID for future reference</div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-green-900 text-sm">Confirmation Email Sent</div>
                <div className="text-xs text-green-700">
                  Check your inbox for claim details and next steps
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-blue-900 text-sm">Under Review</div>
                <div className="text-xs text-blue-700">
                  Our admin team will review your claim within 1-2 business days
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
              <Mail className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-amber-900 text-sm">Approval Notification</div>
                <div className="text-xs text-amber-700">
                  You'll receive an email once your claim is approved or if we need more information
                </div>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">What's Next?</h4>
            <ul className="text-xs text-gray-700 space-y-1.5 list-disc list-inside">
              <li>Check your email for the confirmation message</li>
              <li>Our team will verify your FHOAI Vault subscription</li>
              <li>You'll receive another email when your claim is approved</li>
              <li>Your Family Pass will be activated immediately upon approval</li>
              <li>Family members will receive invitation emails (if added)</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button variant="outline" className="flex-1" onClick={handleGoHome}>
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
            onClick={handleViewDashboard}
          >
            View Dashboard
          </Button>
        </div>

        <div className="text-center text-xs text-gray-500 pt-2">
          Need help? Contact us at{' '}
          <a href="mailto:support@aiborg.ai" className="text-purple-600 hover:underline">
            support@aiborg.ai
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};
