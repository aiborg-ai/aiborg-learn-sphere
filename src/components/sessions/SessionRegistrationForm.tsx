import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  User,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  UserPlus,
} from '@/components/ui/icons';
import { format } from 'date-fns';
import type { SessionWithCounts, CreateRegistrationInput } from '@/types/session';
import { useSessionRegistration } from '@/hooks/useSessionRegistration';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface SessionRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionWithCounts;
  onSuccess?: () => void;
}

// Validation schema
const registrationSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  birthdate: z.string().min(1, 'Date of birth is required'),
  parent_email: z.string().email('Please enter a valid parent email').optional().or(z.literal('')),
  parent_consent_given: z.boolean(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export const SessionRegistrationForm: React.FC<SessionRegistrationFormProps> = ({
  isOpen,
  onClose,
  session,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { registerForSession, loading } = useSessionRegistration();
  const [showParentFields, setShowParentFields] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  const [submissionResult, setSubmissionResult] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      full_name: user?.user_metadata?.display_name || '',
      email: user?.email || '',
      birthdate: '',
      parent_email: '',
      parent_consent_given: false,
    },
  });

  const birthdate = watch('birthdate');
  const parentConsentGiven = watch('parent_consent_given');

  // Calculate age when birthdate changes
  useEffect(() => {
    if (birthdate) {
      const birth = new Date(birthdate);
      const today = new Date();
      const calculatedAge = Math.floor(
        (today.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      setAge(calculatedAge);
      setShowParentFields(calculatedAge < 13);
    } else {
      setAge(null);
      setShowParentFields(false);
    }
  }, [birthdate]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSubmissionResult(null);
      setShowParentFields(false);
      setAge(null);
    }
  }, [isOpen, reset]);

  // Pre-fill user data
  useEffect(() => {
    if (user && isOpen) {
      setValue('full_name', user.user_metadata?.display_name || user.email?.split('@')[0] || '');
      setValue('email', user.email || '');
    }
  }, [user, isOpen, setValue]);

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      logger.log('Submitting registration:', data);

      // Validate age range
      if (age !== null) {
        if (age < session.target_age_min || age > session.target_age_max) {
          toast({
            title: 'Age Requirement',
            description: `This session is designed for ages ${session.target_age_min}-${session.target_age_max}. Your age: ${age}`,
            variant: 'destructive',
          });
          return;
        }
      }

      // Validate COPPA compliance for under-13
      if (showParentFields) {
        if (!data.parent_email) {
          toast({
            title: 'Parent Email Required',
            description: 'Parent email is required for participants under 13 years old.',
            variant: 'destructive',
          });
          return;
        }
        if (!data.parent_consent_given) {
          toast({
            title: 'Parent Consent Required',
            description: 'Parent consent must be given for participants under 13 years old.',
            variant: 'destructive',
          });
          return;
        }
      }

      const input: CreateRegistrationInput = {
        session_id: session.id,
        full_name: data.full_name,
        email: data.email,
        birthdate: data.birthdate,
        parent_email: showParentFields ? data.parent_email : undefined,
        parent_consent_given: showParentFields ? data.parent_consent_given : undefined,
      };

      const result = await registerForSession(input);

      logger.log('Registration successful:', result);

      setSubmissionResult(result.message);

      toast({
        title: 'Registration Successful!',
        description: result.message,
        variant: 'default',
      });

      if (onSuccess) {
        onSuccess();
      }

      // Close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (_error) {
      logger.error('Registration _error:', _error);
      toast({
        title: 'Registration Failed',
        description:
          error instanceof Error ? error.message : 'An error occurred during registration',
        variant: 'destructive',
      });
    }
  };

  const sessionDate = new Date(session.session_date);
  const isFull = session.is_full;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {isFull ? (
              <>
                <UserPlus className="w-6 h-6 text-orange-600" />
                Join Waitlist
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6 text-green-600" />
                Register for Session
              </>
            )}
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p className="font-semibold text-gray-900">{session.title}</p>
            <p className="text-sm">
              {format(sessionDate, 'EEEE, MMMM d, yyyy')} at {format(sessionDate, 'h:mm a')}
            </p>
            {isFull && (
              <Alert className="bg-orange-50 border-orange-200">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-900 text-sm">
                  This session is currently full. You'll be added to the waitlist and notified if a
                  spot opens up.
                </AlertDescription>
              </Alert>
            )}
          </DialogDescription>
        </DialogHeader>

        {submissionResult ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            <p className="text-lg font-medium text-gray-900">{submissionResult}</p>
            <p className="text-sm text-gray-600">This dialog will close automatically...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name *
              </Label>
              <Input
                id="full_name"
                {...register('full_name')}
                placeholder="Enter your full name"
                disabled={loading}
              />
              {errors.full_name && (
                <p className="text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="your.email@example.com"
                disabled={loading}
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="birthdate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date of Birth *
              </Label>
              <Input
                id="birthdate"
                type="date"
                {...register('birthdate')}
                max={new Date().toISOString().split('T')[0]}
                disabled={loading}
              />
              {errors.birthdate && (
                <p className="text-sm text-red-600">{errors.birthdate.message}</p>
              )}
              {age !== null && (
                <p className="text-sm text-gray-600">
                  Age: {age} years old
                  {(age < session.target_age_min || age > session.target_age_max) && (
                    <span className="text-orange-600 ml-2">
                      (Session is for ages {session.target_age_min}-{session.target_age_max})
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Parent Fields (COPPA Compliance for under 13) */}
            {showParentFields && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-sm">
                  <strong>Parent/Guardian Information Required</strong>
                  <p className="mt-1">
                    For participants under 13, we require parent/guardian email and consent (COPPA
                    compliance).
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {showParentFields && (
              <>
                {/* Parent Email */}
                <div className="space-y-2">
                  <Label htmlFor="parent_email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Parent/Guardian Email *
                  </Label>
                  <Input
                    id="parent_email"
                    type="email"
                    {...register('parent_email')}
                    placeholder="parent@example.com"
                    disabled={loading}
                  />
                  {errors.parent_email && (
                    <p className="text-sm text-red-600">{errors.parent_email.message}</p>
                  )}
                </div>

                {/* Parent Consent */}
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-md">
                  <Checkbox
                    id="parent_consent_given"
                    checked={parentConsentGiven}
                    onCheckedChange={checked =>
                      setValue('parent_consent_given', checked as boolean)
                    }
                    disabled={loading}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="parent_consent_given"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Parent/Guardian Consent *
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      I am the parent/guardian and I consent to my child's participation in this
                      session.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Terms and Conditions */}
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
              <p>
                By registering, you agree to receive email notifications about this session,
                including reminders and updates. We respect your privacy and will only use your
                information for this session.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : isFull ? (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Waitlist
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Register
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
