import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/utils/iconLoader';

// Mobile-optimized Input with better touch targets
export const MobileInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    icon?: string;
    error?: string;
  }
>(({ className, icon, error, ...props }, ref) => {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Icon name={icon} size={20} />
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          'flex w-full rounded-lg border border-input bg-background',
          'px-3 py-3 text-base', // 16px minimum to prevent iOS zoom
          'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200',
          'active:border-primary active:border-2', // Better touch feedback
          icon && 'pl-10',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-destructive flex items-center gap-1">
          <Icon name="AlertCircle" size={14} />
          {error}
        </p>
      )}
    </div>
  );
});

MobileInput.displayName = 'MobileInput';

// Mobile-optimized Textarea with auto-resize
export const MobileTextarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    error?: string;
  }
>(({ className, error, ...props }, ref) => {
  return (
    <div className="relative">
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[120px] w-full rounded-lg border border-input bg-background',
          'px-3 py-3 text-base', // 16px minimum to prevent iOS zoom
          'ring-offset-background',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200',
          'active:border-primary active:border-2',
          'resize-y', // Allow vertical resize only
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-destructive flex items-center gap-1">
          <Icon name="AlertCircle" size={14} />
          {error}
        </p>
      )}
    </div>
  );
});

MobileTextarea.displayName = 'MobileTextarea';

// Mobile-optimized Select with better touch targets
export const MobileSelect = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    icon?: string;
    error?: string;
    options: Array<{ value: string; label: string }>;
  }
>(({ className, icon, error, options, ...props }, ref) => {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
          <Icon name={icon} size={20} />
        </div>
      )}
      <select
        ref={ref}
        className={cn(
          'flex w-full rounded-lg border border-input bg-background',
          'px-3 py-3 pr-10 text-base appearance-none', // 16px minimum to prevent iOS zoom
          'ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200',
          'active:border-primary active:border-2',
          'cursor-pointer',
          icon && 'pl-10',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/* Dropdown icon */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        <Icon name="ChevronDown" size={20} />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-destructive flex items-center gap-1">
          <Icon name="AlertCircle" size={14} />
          {error}
        </p>
      )}
    </div>
  );
});

MobileSelect.displayName = 'MobileSelect';

// Mobile-optimized Checkbox with larger touch target
export const MobileCheckbox = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    description?: string;
  }
>(({ className, label, description, ...props }, ref) => {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          'mt-0.5 h-5 w-5 min-w-5 rounded border-2 border-input',
          'text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'transition-all duration-200',
          'cursor-pointer',
          'active:scale-95',
          className
        )}
        {...props}
      />
      {(label || description) && (
        <div className="flex-1 -mt-0.5">
          {label && (
            <p className="text-base font-medium text-foreground group-active:text-primary transition-colors">
              {label}
            </p>
          )}
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      )}
    </label>
  );
});

MobileCheckbox.displayName = 'MobileCheckbox';

// Mobile-optimized Radio with larger touch target
export const MobileRadio = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    description?: string;
  }
>(({ className, label, description, ...props }, ref) => {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        ref={ref}
        type="radio"
        className={cn(
          'mt-0.5 h-5 w-5 min-w-5 rounded-full border-2 border-input',
          'text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'transition-all duration-200',
          'cursor-pointer',
          'active:scale-95',
          className
        )}
        {...props}
      />
      {(label || description) && (
        <div className="flex-1 -mt-0.5">
          {label && (
            <p className="text-base font-medium text-foreground group-active:text-primary transition-colors">
              {label}
            </p>
          )}
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      )}
    </label>
  );
});

MobileRadio.displayName = 'MobileRadio';

// Mobile-optimized Button with better touch feedback
export const MobileButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    icon?: string;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
  }
>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      loading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80',
      outline:
        'border-2 border-input bg-background hover:bg-muted/10 active:bg-muted/20 text-foreground',
      ghost: 'hover:bg-muted/10 active:bg-muted/20 text-foreground',
      destructive:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
    };

    const sizes = {
      sm: 'h-10 px-4 text-sm',
      md: 'h-12 px-6 text-base',
      lg: 'h-14 px-8 text-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
          'ring-offset-background transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-95',
          'whitespace-nowrap',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Icon name="Loader2" size={18} className="animate-spin" aria-hidden="true" />}
        {!loading && icon && iconPosition === 'left' && <Icon name={icon} size={18} />}
        {children}
        {!loading && icon && iconPosition === 'right' && <Icon name={icon} size={18} />}
      </button>
    );
  }
);

MobileButton.displayName = 'MobileButton';
