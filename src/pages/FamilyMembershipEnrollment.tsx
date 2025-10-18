/**
 * Family Membership Enrollment Flow
 *
 * 4-step checkout process for Family Pass subscription
 * Steps:
 * 1. Plan Confirmation
 * 2. Account Information
 * 3. Add Family Members (optional)
 * 4. Payment / Free Trial
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckCircle2,
  Users,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Plus,
  X,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePlanBySlug, useCreateSubscription } from '@/hooks/useMembership';
import { CompactROICalculator } from '@/components/membership';

// Form validation schemas
const accountInfoSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  country: z.string().min(2, 'Please select a country'),
});

const familyMemberSchema = z.object({
  member_name: z.string().min(2, 'Name required'),
  member_email: z.string().email('Invalid email'),
  member_age: z.number().min(5).max(120),
  relationship: z.string(),
});

type AccountInfo = z.infer<typeof accountInfoSchema>;
type FamilyMemberInput = z.infer<typeof familyMemberSchema>;

interface EnrollmentData {
  accountInfo?: AccountInfo;
  familyMembers: FamilyMemberInput[];
  startTrial: boolean;
}

export default function FamilyMembershipEnrollment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: familyPlan, isLoading: planLoading } = usePlanBySlug('family-pass');
  const createSubscription = useCreateSubscription();

  const [currentStep, setCurrentStep] = useState(1);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>({
    familyMembers: [],
    startTrial: true,
  });

  const steps = [
    { number: 1, title: 'Plan', icon: CheckCircle2 },
    { number: 2, title: 'Account', icon: Users },
    { number: 3, title: 'Family', icon: Users },
    { number: 4, title: 'Payment', icon: CreditCard },
  ];

  if (planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, i) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full ${
                    currentStep >= step.number
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  } transition-all duration-300`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <span className="font-bold">{step.number}</span>
                  )}
                </div>
                <div className="ml-2 hidden sm:block">
                  <p
                    className={`text-sm font-medium ${
                      currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-8 sm:w-16 h-1 mx-2 ${
                      currentStep > step.number ? 'bg-amber-500' : 'bg-gray-200'
                    } transition-all duration-300`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-6 sm:p-8 bg-white/95 backdrop-blur-sm">
          {currentStep === 1 && (
            <Step1PlanConfirmation
              plan={familyPlan}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <Step2AccountInfo
              initialData={enrollmentData.accountInfo}
              onNext={(data) => {
                setEnrollmentData({ ...enrollmentData, accountInfo: data });
                setCurrentStep(3);
              }}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <Step3FamilyMembers
              initialMembers={enrollmentData.familyMembers}
              maxMembers={familyPlan?.max_family_members || 6}
              onNext={(members) => {
                setEnrollmentData({ ...enrollmentData, familyMembers: members });
                setCurrentStep(4);
              }}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <Step4Payment
              plan={familyPlan}
              accountInfo={enrollmentData.accountInfo!}
              familyMembers={enrollmentData.familyMembers}
              startTrial={enrollmentData.startTrial}
              onStartTrial={() => {
                setEnrollmentData({ ...enrollmentData, startTrial: true });
              }}
              onSubscribe={(startTrial) => {
                if (!enrollmentData.accountInfo) {
                  toast({
                    title: 'Missing Information',
                    description: 'Please complete the account information step.',
                    variant: 'destructive',
                  });
                  setCurrentStep(2);
                  return;
                }

                createSubscription.mutate({
                  planSlug: 'family-pass',
                  customerEmail: enrollmentData.accountInfo.customerEmail,
                  customerName: enrollmentData.accountInfo.customerName,
                  startTrial,
                  metadata: {
                    phone: enrollmentData.accountInfo.phone || '',
                    country: enrollmentData.accountInfo.country,
                    family_members_count: enrollmentData.familyMembers.length.toString(),
                  },
                });
              }}
              onBack={() => setCurrentStep(3)}
              isLoading={createSubscription.isPending}
            />
          )}
        </Card>

        {/* Trust Indicators */}
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
      </div>
    </div>
  );
}

// ============================================================================
// STEP 1: PLAN CONFIRMATION
// ============================================================================

function Step1PlanConfirmation({
  plan,
  onNext,
}: {
  plan: any;
  onNext: () => void;
}) {
  if (!plan) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Badge className="mb-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5">
          <Sparkles className="w-4 h-4 mr-1.5" />
          Most Popular
        </Badge>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h2>
        <p className="text-gray-600">{plan.description}</p>
      </div>

      <div className="flex items-center justify-center gap-2 py-6">
        <span className="text-5xl font-bold text-gray-900">
          £{plan.price.toFixed(2)}
        </span>
        <span className="text-xl text-gray-600">/ {plan.billing_interval}</span>
      </div>

      <CompactROICalculator className="justify-center mb-4" />

      <div className="grid sm:grid-cols-2 gap-4">
        {plan.features?.slice(0, 8).map((feature: string, i: number) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">{feature}</span>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>30-Day Free Trial:</strong> Try everything free for {plan.trial_days}{' '}
          days. No credit card required. Cancel anytime.
        </p>
      </div>

      <Button
        onClick={onNext}
        size="lg"
        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
      >
        Continue to Account Setup
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}

// ============================================================================
// STEP 2: ACCOUNT INFORMATION
// ============================================================================

function Step2AccountInfo({
  initialData,
  onNext,
  onBack,
}: {
  initialData?: AccountInfo;
  onNext: (data: AccountInfo) => void;
  onBack: () => void;
}) {
  const form = useForm<AccountInfo>({
    resolver: zodResolver(accountInfoSchema),
    defaultValues: initialData || {
      customerName: '',
      customerEmail: '',
      phone: '',
      country: 'GB',
    },
  });

  const onSubmit = (data: AccountInfo) => {
    onNext(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Information</h2>
        <p className="text-gray-600">This will be the primary account holder</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="customerName">Full Name *</Label>
          <Input
            id="customerName"
            {...form.register('customerName')}
            placeholder="John Smith"
            className="mt-1"
          />
          {form.formState.errors.customerName && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.customerName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="customerEmail">Email Address *</Label>
          <Input
            id="customerEmail"
            type="email"
            {...form.register('customerEmail')}
            placeholder="john@example.com"
            className="mt-1"
          />
          {form.formState.errors.customerEmail && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.customerEmail.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <Input
            id="phone"
            type="tel"
            {...form.register('phone')}
            placeholder="+44 7700 900000"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="country">Country *</Label>
          <Select
            value={form.watch('country')}
            onValueChange={(value) => form.setValue('country', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="AU">Australia</SelectItem>
              <SelectItem value="IE">Ireland</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.country && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.country.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

// ============================================================================
// STEP 3: FAMILY MEMBERS
// ============================================================================

function Step3FamilyMembers({
  initialMembers,
  maxMembers,
  onNext,
  onBack,
}: {
  initialMembers: FamilyMemberInput[];
  maxMembers: number;
  onNext: (members: FamilyMemberInput[]) => void;
  onBack: () => void;
}) {
  const [members, setMembers] = useState<FamilyMemberInput[]>(initialMembers);
  const [showAddForm, setShowAddForm] = useState(false);

  const form = useForm<FamilyMemberInput>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: {
      member_name: '',
      member_email: '',
      member_age: 10,
      relationship: 'child',
    },
  });

  const addMember = (data: FamilyMemberInput) => {
    setMembers([...members, data]);
    form.reset();
    setShowAddForm(false);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Family Members</h2>
        <p className="text-gray-600">
          Add up to {maxMembers} family members (optional - you can add them later)
        </p>
      </div>

      {/* Current Members */}
      {members.length > 0 && (
        <div className="space-y-3">
          {members.map((member, i) => (
            <Card key={i} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{member.member_name}</p>
                <p className="text-sm text-gray-600">
                  {member.member_email} • Age {member.member_age} • {member.relationship}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeMember(i)}
              >
                <X className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Add Member Form */}
      {showAddForm ? (
        <Card className="p-4 border-2 border-amber-200">
          <form onSubmit={form.handleSubmit(addMember)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="member_name">Name *</Label>
                <Input
                  id="member_name"
                  {...form.register('member_name')}
                  placeholder="Family member name"
                />
              </div>

              <div>
                <Label htmlFor="member_email">Email</Label>
                <Input
                  id="member_email"
                  type="email"
                  {...form.register('member_email')}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="member_age">Age *</Label>
                <Input
                  id="member_age"
                  type="number"
                  {...form.register('member_age', { valueAsNumber: true })}
                  min={5}
                  max={120}
                />
              </div>

              <div>
                <Label htmlFor="relationship">Relationship *</Label>
                <Select
                  value={form.watch('relationship')}
                  onValueChange={(value) => form.setValue('relationship', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setShowAddForm(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add Member
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        members.length < maxMembers && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAddForm(true)}
            className="w-full border-2 border-dashed border-gray-300 hover:border-amber-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Family Member
          </Button>
        )
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={() => onNext(members)}
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
        >
          {members.length > 0 ? `Continue with ${members.length} members` : 'Skip for Now'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-center text-gray-500">
        You can add or remove family members anytime from your dashboard
      </p>
    </div>
  );
}

// ============================================================================
// STEP 4: PAYMENT
// ============================================================================

function Step4Payment({
  plan,
  accountInfo,
  familyMembers,
  startTrial,
  onStartTrial,
  onSubscribe,
  onBack,
  isLoading,
}: {
  plan: any;
  accountInfo: AccountInfo;
  familyMembers: FamilyMemberInput[];
  startTrial: boolean;
  onStartTrial: () => void;
  onSubscribe: (startTrial: boolean) => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Enrollment</h2>
        <p className="text-gray-600">Choose how you'd like to get started</p>
      </div>

      {/* Summary */}
      <Card className="p-4 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Plan</span>
            <span className="font-medium">{plan?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Account Holder</span>
            <span className="font-medium">{accountInfo?.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Family Members</span>
            <span className="font-medium">{familyMembers.length + 1} total</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-lg">
            <span className="font-semibold">Price</span>
            <span className="font-bold text-green-600">
              £{plan?.price.toFixed(2)}/{plan?.billing_interval}
            </span>
          </div>
        </div>
      </Card>

      {/* Free Trial Option */}
      <Card className="p-6 border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Start 30-Day Free Trial
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 mb-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Full access to everything for {plan?.trial_days} days
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                No credit card required
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Cancel anytime during trial - no charge
              </li>
            </ul>
            <Button
              onClick={() => onSubscribe(true)}
              disabled={isLoading}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Start Free Trial
            </Button>
          </div>
        </div>
      </Card>

      {/* Paid Option */}
      <Card className="p-6 border-2 border-gray-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Start Paid Subscription
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 mb-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Immediate full access
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                30-day money-back guarantee
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Billed monthly, cancel anytime
              </li>
            </ul>
            <Button
              onClick={() => onSubscribe(false)}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="w-full border-2 border-amber-500 hover:bg-amber-50"
            >
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Subscribe Now - £{plan?.price.toFixed(2)}/month
            </Button>
          </div>
        </div>
      </Card>

      {/* Back Button */}
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="w-full"
        disabled={isLoading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Family Members
      </Button>
    </div>
  );
}
