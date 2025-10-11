import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, User, Mail, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { SimpleDatePicker } from '@/components/ui/simple-date-picker';
import { useToast } from '@/hooks/use-toast';

import { logger } from '@/utils/logger';
interface EnrollmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  courseName: string;
  coursePrice?: string;
  courseId?: number;
}

export const EnrollmentForm: React.FC<EnrollmentFormProps> = ({
  isOpen,
  onClose,
  courseName,
  coursePrice = 'Contact for pricing',
  courseId,
}) => {
  logger.log('EnrollmentForm rendered with isOpen:', isOpen, 'courseName:', courseName);
  const { toast } = useToast();

  // Check if the course is free
  const isFree =
    coursePrice === 'Free' ||
    coursePrice === '₹0' ||
    coursePrice === '0' ||
    coursePrice?.toLowerCase().includes('free');
  const [formData, setFormData] = useState({
    studentName: '',
    dateOfBirth: undefined as Date | undefined,
    guardianName: '',
    email: '',
    whatsappNumber: '',
    homeAddress: '',
  });

  const [showGuardianField, setShowGuardianField] = useState(false);

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, dateOfBirth: date }));
    if (date) {
      const age = calculateAge(date);
      setShowGuardianField(age < 18);
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    logger.log('Form submission started');

    // Basic validation
    if (
      !formData.studentName ||
      !formData.dateOfBirth ||
      !formData.email ||
      !formData.whatsappNumber ||
      !formData.homeAddress
    ) {
      logger.log('Validation failed - missing fields');
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (showGuardianField && !formData.guardianName) {
      logger.log('Validation failed - missing guardian');
      toast({
        title: 'Guardian Required',
        description: 'Guardian information is required for students under 18.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      logger.log('Importing supabase client...');
      const { supabase } = await import('@/integrations/supabase/client');

      // Handle free course enrollment directly
      if (isFree && courseId) {
        logger.log('Free course detected, enrolling directly without payment');

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast({
            title: 'Authentication Required',
            description: 'Please log in to enroll in this course.',
            variant: 'destructive',
          });
          return;
        }

        // Check if already enrolled
        const { data: existingEnrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single();

        if (existingEnrollment) {
          toast({
            title: 'Already Enrolled',
            description: 'You are already enrolled in this course. Check your dashboard!',
          });
          onClose();
          return;
        }

        // Create enrollment directly
        const { data: enrollment, error: enrollError } = await supabase
          .from('enrollments')
          .insert({
            user_id: user.id,
            course_id: courseId,
            payment_status: 'completed',
            payment_amount: 0,
          })
          .select()
          .single();

        if (enrollError) {
          logger.error('Free enrollment error:', enrollError);
          throw enrollError;
        }

        logger.log('Free course enrollment successful:', enrollment);

        toast({
          title: 'Enrollment Successful! 🎉',
          description: "You're now enrolled! The course is available in your dashboard.",
        });

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);

        onClose();
        return;
      }

      // Handle paid course enrollment with payment
      logger.log('Validation passed, starting payment process');

      logger.log('Calling create-payment function with data:', {
        courseName,
        coursePrice,
        courseId,
        studentInfo: formData,
      });

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          courseName,
          coursePrice,
          courseId,
          studentInfo: formData,
        },
      });

      logger.log('Payment function response:', { data, error });

      if (error) {
        logger.error('Payment function error:', error);
        throw error;
      }

      if (!data || !data.url) {
        logger.error('No payment URL received:', data);
        throw new Error('No payment URL received');
      }

      logger.log('Opening payment URL:', data.url);
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');

      toast({
        title: 'Redirecting to Payment',
        description: 'Opening secure payment page in a new tab...',
      });

      onClose();
    } catch (error) {
      logger.error('Enrollment/Payment error:', error);
      toast({
        title: isFree ? 'Enrollment Error' : 'Payment Error',
        description: `Failed to ${isFree ? 'enroll' : 'create payment session'}: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Enroll in {courseName}
          </DialogTitle>
          <DialogDescription>
            Please fill in the following details to complete your enrollment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Student Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="studentName">Student's Full Name *</Label>
              <Input
                id="studentName"
                value={formData.studentName}
                onChange={e => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <SimpleDatePicker
                value={formData.dateOfBirth}
                onChange={handleDateChange}
                disabled={date => date > new Date() || date < new Date('1900-01-01')}
                placeholder="Select date of birth"
              />
              {!formData.dateOfBirth && (
                <p className="text-sm text-muted-foreground">Select year, then month, then day</p>
              )}
              {formData.dateOfBirth && (
                <p className="text-sm text-muted-foreground">
                  Selected: {format(formData.dateOfBirth, 'PPP')} (Age:{' '}
                  {calculateAge(formData.dateOfBirth)})
                </p>
              )}
            </div>

            {showGuardianField && (
              <div className="space-y-2">
                <Label htmlFor="guardianName">Guardian's Full Name *</Label>
                <Input
                  id="guardianName"
                  value={formData.guardianName}
                  onChange={e => setFormData(prev => ({ ...prev, guardianName: e.target.value }))}
                  placeholder="Enter guardian's full name"
                  required={showGuardianField}
                />
                <p className="text-sm text-muted-foreground">
                  Required for students under 18 years old
                </p>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number *</Label>
              <Input
                id="whatsappNumber"
                type="tel"
                value={formData.whatsappNumber}
                onChange={e => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                placeholder="Enter WhatsApp number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="homeAddress">Home Address *</Label>
              <Textarea
                id="homeAddress"
                value={formData.homeAddress}
                onChange={e => setFormData(prev => ({ ...prev, homeAddress: e.target.value }))}
                placeholder="Enter complete home address"
                required
                rows={3}
              />
            </div>
          </div>

          {/* Course & Payment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Course & {isFree ? 'Enrollment' : 'Payment'}
            </h3>

            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">Course: {courseName}</p>
              <p className="text-sm text-muted-foreground">Price: {coursePrice}</p>
            </div>

            {isFree ? (
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
                  🎉 Free Course Enrollment
                </h4>
                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <p>This course is completely free! Click "Enroll Now" to get instant access.</p>
                  <ul className="space-y-1 ml-4">
                    <li>• Instant enrollment</li>
                    <li>• No payment required</li>
                    <li>• Access immediately in your dashboard</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-3">
                  Secure Online Payment
                </h4>
                <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
                  <p>
                    Click "Proceed to Payment" to complete your enrollment with secure card payment.
                  </p>
                  <ul className="space-y-1 ml-4">
                    <li>• Secure payment powered by Stripe</li>
                    <li>• Instant enrollment confirmation</li>
                    <li>• Course details sent immediately</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  {isFree ? 'Enrolling...' : 'Processing...'}
                </>
              ) : isFree ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Enroll Now (Free)
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Proceed to Payment
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
