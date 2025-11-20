import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { logger } from '@/utils/logger';
import { Search, Loader2, UserPlus } from '@/components/ui/icons';

interface ManualEnrollmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Course {
  id: number;
  title: string;
  price: string;
}

interface User {
  id: string;
  email: string;
  display_name: string | null;
}

export function ManualEnrollmentForm({ open, onOpenChange, onSuccess }: ManualEnrollmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [emailSearch, setEmailSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('completed');
  const [paymentMethod, setPaymentMethod] = useState<string>('manual');

  const { toast } = useToast();
  const { logEnrollmentCreated } = useAuditLogs();

  const fetchCourses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, price')
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      logger.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch courses',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    if (open) {
      fetchCourses();
    }
  }, [open, fetchCourses]);

  const searchUsers = async (email: string) => {
    if (!email || email.length < 3) {
      setUsers([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .ilike('email', `%${email}%`)
        .limit(10);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      logger.error('Error searching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive',
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleEmailSearchChange = (value: string) => {
    setEmailSearch(value);
    searchUsers(value);
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setEmailSearch(user.email);
    setUsers([]);
  };

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
    const course = courses.find(c => c.id.toString() === courseId);
    if (course && !paymentAmount) {
      setPaymentAmount(course.price);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !selectedCourse) {
      toast({
        title: 'Missing Information',
        description: 'Please select both a user and a course',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', selectedUser.id)
        .eq('course_id', parseInt(selectedCourse))
        .maybeSingle();

      if (existingEnrollment) {
        toast({
          title: 'Already Enrolled',
          description: 'This user is already enrolled in this course',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Create enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          user_id: selectedUser.id,
          course_id: parseInt(selectedCourse),
          payment_status: paymentStatus,
          payment_amount: paymentAmount ? parseFloat(paymentAmount) : null,
        })
        .select()
        .single();

      if (enrollmentError) throw enrollmentError;

      // Create payment transaction record
      await supabase.from('payment_transactions').insert({
        enrollment_id: enrollment.id,
        user_id: selectedUser.id,
        course_id: parseInt(selectedCourse),
        amount: paymentAmount ? parseFloat(paymentAmount) : 0,
        currency: 'INR',
        payment_method: paymentMethod,
        payment_gateway: 'manual',
        payment_status: paymentStatus,
        payment_date: new Date().toISOString(),
        metadata: {
          created_by: 'admin',
          type: 'manual_enrollment',
        },
      });

      // Log audit trail
      await logEnrollmentCreated(enrollment.id, {
        user_id: selectedUser.id,
        user_email: selectedUser.email,
        course_id: selectedCourse,
        payment_amount: paymentAmount,
        payment_status: paymentStatus,
        type: 'manual',
      });

      toast({
        title: 'Enrollment Created',
        description: `${selectedUser.display_name || selectedUser.email} has been enrolled successfully`,
      });

      // Reset form
      setSelectedUser(null);
      setEmailSearch('');
      setSelectedCourse('');
      setPaymentAmount('');
      setPaymentStatus('completed');
      setPaymentMethod('manual');

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      logger.error('Error creating manual enrollment:', error);
      toast({
        title: 'Error',
        description: 'Failed to create enrollment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Manual Enrollment
          </DialogTitle>
          <DialogDescription>Manually enroll a student into a course</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label htmlFor="user-search">Student Email</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="user-search"
                placeholder="Search by email..."
                value={emailSearch}
                onChange={e => handleEmailSearchChange(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>

            {/* User suggestions */}
            {users.length > 0 && (
              <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                {users.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleUserSelect(user)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-sm">{user.display_name || 'No Name'}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </button>
                ))}
              </div>
            )}

            {selectedUser && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-medium text-green-800">
                  Selected: {selectedUser.display_name || selectedUser.email}
                </p>
                <p className="text-xs text-green-600">{selectedUser.email}</p>
              </div>
            )}
          </div>

          {/* Course Selection */}
          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <Select value={selectedCourse} onValueChange={handleCourseSelect} disabled={loading}>
              <SelectTrigger id="course">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.title} - ₹{course.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <Label htmlFor="payment-status">Payment Status</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus} disabled={loading}>
              <SelectTrigger id="payment-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={loading}>
              <SelectTrigger id="payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedUser || !selectedCourse}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enroll Student
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
