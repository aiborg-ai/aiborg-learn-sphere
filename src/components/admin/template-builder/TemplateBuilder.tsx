/**
 * TemplateBuilder Component (Refactored)
 *
 * Main orchestrator component for the visual template builder.
 * Uses Compound Component Pattern with the following sub-components:
 * - TemplateFieldList: Manages collapsible field sections
 * - FieldEditor: Renders individual form fields
 * - TemplatePreview: Shows JSON preview dialog
 * - ValidationPanel: Displays help and tips
 *
 * Custom hooks:
 * - useTemplateForm: Form state management
 * - useTemplateValidation: Validation logic
 * - useTemplateExport: Export/copy functionality
 */
import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { TemplateType } from './types';
import { COURSE_FIELDS, EVENT_FIELDS } from './constants';
import { useTemplateForm } from './hooks/useTemplateForm';
import { useTemplateValidation } from './hooks/useTemplateValidation';
import { useTemplateExport } from './hooks/useTemplateExport';
import { TemplateFieldList } from './TemplateFieldList';
import { TemplatePreview } from './TemplatePreview';
import { ValidationPanel } from './ValidationPanel';

export function TemplateBuilder() {
  const { toast } = useToast();
  const [templateType, setTemplateType] = useState<TemplateType>('course');
  const [showPreview, setShowPreview] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    required: true,
    optional: false
  });

  const {
    formData,
    arrayInputs,
    errors,
    setArrayInputs,
    setErrors,
    handleFieldChange,
    handleArrayAdd,
    handleArrayRemove
  } = useTemplateForm();

  const { validateRequiredFields, validateTemplate } = useTemplateValidation();
  const { exportAsJSON, copyToClipboard } = useTemplateExport();

  const fields = templateType === 'course' ? COURSE_FIELDS : EVENT_FIELDS;
  const requiredFields = fields.filter(f => f.required);
  const optionalFields = fields.filter(f => !f.required);

  const handleArrayInputChange = (fieldName: string, value: string) => {
    setArrayInputs(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSave = async () => {
    const validationErrors = validateRequiredFields(formData, requiredFields);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    await validateTemplate(formData, templateType);
  };

  const handleExportJSON = () => {
    exportAsJSON(formData, templateType);
  };

  const handleCopyJSON = () => {
    copyToClipboard(formData, templateType);
  };

  const toggleSection = (section: 'required' | 'optional') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getMissingRequiredCount = () => {
    return requiredFields.filter(f =>
      !formData[f.name] || (f.type === 'array' && formData[f.name]?.length === 0)
    ).length;
  };

  const getFilledOptionalCount = () => {
    return optionalFields.filter(f => formData[f.name]).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Visual Template Builder</h2>
          <p className="text-muted-foreground mt-1">
            Create templates with an intuitive visual interface
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TemplatePreview
            formData={formData}
            templateType={templateType}
            showPreview={showPreview}
            onShowPreviewChange={setShowPreview}
            onCopyJSON={handleCopyJSON}
            onExportJSON={handleExportJSON}
          />
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Validate & Save
          </Button>
        </div>
      </div>

      {/* Template Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Template Type</CardTitle>
          <CardDescription>
            Choose the type of template you want to create
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={templateType} onValueChange={(v) => setTemplateType(v as TemplateType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="course">Course Template</TabsTrigger>
              <TabsTrigger value="event">Event Template</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Form Sections */}
      <div className="space-y-4">
        {/* Required Fields */}
        <TemplateFieldList
          title="Required Fields"
          description="These fields must be filled for a valid template"
          fields={requiredFields}
          formData={formData}
          arrayInputs={arrayInputs}
          errors={errors}
          isExpanded={expandedSections.required}
          onToggleExpanded={() => toggleSection('required')}
          onFieldChange={handleFieldChange}
          onArrayInputChange={handleArrayInputChange}
          onArrayAdd={handleArrayAdd}
          onArrayRemove={handleArrayRemove}
          badgeVariant="destructive"
          getBadgeContent={() => `${getMissingRequiredCount()} missing`}
        />

        {/* Optional Fields */}
        <TemplateFieldList
          title="Optional Fields"
          description="Additional fields to enhance your template"
          fields={optionalFields}
          formData={formData}
          arrayInputs={arrayInputs}
          errors={errors}
          isExpanded={expandedSections.optional}
          onToggleExpanded={() => toggleSection('optional')}
          onFieldChange={handleFieldChange}
          onArrayInputChange={handleArrayInputChange}
          onArrayAdd={handleArrayAdd}
          onArrayRemove={handleArrayRemove}
          badgeVariant="secondary"
          getBadgeContent={() => `${getFilledOptionalCount()}/${optionalFields.length} filled`}
        />
      </div>

      {/* Help Section */}
      <ValidationPanel />
    </div>
  );
}
