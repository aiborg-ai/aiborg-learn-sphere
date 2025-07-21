import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, CreditCard, User, Phone, Mail, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface EnrollmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  courseName: string;
  coursePrice?: string;
}

export const EnrollmentForm: React.FC<EnrollmentFormProps> = ({
  isOpen,
  onClose,
  courseName,
  coursePrice = "Contact for pricing"
}) => {
  console.log("EnrollmentForm rendered with isOpen:", isOpen, "courseName:", courseName);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    studentName: '',
    dateOfBirth: undefined as Date | undefined,
    guardianName: '',
    email: '',
    whatsappNumber: '',
    homeAddress: ''
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.studentName || !formData.dateOfBirth || !formData.email || !formData.whatsappNumber || !formData.homeAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (showGuardianField && !formData.guardianName) {
      toast({
        title: "Guardian Required",
        description: "Guardian information is required for students under 18.",
        variant: "destructive"
      });
      return;
    }

    // TODO: Submit enrollment data
    toast({
      title: "Enrollment Submitted",
      description: "Your enrollment has been submitted successfully. We'll contact you soon with payment details.",
    });

    onClose();
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
                onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dateOfBirth && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dateOfBirth ? format(formData.dateOfBirth, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dateOfBirth}
                    onSelect={handleDateChange}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {showGuardianField && (
              <div className="space-y-2">
                <Label htmlFor="guardianName">Guardian's Full Name *</Label>
                <Input
                  id="guardianName"
                  value={formData.guardianName}
                  onChange={(e) => setFormData(prev => ({ ...prev, guardianName: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                placeholder="Enter WhatsApp number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="homeAddress">Home Address *</Label>
              <Textarea
                id="homeAddress"
                value={formData.homeAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, homeAddress: e.target.value }))}
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
              Course & Payment
            </h3>
            
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">Course: {courseName}</p>
              <p className="text-sm text-muted-foreground">Price: {coursePrice}</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Payment Instructions</h4>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <p>Please transfer the course fee to aiborg's bank account:</p>
                <div className="bg-white dark:bg-blue-900/50 p-3 rounded border font-mono">
                  <p><strong>Account Name:</strong> aiborg</p>
                  <p><strong>Sort Code:</strong> 60-06-33</p>
                  <p><strong>Account Number:</strong> 34933018</p>
                </div>
                <p className="mt-2">
                  After submitting this form, you will receive confirmation via email and WhatsApp with your enrollment details.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Submit Enrollment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

