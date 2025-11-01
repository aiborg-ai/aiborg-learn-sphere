/**
 * Family Membership Enrollment Flow
 *
 * 5-step checkout process for Family Pass subscription with guest mode
 * Steps:
 * 1. Plan Confirmation
 * 2. Your Information (Guest Mode - No Auth Required)
 * 3. Add Family Members (Guest Mode - Optional)
 * 4. Create Account (Authentication Required)
 * 5. Payment / Free Trial
 */

import { useState, useEffect } from 'react';
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
  Lock,
  Mail,
  Eye,
  EyeOff,
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
import { useAuth } from '@/hooks/useAuth';
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

const authSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type AccountInfo = z.infer<typeof accountInfoSchema>;
type FamilyMemberInput = z.infer<typeof familyMemberSchema>;
type AuthInput = z.infer<typeof authSchema>;

interface EnrollmentData {
  accountInfo?: AccountInfo;
  familyMembers: FamilyMemberInput[];
  startTrial: boolean;
}

export default function FamilyMembershipEnrollment() {
  const _navigate = useNavigate();
  const { toast } = useToast();
  const { data: familyPlan, isLoading: planLoading } = usePlanBySlug('family-pass');
  const createSubscription = useCreateSubscription();
  const { user, loading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>({
    familyMembers: [],
    startTrial: true,
  });

  // Auto-skip Step 4 (Auth) if user is already logged in
  useEffect(() => {
    if (!authLoading && currentStep === 4 && user) {
      // User already authenticated, skip to Step 5
      setCurrentStep(5);
    }
  }, [currentStep, user, authLoading]);

  const steps = [
    { number: 1, title: 'Plan', icon: CheckCircle2 },
    { number: 2, title: 'Your Info', icon: Users },
    { number: 3, title: 'Family', icon: Users },
    { number: 4, title: 'Account', icon: Lock },
    { number: 5, title: 'Payment', icon: CreditCard },
  ];

  if (planLoading || authLoading) {
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
                  } ${currentStep === step.number ? 'ring-4 ring-amber-200 animate-pulse' : ''} transition-all duration-300`}
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
            <Step1PlanConfirmation plan={familyPlan} onNext={() => setCurrentStep(2)} />
          )}

          {currentStep === 2 && (
            <Step2AccountInfo
              initialData={enrollmentData.accountInfo}
              onNext={data => {
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
              onNext={members => {
                setEnrollmentData({ ...enrollmentData, familyMembers: members });
                setCurrentStep(4);
              }}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <Step4Authentication
              email={enrollmentData.accountInfo?.customerEmail || ''}
              displayName={enrollmentData.accountInfo?.customerName || ''}
              onNext={() => setCurrentStep(5)}
              onBack={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 5 && (
            <Step5Payment
              plan={familyPlan}
              accountInfo={enrollmentData.accountInfo!}
              familyMembers={enrollmentData.familyMembers}
              startTrial={enrollmentData.startTrial}
              onStartTrial={() => {
                setEnrollmentData({ ...enrollmentData, startTrial: true });
              }}
              onSubscribe={_startTrial => {
                if (!enrollmentData.accountInfo) {
                  toast({
                    title: 'Missing Information',
                    description: 'Please complete the account information step.',
                    variant: 'destructive',
                  });
                  setCurrentStep(2);
                  return;
                }

                if (!user) {
                  toast({
                    title: 'Authentication Required',
                    description: 'Please create your account first.',
                    variant: 'destructive',
                  });
                  setCurrentStep(4);
                  return;
                }

                createSubscription.mutate({
                  planSlug: 'family-pass',
                  customerEmail: enrollmentData.accountInfo.customerEmail,
                  customerName: enrollmentData.accountInfo.customerName,
                  startTrial: _startTrial,
                  metadata: {
                    phone: enrollmentData.accountInfo.phone || '',
                    country: enrollmentData.accountInfo.country,
                    family_members_count: enrollmentData.familyMembers.length.toString(),
                  },
                });
              }}
              onBack={() => setCurrentStep(4)}
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
  plan: Record<string, unknown>;
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
        <span className="text-5xl font-bold text-gray-900">£{plan.price.toFixed(2)}</span>
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
          <strong>30-Day Free Trial:</strong> Try everything free for {plan.trial_days} days. No
          credit card required. Cancel anytime.
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
// STEP 2: ACCOUNT INFORMATION (GUEST MODE - NO AUTH REQUIRED)
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Information</h2>
        <p className="text-gray-600">No account needed yet - we'll save this for later</p>
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
            onValueChange={value => form.setValue('country', value)}
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
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.country.message}</p>
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
// STEP 3: FAMILY MEMBERS (GUEST MODE - OPTIONAL)
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
          Add up to {maxMembers} family members (optional - you can add them later too)
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
              <Button type="button" variant="ghost" size="sm" onClick={() => removeMember(i)}>
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
                  onValueChange={value => form.setValue('relationship', value)}
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
// STEP 4: AUTHENTICATION (NEW STEP - REQUIRED)
// ============================================================================

function Step4Authentication({
  email,
  displayName,
  onNext,
  onBack,
}: {
  email: string;
  displayName: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const { signUp, signIn, signInWithGoogle, signInWithGitHub, user } = useAuth();
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<AuthInput>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: email,
      password: '',
      confirmPassword: '',
    },
  });

  // Auto-advance if already logged in
  useEffect(() => {
    if (user) {
      onNext();
    }
  }, [user, onNext]);

  const handleSignUp = async (data: AuthInput) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, displayName);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Sign Up Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account Created!',
        description: 'Please check your email to verify your account.',
      });
      onNext();
    }
  };

  const handleSignIn = async (data: AuthInput) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Sign In Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome Back!',
        description: 'You have successfully signed in.',
      });
      onNext();
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Authentication Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleGitHubAuth = async () => {
    setIsLoading(true);
    const { error } = await signInWithGitHub();
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Authentication Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const password = form.watch('password');
  const passwordStrength = calculatePasswordStrength(password);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {mode === 'signup' ? 'Secure Your Family Pass' : 'Welcome Back!'}
        </h2>
        <p className="text-gray-600">
          {mode === 'signup'
            ? "We've saved your information! Just create a password to continue."
            : 'Sign in to continue your enrollment'}
        </p>
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleGitHubAuth}
          disabled={isLoading}
          className="w-full"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          {mode === 'signup' ? 'Sign up with GitHub' : 'Sign in with GitHub'}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or with email</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form
        onSubmit={form.handleSubmit(mode === 'signup' ? handleSignUp : handleSignIn)}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="auth-email">Email Address</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="auth-email"
              type="email"
              {...form.register('email')}
              placeholder={email}
              className="pl-10"
              disabled
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Pre-filled from previous step</p>
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...form.register('password')}
              placeholder="Enter your password"
              className="pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.password.message}</p>
          )}
          {mode === 'signup' && password && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.strength === 'weak'
                        ? 'w-1/3 bg-red-500'
                        : passwordStrength.strength === 'medium'
                          ? 'w-2/3 bg-yellow-500'
                          : 'w-full bg-green-500'
                    }`}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {passwordStrength.strength}
                </span>
              </div>
              <p className="text-xs text-gray-500">{passwordStrength.message}</p>
            </div>
          )}
        </div>

        {mode === 'signup' && (
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="confirmPassword"
                type="password"
                {...form.register('confirmPassword')}
                placeholder="Confirm your password"
                className="pl-10"
              />
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
        >
          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {mode === 'signup' ? 'Create Account & Continue' : 'Sign In & Continue'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>

      {/* Toggle Sign In / Sign Up */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
          className="text-sm text-amber-600 hover:text-amber-700 font-medium"
        >
          {mode === 'signup' ? 'Already have an account? Sign In' : 'New user? Create Account'}
        </button>
      </div>

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

// Helper function for password strength
function calculatePasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong';
  message: string;
} {
  if (password.length < 8) {
    return { strength: 'weak', message: 'Too short - need at least 8 characters' };
  }

  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;

  if (score <= 2) {
    return { strength: 'weak', message: 'Add uppercase, numbers, or special characters' };
  } else if (score <= 4) {
    return { strength: 'medium', message: 'Good - consider adding more variety' };
  } else {
    return { strength: 'strong', message: 'Excellent password strength!' };
  }
}

// ============================================================================
// STEP 5: PAYMENT (FORMERLY STEP 4)
// ============================================================================

function Step5Payment({
  plan,
  accountInfo,
  familyMembers,
  startTrial: _startTrial,
  onStartTrial: _onStartTrial,
  onSubscribe,
  onBack,
  isLoading,
}: {
  plan: Record<string, unknown>;
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Start 30-Day Free Trial</h3>
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Start Paid Subscription</h3>
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
        Back to Account Setup
      </Button>
    </div>
  );
}
