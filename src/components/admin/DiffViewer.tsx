import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Info,
  ArrowRight,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface DiffItem {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  category: 'required' | 'optional' | 'metadata';
}

interface DiffViewerProps {
  originalData: Record<string, unknown>;
  updatedData: Record<string, unknown>;
  type: 'course' | 'event';
  onApprove?: (changes: DiffItem[]) => void;
  onReject?: () => void;
  mode?: 'review' | 'preview';
}

const FIELD_LABELS: { [key: string]: string } = {
  // Course fields
  title: 'Course Title',
  description: 'Description',
  audiences: 'Target Audiences',
  mode: 'Course Mode',
  duration: 'Duration',
  price: 'Price',
  level: 'Difficulty Level',
  start_date: 'Start Date',
  features: 'Features',
  keywords: 'Keywords',
  category: 'Category',
  instructor_info: 'Instructor Info',
  course_materials: 'Course Materials',
  is_featured: 'Featured',
  is_active: 'Active',
  display: 'Display',

  // Event fields
  name: 'Event Name',
  event_type: 'Event Type',
  date: 'Event Date',
  time: 'Start Time',
  location: 'Location',
  venue: 'Venue',
  max_attendees: 'Max Attendees',
  registration_deadline: 'Registration Deadline',
  organizer: 'Organizer',
  agenda: 'Agenda',
  speakers: 'Speakers',
  sponsors: 'Sponsors',
  tags: 'Tags',
  requirements: 'Requirements',
  contact_info: 'Contact Information',

  // Common metadata
  created_at: 'Created At',
  updated_at: 'Updated At',
  id: 'ID',
};

const FIELD_CATEGORIES: { [key: string]: 'required' | 'optional' | 'metadata' } = {
  // Required fields
  title: 'required',
  name: 'required',
  description: 'required',
  audiences: 'required',
  mode: 'required',
  duration: 'required',
  price: 'required',
  level: 'required',
  start_date: 'required',
  features: 'required',
  keywords: 'required',
  category: 'required',
  event_type: 'required',
  date: 'required',

  // Optional fields
  instructor_info: 'optional',
  course_materials: 'optional',
  time: 'optional',
  location: 'optional',
  venue: 'optional',
  max_attendees: 'optional',
  registration_deadline: 'optional',
  organizer: 'optional',
  agenda: 'optional',
  speakers: 'optional',
  sponsors: 'optional',
  tags: 'optional',
  requirements: 'optional',
  contact_info: 'optional',
  is_featured: 'optional',
  is_active: 'optional',
  display: 'optional',

  // Metadata
  id: 'metadata',
  created_at: 'metadata',
  updated_at: 'metadata',
};

export function DiffViewer({
  originalData,
  updatedData,
  type,
  onApprove,
  onReject,
  mode = 'preview',
}: DiffViewerProps) {
  const [diffs, setDiffs] = useState<DiffItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState({
    required: true,
    optional: true,
    metadata: false,
  });
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());

  useEffect(() => {
    calculateDiffs();
  }, [originalData, updatedData, showUnchanged]);

  const calculateDiffs = () => {
    const diffItems: DiffItem[] = [];
    const allKeys = new Set([
      ...Object.keys(originalData || {}),
      ...Object.keys(updatedData || {}),
    ]);

    allKeys.forEach(key => {
      const oldVal = originalData?.[key];
      const newVal = updatedData?.[key];
      const label = FIELD_LABELS[key] || key;
      const category = FIELD_CATEGORIES[key] || 'optional';

      let diffType: DiffItem['type'] = 'unchanged';

      if (oldVal === undefined && newVal !== undefined) {
        diffType = 'added';
      } else if (oldVal !== undefined && newVal === undefined) {
        diffType = 'removed';
      } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diffType = 'modified';
      }

      if (diffType !== 'unchanged' || showUnchanged) {
        diffItems.push({
          field: key,
          label,
          oldValue: oldVal,
          newValue: newVal,
          type: diffType,
          category,
        });

        // Auto-select changes in review mode
        if (mode === 'review' && diffType !== 'unchanged') {
          selectedChanges.add(key);
        }
      }
    });

    setDiffs(diffItems);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const toggleChangeSelection = (field: string) => {
    const newSelected = new Set(selectedChanges);
    if (newSelected.has(field)) {
      newSelected.delete(field);
    } else {
      newSelected.add(field);
    }
    setSelectedChanges(newSelected);
  };

  const handleApprove = () => {
    if (onApprove) {
      const approvedChanges = diffs.filter(d => selectedChanges.has(d.field));
      onApprove(approvedChanges);
    }
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'Not set';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'Empty';
      return value.join(', ');
    }
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getDiffIcon = (type: DiffItem['type']) => {
    switch (type) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'removed':
        return <Minus className="h-4 w-4 text-red-500" />;
      case 'modified':
        return <RefreshCw className="h-4 w-4 text-yellow-500" />;
      default:
        return <Check className="h-4 w-4 text-gray-400" />;
    }
  };

  const getDiffBadge = (type: DiffItem['type']) => {
    switch (type) {
      case 'added':
        return <Badge className="bg-green-100 text-green-800">Added</Badge>;
      case 'removed':
        return <Badge className="bg-red-100 text-red-800">Removed</Badge>;
      case 'modified':
        return <Badge className="bg-yellow-100 text-yellow-800">Modified</Badge>;
      default:
        return <Badge variant="secondary">Unchanged</Badge>;
    }
  };

  const getCategoryDiffs = (category: 'required' | 'optional' | 'metadata') => {
    return diffs.filter(d => d.category === category);
  };

  const getCategoryCounts = (category: 'required' | 'optional' | 'metadata') => {
    const categoryDiffs = getCategoryDiffs(category);
    return {
      total: categoryDiffs.length,
      added: categoryDiffs.filter(d => d.type === 'added').length,
      removed: categoryDiffs.filter(d => d.type === 'removed').length,
      modified: categoryDiffs.filter(d => d.type === 'modified').length,
      unchanged: categoryDiffs.filter(d => d.type === 'unchanged').length,
    };
  };

  const renderSideBySideView = (diff: DiffItem) => (
    <div key={diff.field} className="grid grid-cols-12 gap-4 p-3 hover:bg-muted/50 rounded-lg">
      {mode === 'review' && diff.type !== 'unchanged' && (
        <div className="col-span-1 flex items-center">
          <input
            type="checkbox"
            checked={selectedChanges.has(diff.field)}
            onChange={() => toggleChangeSelection(diff.field)}
            className="h-4 w-4"
          />
        </div>
      )}
      <div
        className={cn(
          'col-span-2 font-medium flex items-center gap-2',
          mode === 'review' ? '' : 'col-span-3'
        )}
      >
        {getDiffIcon(diff.type)}
        {diff.label}
      </div>
      <div className="col-span-4 space-y-1">
        <div className="text-sm text-muted-foreground">Original</div>
        <div
          className={cn(
            'p-2 rounded-md text-sm font-mono',
            diff.type === 'removed' ? 'bg-red-50 text-red-900' : 'bg-muted'
          )}
        >
          {formatValue(diff.oldValue)}
        </div>
      </div>
      <div className="col-span-1 flex items-center justify-center">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="col-span-4 space-y-1">
        <div className="text-sm text-muted-foreground">Updated</div>
        <div
          className={cn(
            'p-2 rounded-md text-sm font-mono',
            diff.type === 'added'
              ? 'bg-green-50 text-green-900'
              : diff.type === 'modified'
                ? 'bg-yellow-50 text-yellow-900'
                : 'bg-muted'
          )}
        >
          {formatValue(diff.newValue)}
        </div>
      </div>
    </div>
  );

  const renderUnifiedView = (diff: DiffItem) => (
    <div key={diff.field} className="space-y-2 p-3 hover:bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mode === 'review' && diff.type !== 'unchanged' && (
            <input
              type="checkbox"
              checked={selectedChanges.has(diff.field)}
              onChange={() => toggleChangeSelection(diff.field)}
              className="h-4 w-4"
            />
          )}
          <span className="font-medium">{diff.label}</span>
          {getDiffBadge(diff.type)}
        </div>
      </div>

      {diff.type === 'removed' && (
        <div className="pl-6 p-2 bg-red-50 rounded-md text-sm">
          <span className="text-red-600">- </span>
          <span className="font-mono text-red-900">{formatValue(diff.oldValue)}</span>
        </div>
      )}

      {diff.type === 'added' && (
        <div className="pl-6 p-2 bg-green-50 rounded-md text-sm">
          <span className="text-green-600">+ </span>
          <span className="font-mono text-green-900">{formatValue(diff.newValue)}</span>
        </div>
      )}

      {diff.type === 'modified' && (
        <>
          <div className="pl-6 p-2 bg-red-50 rounded-md text-sm">
            <span className="text-red-600">- </span>
            <span className="font-mono text-red-900">{formatValue(diff.oldValue)}</span>
          </div>
          <div className="pl-6 p-2 bg-green-50 rounded-md text-sm">
            <span className="text-green-600">+ </span>
            <span className="font-mono text-green-900">{formatValue(diff.newValue)}</span>
          </div>
        </>
      )}

      {diff.type === 'unchanged' && (
        <div className="pl-6 p-2 bg-muted rounded-md text-sm">
          <span className="font-mono">{formatValue(diff.newValue)}</span>
        </div>
      )}
    </div>
  );

  const renderCategorySection = (
    category: 'required' | 'optional' | 'metadata',
    title: string,
    description: string
  ) => {
    const categoryDiffs = getCategoryDiffs(category);
    const counts = getCategoryCounts(category);

    if (categoryDiffs.length === 0) return null;

    return (
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleCategory(category)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {expandedCategories[category] ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
              <CardTitle>{title}</CardTitle>
            </div>
            <div className="flex gap-2">
              {counts.added > 0 && (
                <Badge className="bg-green-100 text-green-800">{counts.added} added</Badge>
              )}
              {counts.modified > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800">{counts.modified} modified</Badge>
              )}
              {counts.removed > 0 && (
                <Badge className="bg-red-100 text-red-800">{counts.removed} removed</Badge>
              )}
              {showUnchanged && counts.unchanged > 0 && (
                <Badge variant="secondary">{counts.unchanged} unchanged</Badge>
              )}
            </div>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {expandedCategories[category] && (
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {categoryDiffs.map(diff =>
                  viewMode === 'side-by-side' ? renderSideBySideView(diff) : renderUnifiedView(diff)
                )}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>
    );
  };

  const totalChanges = diffs.filter(d => d.type !== 'unchanged').length;
  const selectedCount = selectedChanges.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">
            {mode === 'review' ? 'Review Changes' : 'Preview Changes'}
          </h3>
          <p className="text-muted-foreground mt-1">
            {totalChanges} change{totalChanges !== 1 ? 's' : ''} detected in {type} template
          </p>
        </div>

        {mode === 'review' && (
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {selectedCount}/{totalChanges} selected
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelectedChanges(
                  new Set(diffs.filter(d => d.type !== 'unchanged').map(d => d.field))
                )
              }
            >
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedChanges(new Set())}>
              Clear Selection
            </Button>
          </div>
        )}
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Tabs
                value={viewMode}
                onValueChange={v => setViewMode(v as 'side-by-side' | 'unified')}
              >
                <TabsList>
                  <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
                  <TabsTrigger value="unified">Unified</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show-unchanged"
                  checked={showUnchanged}
                  onCheckedChange={setShowUnchanged}
                />
                <Label htmlFor="show-unchanged">Show unchanged fields</Label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Info className="h-4 w-4" />
                      <span>Legend:</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Added</Badge>
                        <span>New fields</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-100 text-yellow-800">Modified</Badge>
                        <span>Changed values</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-800">Removed</Badge>
                        <span>Deleted fields</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diff Sections */}
      <div className="space-y-4">
        {renderCategorySection(
          'required',
          'Required Fields',
          'Core fields that define the template'
        )}
        {renderCategorySection(
          'optional',
          'Optional Fields',
          'Additional fields that enhance the template'
        )}
        {renderCategorySection('metadata', 'Metadata', 'System-generated fields and timestamps')}
      </div>

      {/* Action Buttons */}
      {mode === 'review' && (onApprove || onReject) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Alert className="flex-1 mr-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Review Required</AlertTitle>
                <AlertDescription>
                  Please review the changes above and select which ones to apply.
                  {selectedCount === 0 && ' No changes are currently selected.'}
                  {selectedCount > 0 &&
                    ` ${selectedCount} change${selectedCount !== 1 ? 's' : ''} will be applied.`}
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                {onReject && (
                  <Button variant="outline" onClick={onReject}>
                    <X className="h-4 w-4 mr-2" />
                    Reject All
                  </Button>
                )}
                {onApprove && (
                  <Button onClick={handleApprove} disabled={selectedCount === 0}>
                    <Check className="h-4 w-4 mr-2" />
                    Apply {selectedCount > 0 ? `${selectedCount} ` : ''}Change
                    {selectedCount !== 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Add missing icon imports at the top
const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const Minus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);
