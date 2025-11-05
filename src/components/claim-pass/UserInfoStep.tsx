import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const userInfoSchema = z.object({
  userName: z.string().min(2, 'Name must be at least 2 characters'),
  userEmail: z.string().email('Invalid email address'),
  vaultEmail: z.string().email('Invalid email address'),
  vaultSubscriptionEndDate: z.date({
    required_error: 'Subscription end date is required',
  }),
});

type UserInfoFormData = z.infer<typeof userInfoSchema>;

interface UserInfoStepProps {
  initialData: Partial<UserInfoFormData> & { vaultSubscriptionEndDate?: Date };
  onNext: (data: UserInfoFormData) => void;
  onBack: () => void;
}

export const UserInfoStep = ({ initialData, onNext, onBack }: UserInfoStepProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UserInfoFormData>({
    resolver: zodResolver(userInfoSchema),
    defaultValues: initialData,
  });

  const vaultSubscriptionEndDate = watch('vaultSubscriptionEndDate');

  const onSubmit = (data: UserInfoFormData) => {
    onNext(data);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Info Card */}
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Email Verification</h3>
                <p className="text-sm text-blue-700">
                  Please use the email address associated with your FHOAI Vault subscription. This
                  will be used for verification purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Information Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="userName">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="userName"
                {...register('userName')}
                placeholder="John Doe"
                className={errors.userName ? 'border-red-500' : ''}
              />
              {errors.userName && <p className="text-sm text-red-500">{errors.userName.message}</p>}
            </div>

            {/* User Email */}
            <div className="space-y-2">
              <Label htmlFor="userEmail">
                Your Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="userEmail"
                type="email"
                {...register('userEmail')}
                placeholder="your.email@example.com"
                className={errors.userEmail ? 'border-red-500' : ''}
              />
              {errors.userEmail && (
                <p className="text-sm text-red-500">{errors.userEmail.message}</p>
              )}
              <p className="text-xs text-gray-500">
                This email will be used for claim notifications and Family Pass access
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Vault Subscription Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-600" />
              FHOAI Vault Subscription Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vault Email */}
            <div className="space-y-2">
              <Label htmlFor="vaultEmail">
                Vault Subscription Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="vaultEmail"
                type="email"
                {...register('vaultEmail')}
                placeholder="vault.subscription@example.com"
                className={errors.vaultEmail ? 'border-red-500' : ''}
              />
              {errors.vaultEmail && (
                <p className="text-sm text-red-500">{errors.vaultEmail.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Email address associated with your FHOAI Vault account (can be same as above)
              </p>
            </div>

            {/* Subscription End Date */}
            <div className="space-y-2">
              <Label htmlFor="vaultSubscriptionEndDate">
                Vault Subscription Valid Until <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !vaultSubscriptionEndDate && 'text-muted-foreground',
                      errors.vaultSubscriptionEndDate && 'border-red-500'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {vaultSubscriptionEndDate ? (
                      format(vaultSubscriptionEndDate, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={vaultSubscriptionEndDate}
                    onSelect={date => setValue('vaultSubscriptionEndDate', date as Date)}
                    disabled={date => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.vaultSubscriptionEndDate && (
                <p className="text-sm text-red-500">{errors.vaultSubscriptionEndDate.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Your Family Pass will be synced with this date
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-semibold text-amber-900 mb-2">Need Help Finding This Information?</h4>
          <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
            <li>Check your FHOAI Vault account settings for subscription details</li>
            <li>Look for your subscription confirmation email</li>
            <li>Contact FHOAI Vault support if you can't find your subscription end date</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4">
          <Button type="button" variant="outline" size="lg" onClick={onBack}>
            ← Back
          </Button>
          <Button
            type="submit"
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
          >
            Continue to Next Step →
          </Button>
        </div>
      </form>
    </div>
  );
};
