import { CheckCircle2, Edit, Mail, Users, Calendar, Send } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ClaimFormData } from '@/types';
import { format } from 'date-fns';

interface ReviewStepProps {
  formData: ClaimFormData;
  onBack: () => void;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const ReviewStep = ({
  formData,
  onBack,
  onEdit,
  onSubmit,
  isSubmitting,
}: ReviewStepProps) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Review Your Claim</h2>
        <p className="text-gray-600">
          Please review all information before submitting your FREE Family Pass claim
        </p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-600" />
            Personal Information
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-sm font-medium text-gray-500">Name:</div>
            <div className="col-span-2 text-sm font-semibold">{formData.userName}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-sm font-medium text-gray-500">Email:</div>
            <div className="col-span-2 text-sm">{formData.userEmail}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-sm font-medium text-gray-500">Vault Email:</div>
            <div className="col-span-2 text-sm">{formData.vaultEmail}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-sm font-medium text-gray-500">Vault Valid Until:</div>
            <div className="col-span-2 text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              {format(formData.vaultSubscriptionEndDate, 'PPP')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Family Members ({formData.familyMembers.length}/6)
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(3)}>
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          {formData.familyMembers.length > 0 ? (
            <div className="space-y-3">
              {formData.familyMembers.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{member.name}</div>
                    <div className="text-xs text-gray-600">{member.email}</div>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {member.relationship}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No family members added</p>
              <p className="text-xs">You can add them later from your dashboard</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Declaration Summary */}
      <Card className="border-2 border-green-200 bg-green-50/50">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-green-900">FHOAI Vault Subscriber Declaration</div>
              <div className="text-green-700">
                Confirmed active vault subscription with valid end date
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-green-900">Terms & Conditions</div>
              <div className="text-green-700">Accepted Aiborg Learning Platform terms</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Happens Next */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-lg">What Happens Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                1
              </div>
              <div className="flex-1 text-sm">
                <div className="font-semibold">Claim Submission</div>
                <div className="text-gray-600">Your claim will be submitted for admin review</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                2
              </div>
              <div className="flex-1 text-sm">
                <div className="font-semibold">Email Confirmation</div>
                <div className="text-gray-600">
                  You'll receive a confirmation email with your claim ID
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                3
              </div>
              <div className="flex-1 text-sm">
                <div className="font-semibold">Admin Review (1-2 business days)</div>
                <div className="text-gray-600">
                  Our team will verify your vault subscription status
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                4
              </div>
              <div className="flex-1 text-sm">
                <div className="font-semibold">Approval & Activation</div>
                <div className="text-gray-600">
                  Once approved, your Family Pass will be activated immediately
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Important Notice
        </h4>
        <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
          <li>Your Family Pass duration will match your vault subscription end date</li>
          <li>You'll receive email notifications at each stage of the process</li>
          <li>Family members will receive invitation emails after approval</li>
          <li>All information provided will be verified by our admin team</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between gap-4 pt-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack} disabled={isSubmitting}>
          ← Back
        </Button>
        <Button
          onClick={onSubmit}
          size="lg"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Submit Claim
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
