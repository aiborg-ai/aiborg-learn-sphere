/**
 * CourseBasicInfoStep Component
 * Step 1: Basic course information - title, description, image, category
 */

import React from 'react';
import { Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/studio/shared/RichTextEditor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StepComponentProps, CourseWizardData } from '@/types/studio.types';

const COURSE_CATEGORIES = [
  { value: 'ai-ml', label: 'AI & Machine Learning' },
  { value: 'leadership', label: 'Leadership & Management' },
  { value: 'technology', label: 'Technology & Development' },
  { value: 'business', label: 'Business & Strategy' },
  { value: 'data-science', label: 'Data Science & Analytics' },
  { value: 'design', label: 'Design & Creative' },
  { value: 'marketing', label: 'Marketing & Sales' },
  { value: 'soft-skills', label: 'Soft Skills & Communication' },
  { value: 'other', label: 'Other' },
];

export function CourseBasicInfoStep({ data, onUpdate }: StepComponentProps<CourseWizardData>) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Basic Information</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Start by providing the essential details about your course
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          This information will be visible to potential students browsing the course catalog. Make
          it clear and compelling!
        </AlertDescription>
      </Alert>

      {/* Course Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Course Title
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="title"
          value={data.title}
          onChange={e => onUpdate({ title: e.target.value })}
          placeholder="e.g., AI Leadership Masterclass"
          className="text-lg"
          required
        />
        <p className="text-xs text-muted-foreground">
          Choose a clear, descriptive title that captures what students will learn
        </p>
      </div>

      {/* Course Description */}
      <RichTextEditor
        label="Course Description"
        value={data.description}
        onChange={description => onUpdate({ description })}
        placeholder="Provide a comprehensive description of the course, including objectives, key topics, and expected outcomes..."
        minHeight={250}
        showPreview
        required
      />

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">
          Category
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Select value={data.category} onValueChange={category => onUpdate({ category })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {COURSE_CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          This helps students find your course in the catalog
        </p>
      </div>

      {/* Featured Image URL */}
      <div className="space-y-2">
        <Label htmlFor="image-url">Featured Image URL (Optional)</Label>
        <Input
          id="image-url"
          type="url"
          value={data.image_url || ''}
          onChange={e => onUpdate({ image_url: e.target.value })}
          placeholder="https://example.com/course-image.jpg"
        />
        <p className="text-xs text-muted-foreground">
          Provide a URL to an image that represents your course. Recommended size: 1200x630px
        </p>
        {data.image_url && (
          <div className="mt-3 border rounded-lg overflow-hidden">
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <img
              src={data.image_url}
              alt="Course preview"
              className="w-full h-48 object-cover"
              onError={e => {
                e.currentTarget.src = 'https://via.placeholder.com/1200x630?text=Invalid+Image+URL';
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
