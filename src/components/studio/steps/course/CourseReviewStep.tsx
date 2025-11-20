/**
 * CourseReviewStep Component
 * Step 7: Review and preview before publishing
 */

import React from 'react';
import { CheckCircle, Eye, AlertTriangle } from '@/components/ui/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StepComponentProps, CourseWizardData } from '@/types/studio.types';

export function CourseReviewStep({ data, mode }: StepComponentProps<CourseWizardData>) {
  // Validate completeness
  const isComplete = {
    basicInfo: !!(data.title && data.description && data.category),
    content: !!(data.features.length > 0 && data.level && data.mode && data.duration),
    audience: data.audiences.length > 0,
    pricing: !!data.price,
  };

  const allComplete = Object.values(isComplete).every(Boolean);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Eye className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Review & Publish</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review your course details before {mode === 'create' ? 'publishing' : 'updating'}
          </p>
        </div>
      </div>

      {/* Completeness Alert */}
      {!allComplete && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Some required fields are missing. Please complete all sections before publishing.
          </AlertDescription>
        </Alert>
      )}

      {allComplete && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            All required fields are complete! Review the details below and click{' '}
            {mode === 'create' ? 'Publish' : 'Update'} when ready.
          </AlertDescription>
        </Alert>
      )}

      {/* Course Preview */}
      <Card className="border-2">
        <CardHeader className="bg-muted/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge>{data.category}</Badge>
                <Badge variant="secondary">{data.level}</Badge>
                <Badge variant="outline">{data.mode}</Badge>
              </div>
              <CardTitle className="text-2xl">{data.title || 'Untitled Course'}</CardTitle>
              <CardDescription className="mt-2 text-base">
                {data.description || 'No description provided'}
              </CardDescription>
            </div>
            {data.image_url && (
              /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
              <img
                src={data.image_url}
                alt="Course"
                className="w-32 h-20 object-cover rounded-md ml-4"
                onError={e => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Course Features */}
          {data.features.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                What You'll Learn
              </h3>
              <ul className="space-y-2">
                {data.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* Course Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{data.duration || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-medium text-lg">
                {data.price || 'Not specified'}
                {data.early_bird_price && (
                  <span className="text-sm text-green-600 ml-2">
                    (Early bird: {data.early_bird_price})
                  </span>
                )}
              </p>
            </div>
            {data.start_date && (
              <div>
                <p className="text-sm text-muted-foreground">Starts</p>
                <p className="font-medium">{data.start_date}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Enrollment Status</p>
              <Badge variant={data.currently_enrolling ? 'default' : 'secondary'}>
                {data.currently_enrolling ? 'Open' : 'Closed'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Target Audience */}
          {data.audiences.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Target Audience</h3>
              <div className="flex flex-wrap gap-2">
                {data.audiences.map((audience, index) => (
                  <Badge key={index} variant="outline">
                    {audience}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Prerequisites */}
          {data.prerequisites && (
            <div>
              <h3 className="font-semibold mb-2">Prerequisites</h3>
              <p className="text-sm text-muted-foreground">{data.prerequisites}</p>
            </div>
          )}

          {/* Tags */}
          {data.tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {data.tags.map(tag => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {data.keywords.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">SEO Keywords</h3>
              <p className="text-sm text-muted-foreground">{data.keywords.join(', ')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Summaries */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Basic Information
              {isComplete.basicInfo ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Title, description, category, and image
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Content & Features
              {isComplete.content ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Features, level, mode, duration, prerequisites
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Target Audience
              {isComplete.audience ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data.audiences.length} audience{data.audiences.length !== 1 ? 's' : ''} selected
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Pricing
              {isComplete.pricing ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Price, discounts, payment options
          </CardContent>
        </Card>
      </div>

      {/* Final Instructions */}
      <Alert>
        <AlertDescription>
          {mode === 'create'
            ? 'Once published, students will be able to see and enroll in this course. You can edit it later from the admin panel.'
            : 'Your changes will be saved and visible to students immediately.'}
        </AlertDescription>
      </Alert>
    </div>
  );
}
