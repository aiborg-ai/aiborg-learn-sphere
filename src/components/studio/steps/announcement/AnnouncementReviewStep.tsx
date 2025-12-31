/**
 * AnnouncementReviewStep Component
 * Step 4: Review and preview the announcement before publishing
 */

import React from 'react';
import { CheckCircle, Eye, AlertTriangle, Bell } from '@/components/ui/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DOMPurify from 'isomorphic-dompurify';
import { format } from 'date-fns';
import type { StepComponentProps, AnnouncementWizardData } from '@/types/studio.types';

const PRIORITY_LABELS = [
  { value: 1, label: 'Low', color: 'bg-gray-500', icon: '📌' },
  { value: 2, label: 'Normal', color: 'bg-blue-500', icon: '📋' },
  { value: 3, label: 'High', color: 'bg-yellow-500', icon: '⚠️' },
  { value: 4, label: 'Urgent', color: 'bg-orange-500', icon: '🔔' },
  { value: 5, label: 'Critical', color: 'bg-red-500', icon: '🚨' },
];

export function AnnouncementReviewStep({ data, mode }: StepComponentProps<AnnouncementWizardData>) {
  // Validate completeness
  const isComplete = {
    basicInfo: !!(data.title && data.content),
    audience: !!data.target_audience,
    scheduling: true, // Optional fields
  };

  const allComplete = Object.values(isComplete).every(Boolean);

  const currentPriority =
    PRIORITY_LABELS.find(p => p.value === data.priority) || PRIORITY_LABELS[1];

  // Simple markdown-to-HTML converter (basic) with XSS protection
  const renderMarkdown = (text: string) => {
    if (!text) return '<p class="text-muted-foreground">No content</p>';

    const html = text
      .split('\n\n')
      .map(paragraph => {
        let converted = paragraph;

        // Headers
        converted = converted.replace(
          /^### (.+)$/gm,
          '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>'
        );
        converted = converted.replace(
          /^## (.+)$/gm,
          '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>'
        );
        converted = converted.replace(
          /^# (.+)$/gm,
          '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>'
        );

        // Bold and italic
        converted = converted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        converted = converted.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Links
        converted = converted.replace(
          /\[(.+?)\]\((.+?)\)/g,
          '<a href="$2" class="text-primary underline">$1</a>'
        );

        // Code
        converted = converted.replace(
          /`(.+?)`/g,
          '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>'
        );

        // Lists
        if (converted.startsWith('- ')) {
          converted =
            '<ul class="list-disc list-inside">' +
            converted.replace(/^- (.+)$/gm, '<li>$1</li>') +
            '</ul>';
        } else if (converted.match(/^\d+\. /)) {
          converted =
            '<ol class="list-decimal list-inside">' +
            converted.replace(/^\d+\. (.+)$/gm, '<li>$1</li>') +
            '</ol>';
        } else {
          converted = `<p>${converted}</p>`;
        }

        return converted;
      })
      .join('');

    // Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'a', 'code', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'class'],
      ALLOW_DATA_ATTR: false,
      ALLOWED_URI_REGEXP: /^(?:https?:)/i,
    });
  };

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
            Preview your announcement before {mode === 'create' ? 'publishing' : 'updating'}
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
            All required fields are complete! Review the preview below and click{' '}
            {mode === 'create' ? 'Publish' : 'Update'} when ready.
          </AlertDescription>
        </Alert>
      )}

      {/* Announcement Preview Banner */}
      <div className="space-y-2">
        <div className="text-sm font-medium flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Preview - How users will see this announcement:
        </div>
        <Card className={`border-l-4 ${currentPriority.color.replace('bg-', 'border-l-')}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${currentPriority.color} text-white`}>
                    {currentPriority.icon} {currentPriority.label}
                  </Badge>
                  {data.target_audience && (
                    <Badge variant="outline">
                      For: {data.target_audience === 'all' ? 'All Users' : data.target_audience}
                    </Badge>
                  )}
                  {data.is_active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{data.title || 'Untitled Announcement'}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(data.content) }}
            />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Details Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
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
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Title</p>
              <p className="font-medium">{data.title || 'Not set'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Content Length</p>
              <p className="font-medium">{data.content.length} characters</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Audience & Priority
              {isComplete.audience ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Target Audience</p>
              <p className="font-medium capitalize">{data.target_audience || 'Not set'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Priority</p>
              <Badge className={`${currentPriority.color} text-white`}>
                {currentPriority.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Scheduling
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant={data.is_active ? 'default' : 'secondary'}>
                {data.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {data.schedule?.startDate && (
              <div>
                <p className="text-muted-foreground">Start Date</p>
                <p className="font-medium">{format(data.schedule.startDate, 'PPP')}</p>
              </div>
            )}
            {data.schedule?.endDate && (
              <div>
                <p className="text-muted-foreground">End Date</p>
                <p className="font-medium">{format(data.schedule.endDate, 'PPP')}</p>
              </div>
            )}
            {!data.schedule?.startDate && !data.schedule?.endDate && (
              <p className="text-muted-foreground">No schedule set (immediate & permanent)</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Final Instructions */}
      <Alert>
        <AlertDescription>
          {mode === 'create'
            ? 'Once published, this announcement will be visible to the selected audience according to the schedule you configured. You can edit or deactivate it later from the admin panel.'
            : 'Your changes will be saved and visible to users immediately based on the active status and schedule.'}
        </AlertDescription>
      </Alert>
    </div>
  );
}
