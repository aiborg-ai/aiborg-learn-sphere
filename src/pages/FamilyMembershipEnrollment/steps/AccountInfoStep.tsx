/**
 * AccountInfoStep (Step 2)
 * Collects customer information in guest mode (no auth required yet)
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ArrowLeft } from '@/components/ui/icons';
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
import { accountInfoSchema, type AccountInfo } from '../types';

interface AccountInfoStepProps {
  initialData?: AccountInfo;
  onNext: (data: AccountInfo) => void;
  onBack: () => void;
}

export function AccountInfoStep({ initialData, onNext, onBack }: AccountInfoStepProps) {
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
