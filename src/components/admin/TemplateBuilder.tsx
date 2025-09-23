import React, { useState } from 'react';
import {
  Plus, Trash2, Save, Download, Upload, Copy, Check,
  ChevronDown, ChevronRight, AlertCircle, Info, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { validateCourseTemplate, validateEventTemplate } from '@/services/templateService';

interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date' | 'price' | 'array' | 'boolean' | 'object';
  required: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
  validation?: any;
  maxItems?: number;
}

const COURSE_FIELDS: TemplateField[] = [
  {
    name: 'title',
    label: 'Course Title',
    type: 'text',
    required: true,
    placeholder: 'e.g., Advanced React Development',
    description: 'The main title of the course'
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    required: true,
    placeholder: 'Detailed course description...',
    description: 'Comprehensive description of what the course covers'
  },
  {
    name: 'audiences',
    label: 'Target Audiences',
    type: 'multiselect',
    required: true,
    options: ['Student', 'Professional', 'Entrepreneur', 'Freelancer', 'Corporate', 'Researcher'],
    description: 'Who this course is designed for'
  },
  {
    name: 'mode',
    label: 'Course Mode',
    type: 'select',
    required: true,
    options: ['Online', 'Offline', 'Hybrid', 'Self-paced', 'Instructor-led'],
    description: 'How the course will be delivered'
  },
  {
    name: 'duration',
    label: 'Duration',
    type: 'text',
    required: true,
    placeholder: 'e.g., 8 weeks, 3 months',
    description: 'Length of the course'
  },
  {
    name: 'price',
    label: 'Price',
    type: 'price',
    required: true,
    placeholder: '₹15000 or Free',
    description: 'Course fee in local currency'
  },
  {
    name: 'level',
    label: 'Difficulty Level',
    type: 'select',
    required: true,
    options: ['Beginner', 'Intermediate', 'Advanced'],
    description: 'Course difficulty level'
  },
  {
    name: 'start_date',
    label: 'Start Date',
    type: 'date',
    required: true,
    description: 'When the course begins'
  },
  {
    name: 'features',
    label: 'Course Features',
    type: 'array',
    required: true,
    maxItems: 10,
    description: 'Key features and offerings'
  },
  {
    name: 'keywords',
    label: 'Keywords',
    type: 'array',
    required: true,
    maxItems: 15,
    description: 'Search keywords for better discovery'
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    required: true,
    options: ['Technology', 'Business', 'Design', 'Marketing', 'Finance', 'Health', 'Education', 'Arts', 'Science', 'Engineering'],
    description: 'Primary category classification'
  },
  {
    name: 'is_featured',
    label: 'Featured Course',
    type: 'boolean',
    required: false,
    description: 'Display prominently on homepage'
  },
  {
    name: 'is_active',
    label: 'Active',
    type: 'boolean',
    required: false,
    description: 'Whether the course is currently active'
  }
];

const EVENT_FIELDS: TemplateField[] = [
  {
    name: 'name',
    label: 'Event Name',
    type: 'text',
    required: true,
    placeholder: 'e.g., AI Summit 2025',
    description: 'The main title of the event'
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    required: true,
    placeholder: 'Detailed event description...',
    description: 'What the event is about'
  },
  {
    name: 'event_type',
    label: 'Event Type',
    type: 'select',
    required: true,
    options: ['workshop', 'webinar', 'conference', 'seminar', 'bootcamp', 'meetup'],
    description: 'Type of event'
  },
  {
    name: 'date',
    label: 'Event Date',
    type: 'date',
    required: true,
    description: 'When the event will occur'
  },
  {
    name: 'time',
    label: 'Start Time',
    type: 'text',
    required: false,
    placeholder: 'e.g., 10:00 AM',
    description: 'Event start time'
  },
  {
    name: 'duration',
    label: 'Duration',
    type: 'text',
    required: false,
    placeholder: 'e.g., 3 hours, 2 days',
    description: 'How long the event lasts'
  },
  {
    name: 'location',
    label: 'Location',
    type: 'text',
    required: false,
    placeholder: 'e.g., Mumbai, Online',
    description: 'Where the event takes place'
  },
  {
    name: 'venue',
    label: 'Venue',
    type: 'text',
    required: false,
    placeholder: 'e.g., Tech Hub, Zoom',
    description: 'Specific venue or platform'
  },
  {
    name: 'max_attendees',
    label: 'Max Attendees',
    type: 'number',
    required: false,
    placeholder: '100',
    description: 'Maximum number of participants'
  },
  {
    name: 'price',
    label: 'Price',
    type: 'price',
    required: true,
    placeholder: '₹5000 or Free',
    description: 'Event registration fee'
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    required: true,
    options: ['Technology', 'Business', 'Design', 'Marketing', 'Finance', 'Health', 'Education', 'Arts', 'Science', 'Engineering'],
    description: 'Event category'
  },
  {
    name: 'speakers',
    label: 'Speakers',
    type: 'array',
    required: false,
    maxItems: 30,
    description: 'List of speakers/presenters'
  },
  {
    name: 'agenda',
    label: 'Agenda',
    type: 'array',
    required: false,
    maxItems: 20,
    description: 'Event schedule and sessions'
  },
  {
    name: 'tags',
    label: 'Tags',
    type: 'array',
    required: false,
    maxItems: 15,
    description: 'Event tags for search'
  }
];

export function TemplateBuilder() {
  const { toast } = useToast();
  const [templateType, setTemplateType] = useState<'course' | 'event'>('course');
  const [formData, setFormData] = useState<any>({});
  const [arrayInputs, setArrayInputs] = useState<{ [key: string]: string }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPreview, setShowPreview] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    required: true,
    optional: false,
    advanced: false
  });

  const fields = templateType === 'course' ? COURSE_FIELDS : EVENT_FIELDS;
  const requiredFields = fields.filter(f => f.required);
  const optionalFields = fields.filter(f => !f.required);

  const handleFieldChange = (field: TemplateField, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field.name]: value
    }));

    // Clear error for this field
    setErrors((prev: any) => {
      const newErrors = { ...prev };
      delete newErrors[field.name];
      return newErrors;
    });
  };

  const handleArrayAdd = (fieldName: string) => {
    const value = arrayInputs[fieldName];
    if (!value?.trim()) return;

    const currentArray = formData[fieldName] || [];
    setFormData((prev: any) => ({
      ...prev,
      [fieldName]: [...currentArray, value.trim()]
    }));

    setArrayInputs((prev: any) => ({
      ...prev,
      [fieldName]: ''
    }));
  };

  const handleArrayRemove = (fieldName: string, index: number) => {
    const currentArray = formData[fieldName] || [];
    setFormData((prev: any) => ({
      ...prev,
      [fieldName]: currentArray.filter((_: any, i: number) => i !== index)
    }));
  };

  const validateTemplate = () => {
    const newErrors: { [key: string]: string } = {};

    // Check required fields
    requiredFields.forEach(field => {
      const value = formData[field.name];
      if (field.type === 'array') {
        if (!value || value.length === 0) {
          newErrors[field.name] = `${field.label} is required`;
        }
      } else if (!value) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateTemplate()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Validate using schema
      const validation = templateType === 'course'
        ? validateCourseTemplate([formData])
        : validateEventTemplate([formData]);

      if (!validation.success) {
        toast({
          title: 'Validation Failed',
          description: validation.errors?.[0]?.message || 'Please check your input',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Template Valid',
        description: 'Your template is ready for import',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to validate template',
        variant: 'destructive'
      });
    }
  };

  const handleExportJSON = () => {
    const exportData = templateType === 'course'
      ? { courses: [formData] }
      : { events: [formData] };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateType}-template-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Exported Successfully',
      description: 'Template has been downloaded as JSON',
    });
  };

  const handleCopyJSON = () => {
    const exportData = templateType === 'course'
      ? { courses: [formData] }
      : { events: [formData] };

    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));

    toast({
      title: 'Copied to Clipboard',
      description: 'Template JSON has been copied',
    });
  };

  const renderField = (field: TemplateField) => {
    const value = formData[field.name];
    const error = errors[field.name];

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              value={value || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'border-red-500' : ''}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={value || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'border-red-500' : ''}
              rows={4}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value || ''}
              onValueChange={(val) => handleFieldChange(field, val)}
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
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'multiselect':
        return (
          <div key={field.name} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2 p-3 border rounded-lg">
              {field.options?.map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.name}-${option}`}
                    checked={(value || []).includes(option)}
                    onCheckedChange={(checked) => {
                      const currentValue = value || [];
                      if (checked) {
                        handleFieldChange(field, [...currentValue, option]);
                      } else {
                        handleFieldChange(field, currentValue.filter((v: string) => v !== option));
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
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(field, parseInt(e.target.value))}
              placeholder={field.placeholder}
              className={error ? 'border-red-500' : ''}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="date"
              value={value || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'price':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              value={value || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'border-red-500' : ''}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'array':
        return (
          <div key={field.name} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
              {field.maxItems && (
                <span className="text-xs text-muted-foreground ml-2">
                  (max {field.maxItems})
                </span>
              )}
            </Label>
            <div className="flex gap-2">
              <Input
                value={arrayInputs[field.name] || ''}
                onChange={(e) => setArrayInputs(prev => ({
                  ...prev,
                  [field.name]: e.target.value
                }))}
                placeholder={`Add ${field.label.toLowerCase()}`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleArrayAdd(field.name);
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => handleArrayAdd(field.name)}
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
                      onClick={() => handleArrayRemove(field.name, index)}
                      className="ml-1 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div key={field.name} className="flex items-center justify-between space-y-2">
            <div className="space-y-0.5">
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
            </div>
            <Switch
              id={field.name}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field, checked)}
            />
          </div>
        );

      default:
        return null;
    }
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
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Template Preview</DialogTitle>
                <DialogDescription>
                  JSON representation of your template
                </DialogDescription>
              </DialogHeader>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(
                  templateType === 'course'
                    ? { courses: [formData] }
                    : { events: [formData] },
                  null,
                  2
                )}
              </pre>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={handleCopyJSON}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy JSON
                </Button>
                <Button onClick={handleExportJSON}>
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
          <Tabs value={templateType} onValueChange={(v) => setTemplateType(v as any)}>
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
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => setExpandedSections(prev => ({
              ...prev,
              required: !prev.required
            }))}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {expandedSections.required ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                  Required Fields
                </CardTitle>
                <CardDescription>
                  These fields must be filled for a valid template
                </CardDescription>
              </div>
              <Badge variant="destructive">
                {requiredFields.filter(f => !formData[f.name] || (f.type === 'array' && formData[f.name]?.length === 0)).length} missing
              </Badge>
            </div>
          </CardHeader>
          {expandedSections.required && (
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {requiredFields.map(field => renderField(field))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Optional Fields */}
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => setExpandedSections(prev => ({
              ...prev,
              optional: !prev.optional
            }))}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {expandedSections.optional ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                  Optional Fields
                </CardTitle>
                <CardDescription>
                  Additional fields to enhance your template
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {optionalFields.filter(f => formData[f.name]).length}/{optionalFields.length} filled
              </Badge>
            </div>
          </CardHeader>
          {expandedSections.optional && (
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {optionalFields.map(field => renderField(field))}
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Help Section */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Template Builder Tips</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Fill in all required fields marked with a red asterisk (*)</li>
            <li>For array fields, press Enter or click the + button to add items</li>
            <li>Use the Preview JSON button to see the template structure</li>
            <li>Export your template as JSON for importing later</li>
            <li>Templates are validated against the schema before saving</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}