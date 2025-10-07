import { useState } from 'react';
import type { TemplateField } from '../types';
import { TemplateType } from '../types';

export function useTemplateForm() {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [arrayInputs, setArrayInputs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (field: TemplateField, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field.name]: value,
    }));

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field.name];
      return newErrors;
    });
  };

  const handleArrayAdd = (fieldName: string) => {
    const value = arrayInputs[fieldName];
    if (!value?.trim()) return;

    const currentArray = (formData[fieldName] as string[]) || [];
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...currentArray, value.trim()],
    }));

    setArrayInputs(prev => ({
      ...prev,
      [fieldName]: '',
    }));
  };

  const handleArrayRemove = (fieldName: string, index: number) => {
    const currentArray = (formData[fieldName] as string[]) || [];
    setFormData(prev => ({
      ...prev,
      [fieldName]: currentArray.filter((_item, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setFormData({});
    setArrayInputs({});
    setErrors({});
  };

  return {
    formData,
    arrayInputs,
    errors,
    setArrayInputs,
    setErrors,
    handleFieldChange,
    handleArrayAdd,
    handleArrayRemove,
    resetForm,
  };
}
