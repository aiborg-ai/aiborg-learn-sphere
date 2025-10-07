import React from 'react';
import type { FieldValues, FieldPath } from 'react-hook-form';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ButtonLoader } from './loading-states';
import { cn } from '@/lib/utils';

/**
 * Configuration for a form field
 * @template T - Form values type
 * @interface FieldConfig
 */
export interface FieldConfig<T extends FieldValues = FieldValues> {
  name: FieldPath<T>;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'tel'
    | 'url'
    | 'date'
    | 'time'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'file';
  placeholder?: string;
  description?: string;
  options?: Array<{ label: string; value: string }>;
  disabled?: boolean;
  className?: string;
  rows?: number; // for textarea
  accept?: string; // for file input
  multiple?: boolean; // for file input
}

/**
 * Props for the SmartForm component
 * @template T - Form values type that extends FieldValues
 * @interface SmartFormProps
 */
interface SmartFormProps<T extends FieldValues = FieldValues> {
  /** Zod schema for form validation */
  schema: z.ZodSchema<T>;
  /** Array of field configurations */
  fields: FieldConfig<T>[];
  /** Form submission handler */
  onSubmit: (data: T) => void | Promise<void>;
  /** Default values for form fields */
  defaultValues?: Partial<T>;
  /** Submit button label */
  submitLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Cancel button click handler */
  onCancel?: () => void;
  /** Loading state indicator */
  loading?: boolean;
  /** Form container className */
  className?: string;
  /** Submit button className */
  submitClassName?: string;
  /** Reset form after successful submission */
  resetOnSuccess?: boolean;
}

/**
 * Smart form component with built-in validation and field generation
 * @template T - Type of form values
 * @param {SmartFormProps<T>} props - Form configuration props
 * @returns {JSX.Element} Rendered form with validation and error handling
 * @example
 * <SmartForm
 *   schema={authSchemas.signIn}
 *   fields={[
 *     { name: 'email', label: 'Email', type: 'email' },
 *     { name: 'password', label: 'Password', type: 'password' }
 *   ]}
 *   onSubmit={handleLogin}
 *   loading={isLoading}
 * />
 */
export function SmartForm<T extends FieldValues = FieldValues>({
  schema,
  fields,
  onSubmit,
  defaultValues,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  loading = false,
  className,
  submitClassName,
  resetOnSuccess = false,
}: SmartFormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as T,
  });

  /**
   * Handle form submission with optional reset
   * @param {T} data - Validated form data
   */
  const handleSubmit = async (data: T) => {
    await onSubmit(data);
    if (resetOnSuccess) {
      form.reset();
    }
  };

  /**
   * Render a form field based on its configuration
   * @param {FieldConfig<T>} field - Field configuration object
   * @returns {JSX.Element} Rendered form field with validation
   */
  const renderField = (field: FieldConfig<T>) => {
    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        render={({ field: formField }) => (
          <FormItem className={field.className}>
            {field.type !== 'checkbox' && <FormLabel>{field.label}</FormLabel>}
            <FormControl>{renderInput(field, formField)}</FormControl>
            {field.description && <FormDescription>{field.description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  /**
   * Render the appropriate input component based on field type
   * @param {FieldConfig<T>} fieldConfig - Field configuration
   * @param {object} formField - React Hook Form field object
   * @returns {JSX.Element} Appropriate input component
   */
  const renderInput = (
    fieldConfig: FieldConfig<T>,
    formField: { value: unknown; onChange: (value: unknown) => void; onBlur: () => void }
  ) => {
    const { type, placeholder, options, disabled, rows, accept, multiple, label } = fieldConfig;

    switch (type) {
      case 'textarea':
        return (
          <Textarea
            {...formField}
            placeholder={placeholder}
            disabled={disabled || loading}
            rows={rows || 3}
          />
        );

      case 'select':
        return (
          <Select
            onValueChange={formField.onChange}
            defaultValue={formField.value}
            disabled={disabled || loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formField.value}
              onCheckedChange={formField.onChange}
              disabled={disabled || loading}
            />
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
            </label>
          </div>
        );

      case 'radio':
        return (
          <RadioGroup
            onValueChange={formField.onChange}
            defaultValue={formField.value}
            disabled={disabled || loading}
          >
            {options?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} />
                <label className="text-sm font-medium">{option.label}</label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'file':
        return (
          <Input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={e => {
              const files = e.target.files;
              formField.onChange(multiple ? files : files?.[0]);
            }}
            disabled={disabled || loading}
          />
        );

      default:
        return (
          <Input
            {...formField}
            type={type}
            placeholder={placeholder}
            disabled={disabled || loading}
          />
        );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={cn('space-y-6', className)}>
        {fields.map(renderField)}

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className={submitClassName}>
            <ButtonLoader loading={loading}>{submitLabel}</ButtonLoader>
          </Button>

          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

/**
 * Preset form configurations for common use cases
 * @const FormPresets
 * @description Ready-to-use field configurations for common forms
 * @example
 * <SmartForm
 *   schema={authSchemas.signIn}
 *   fields={FormPresets.login}
 *   onSubmit={handleLogin}
 * />
 */
export const FormPresets = {
  login: [
    {
      name: 'email' as const,
      label: 'Email',
      type: 'email' as const,
      placeholder: 'Enter your email',
    },
    {
      name: 'password' as const,
      label: 'Password',
      type: 'password' as const,
      placeholder: 'Enter your password',
    },
  ],

  signup: [
    {
      name: 'email' as const,
      label: 'Email',
      type: 'email' as const,
      placeholder: 'Enter your email',
    },
    {
      name: 'displayName' as const,
      label: 'Display Name',
      type: 'text' as const,
      placeholder: 'Enter your name',
    },
    {
      name: 'password' as const,
      label: 'Password',
      type: 'password' as const,
      placeholder: 'Create a password',
    },
    {
      name: 'confirmPassword' as const,
      label: 'Confirm Password',
      type: 'password' as const,
      placeholder: 'Confirm your password',
    },
  ],

  contact: [
    {
      name: 'name' as const,
      label: 'Name',
      type: 'text' as const,
      placeholder: 'Your name',
    },
    {
      name: 'email' as const,
      label: 'Email',
      type: 'email' as const,
      placeholder: 'Your email',
    },
    {
      name: 'subject' as const,
      label: 'Subject',
      type: 'text' as const,
      placeholder: 'Message subject',
    },
    {
      name: 'message' as const,
      label: 'Message',
      type: 'textarea' as const,
      placeholder: 'Your message',
      rows: 5,
    },
  ],
};
