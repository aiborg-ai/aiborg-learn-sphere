// ============================================================================
// Dynamic Field Array Component for AI-Readiness Assessment
// Reusable component for adding/removing array items (text inputs)
// ============================================================================

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Plus, X, GripVertical } from 'lucide-react';

interface DynamicFieldArrayProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  minItems?: number;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DynamicFieldArray({
  label,
  value = [],
  onChange,
  placeholder = 'Enter item...',
  maxItems = 10,
  minItems = 0,
  helpText,
  required = false,
  disabled = false,
  className,
}: DynamicFieldArrayProps) {
  const items = value.length > 0 ? value : minItems > 0 ? [''] : [];

  const handleAdd = () => {
    if (items.length < maxItems) {
      onChange([...items, '']);
    }
  };

  const handleRemove = (index: number) => {
    if (items.length > minItems) {
      const newItems = items.filter((_, i) => i !== index);
      onChange(newItems);
    }
  };

  const handleChange = (index: number, newValue: string) => {
    const newItems = [...items];
    newItems[index] = newValue;
    onChange(newItems);
  };

  const canAdd = items.length < maxItems;
  const canRemove = items.length > minItems;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Label and Help Text */}
      <div className="space-y-1">
        <Label className="text-base font-medium text-white flex items-center gap-2">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </Label>
        {helpText && <p className="text-sm text-white/60">{helpText}</p>}
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <GripVertical className="h-4 w-4 text-white/30" />
            </div>
            <div className="flex-1">
              <Input
                value={item}
                onChange={e => handleChange(index, e.target.value)}
                placeholder={`${placeholder} ${index + 1}`}
                disabled={disabled}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                maxLength={200}
              />
            </div>
            {canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
                aria-label={`Remove item ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="p-4 border-2 border-dashed border-white/10 rounded-lg text-center">
            <p className="text-sm text-white/50">No items added yet</p>
          </div>
        )}
      </div>

      {/* Add Button */}
      {canAdd && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
          className="w-full text-white border-white/20 hover:bg-white/10"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item {items.length > 0 && `(${items.length}/${maxItems})`}
        </Button>
      )}

      {/* Item Count */}
      {items.length > 0 && (
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
          {maxItems && <span>Max: {maxItems}</span>}
        </div>
      )}
    </div>
  );
}
