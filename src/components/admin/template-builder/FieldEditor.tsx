import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { TemplateField } from './types';

interface FieldEditorProps {
  field: TemplateField;
  value: any;
  error?: string;
  arrayInput?: string;
  onFieldChange: (field: TemplateField, value: any) => void;
  onArrayInputChange?: (fieldName: string, value: string) => void;
  onArrayAdd?: (fieldName: string) => void;
  onArrayRemove?: (fieldName: string, index: number) => void;
}

export function FieldEditor({
  field,
  value,
  error,
  arrayInput,
  onFieldChange,
  onArrayInputChange,
  onArrayAdd,
  onArrayRemove
}: FieldEditorProps) {
  const renderFieldInput = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            id={field.name}
            value={value || ''}
            onChange={(e) => onFieldChange(field, e.target.value)}
            placeholder={field.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={field.name}
            value={value || ''}
            onChange={(e) => onFieldChange(field, e.target.value)}
            placeholder={field.placeholder}
            className={error ? 'border-red-500' : ''}
            rows={4}
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(val) => onFieldChange(field, val)}
          >
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2 p-3 border rounded-lg">
            {field.options?.map(option => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.name}-${option}`}
                  checked={(value || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValue = value || [];
                    if (checked) {
                      onFieldChange(field, [...currentValue, option]);
                    } else {
                      onFieldChange(field, currentValue.filter((v: string) => v !== option));
                    }
                  }}
                />
                <Label
                  htmlFor={`${field.name}-${option}`}
                  className="font-normal cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'number':
        return (
          <Input
            id={field.name}
            type="number"
            value={value || ''}
            onChange={(e) => onFieldChange(field, parseInt(e.target.value))}
            placeholder={field.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'date':
        return (
          <Input
            id={field.name}
            type="date"
            value={value || ''}
            onChange={(e) => onFieldChange(field, e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'price':
        return (
          <Input
            id={field.name}
            value={value || ''}
            onChange={(e) => onFieldChange(field, e.target.value)}
            placeholder={field.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'array':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={arrayInput || ''}
                onChange={(e) => onArrayInputChange?.(field.name, e.target.value)}
                placeholder={`Add ${field.label.toLowerCase()}`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onArrayAdd?.(field.name);
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => onArrayAdd?.(field.name)}
                disabled={field.maxItems ? (value?.length || 0) >= field.maxItems : false}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {value && value.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 border rounded-lg">
                {value.map((item: string, index: number) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {item}
                    <button
                      onClick={() => onArrayRemove?.(field.name, index)}
                      className="ml-1 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
            </div>
            <Switch
              id={field.name}
              checked={value || false}
              onCheckedChange={(checked) => onFieldChange(field, checked)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (field.type === 'boolean') {
    return <div key={field.name}>{renderFieldInput()}</div>;
  }

  return (
    <div key={field.name} className="space-y-2">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
        {field.type === 'array' && field.maxItems && (
          <span className="text-xs text-muted-foreground ml-2">
            (max {field.maxItems})
          </span>
        )}
      </Label>
      {renderFieldInput()}
      {field.description && field.type !== 'boolean' && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
