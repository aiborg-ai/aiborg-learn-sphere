import { UseFormReturn } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Save, ChevronDown } from 'lucide-react';
import { Course } from './types';
import { CourseBasicFields } from './CourseBasicFields';
import { CourseDetailsFields } from './CourseDetailsFields';
import { ArrayFieldManager } from './ArrayFieldManager';
import { CourseTemplates } from './CourseTemplates';
import { useState } from 'react';

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Course) => void;
  form: UseFormReturn<Course>;
  isLoading: boolean;
  editingCourse: Course | null;
  audiences: string[];
  setAudiences: (audiences: string[]) => void;
  features: string[];
  setFeatures: (features: string[]) => void;
  keywords: string[];
  setKeywords: (keywords: string[]) => void;
}

export function CourseFormDialog({
  open,
  onOpenChange,
  onSubmit,
  form,
  isLoading,
  editingCourse,
  audiences,
  setAudiences,
  features,
  setFeatures,
  keywords,
  setKeywords,
}: CourseFormDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const [showTemplates, setShowTemplates] = useState(!editingCourse);

  const handleTemplateSelect = (templateData: Partial<Course>) => {
    // Apply template data to form
    Object.entries(templateData).forEach(([key, value]) => {
      setValue(key as keyof Course, value);
    });

    // Update array fields
    if (templateData.audiences) setAudiences(templateData.audiences);
    if (templateData.features) setFeatures(templateData.features);
    if (templateData.keywords) setKeywords(templateData.keywords);

    setShowTemplates(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Templates Section - Only show when creating new course */}
          {!editingCourse && (
            <Collapsible open={showTemplates} onOpenChange={setShowTemplates}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-between">
                  <span>Use a Template (optional)</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <CourseTemplates onSelectTemplate={handleTemplateSelect} />
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Basic Information */}
          <CourseBasicFields
            register={register}
            errors={errors}
            setValue={setValue}
            watch={watch}
          />

          {/* Course Details */}
          <CourseDetailsFields register={register} errors={errors} />

          {/* Audiences */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Target Audiences</h3>
            <ArrayFieldManager
              label="Audiences"
              placeholder="e.g., SMEs & Corporate"
              items={audiences}
              onItemsChange={setAudiences}
              badgeVariant="secondary"
            />
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Course Features</h3>
            <ArrayFieldManager
              label="Features/Highlights"
              placeholder="e.g., Live Q&A sessions"
              items={features}
              onItemsChange={setFeatures}
              badgeVariant="secondary"
            />
          </div>

          {/* Keywords */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">SEO & Search</h3>
            <ArrayFieldManager
              label="Keywords"
              placeholder="e.g., AI, Machine Learning"
              items={keywords}
              onItemsChange={setKeywords}
              badgeVariant="outline"
            />
          </div>

          {/* Status & Visibility */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Status & Visibility</h3>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={watch('is_active')}
                  onCheckedChange={checked => setValue('is_active', checked)}
                />
                <Label htmlFor="is_active">Course Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="currently_enrolling"
                  checked={watch('currently_enrolling')}
                  onCheckedChange={checked => setValue('currently_enrolling', checked)}
                />
                <Label htmlFor="currently_enrolling">Currently Enrolling</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="display"
                  checked={watch('display')}
                  onCheckedChange={checked => setValue('display', checked)}
                />
                <Label htmlFor="display">Visible on Website</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
