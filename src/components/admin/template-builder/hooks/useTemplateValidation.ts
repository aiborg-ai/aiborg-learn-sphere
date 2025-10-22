import { useToast } from '@/components/ui/use-toast';
import { validateCourseTemplate, validateEventTemplate } from '@/services/templateService';
import type { TemplateField, TemplateType } from '../types';

export function useTemplateValidation() {
  const { toast } = useToast();

  const validateRequiredFields = (
    formData: Record<string, unknown>,
    requiredFields: TemplateField[]
  ): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    requiredFields.forEach(field => {
      const value = formData[field.name];
      if (field.type === 'array') {
        if (!value || (Array.isArray(value) && value.length === 0)) {
          newErrors[field.name] = `${field.label} is required`;
        }
      } else if (!value) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    return newErrors;
  };

  const validateTemplate = async (
    formData: Record<string, unknown>,
    templateType: TemplateType
  ): Promise<boolean> => {
    try {
      const validation =
        templateType === 'course'
          ? validateCourseTemplate([formData])
          : validateEventTemplate([formData]);

      if (!validation.success) {
        toast({
          title: 'Validation Failed',
          description: validation.errors?.[0]?.message || 'Please check your input',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Template Valid',
        description: 'Your template is ready for import',
      });
      return true;
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to validate template',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    validateRequiredFields,
    validateTemplate,
  };
}
