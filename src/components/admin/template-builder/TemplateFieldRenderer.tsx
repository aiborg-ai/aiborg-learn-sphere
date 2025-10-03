import { Plus, Trash2, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import type { TemplateField, TemplateFormData, ArrayInputs, TemplateErrors } from './types';

interface TemplateFieldRendererProps {
  field: TemplateField;
  value: unknown;
  onChange: (value: unknown) => void;
  arrayInput?: string;
  onArrayInputChange?: (value: string) => void;
  onArrayAdd?: () => void;
  onArrayRemove?: (index: number) => void;
  error?: string;
}

export function TemplateFieldRenderer({
  field,
  value,
  onChange,
  arrayInput,
  onArrayInputChange,
  onArrayAdd,
  onArrayRemove,
  error
}: TemplateFieldRendererProps) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'date':
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={(value as number) || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'price':
        return (
          <Input
            type="text"
            placeholder={field.placeholder}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`min-h-[100px] ${error ? 'border-destructive' : ''}`}
          />
        );

      case 'select':
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={onChange}
          >
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {field.options?.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedValues.includes(option)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onChange([...selectedValues, option]);
                      } else {
                        onChange(selectedValues.filter((v) => v !== option));
                      }
                    }}
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
            {selectedValues.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedValues.map((val) => (
                  <Badge key={val} variant="secondary">
                    {val}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        );

      case 'array':
        const arrayValue = (value as string[]) || [];
        const maxReached = field.maxItems ? arrayValue.length >= field.maxItems : false;

        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder={`Add ${field.label}`}
                value={arrayInput || ''}
                onChange={(e) => onArrayInputChange?.(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onArrayAdd?.();
                  }
                }}
                disabled={maxReached}
              />
              <Button
                type="button"
                size="sm"
                onClick={onArrayAdd}
                disabled={!arrayInput?.trim() || maxReached}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {field.maxItems && (
              <p className="text-xs text-muted-foreground">
                {arrayValue.length} / {field.maxItems} items
              </p>
            )}

            {arrayValue.length > 0 && (
              <div className="space-y-2">
                {arrayValue.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-muted rounded-md"
                  >
                    <span className="flex-1 text-sm">{item}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onArrayRemove?.(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={(value as boolean) || false}
              onCheckedChange={onChange}
            />
            <span className="text-sm text-muted-foreground">
              {(value as boolean) ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );

      default:
        return <Input value={String(value || '')} onChange={(e) => onChange(e.target.value)} />;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={field.name}>
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {field.description && (
          <div className="group relative">
            <Info className="h-4 w-4 text-muted-foreground" />
            <div className="absolute left-0 top-6 z-10 hidden group-hover:block w-64 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md border">
              {field.description}
            </div>
          </div>
        )}
      </div>

      {renderField()}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
