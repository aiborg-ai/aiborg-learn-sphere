import React, { useState } from 'react';
import { Download, FileJson, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { logger } from '@/utils/logger';
interface ExportFilters {
  category?: string;
  is_active?: boolean;
  display?: boolean;
  date_from?: string;
  date_to?: string;
  ids?: number[];
}

interface ExportOptions {
  include_inactive?: boolean;
  include_hidden?: boolean;
  include_materials?: boolean;
  include_metadata?: boolean;
}

export function TemplateExport() {
  const { toast } = useToast();
  const [exportType, setExportType] = useState<'course' | 'event' | 'both'>('course');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState<ExportFilters>({});
  const [options, setOptions] = useState<ExportOptions>({
    include_inactive: false,
    include_hidden: false,
    include_materials: true,
    include_metadata: false,
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const { data: session } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to export templates',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-template`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session?.access_token}`,
          },
          body: JSON.stringify({
            type: exportType,
            format: exportFormat,
            filters,
            options,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Handle different response types
      if (exportFormat === 'csv') {
        // For CSV, create a download link
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_${exportType}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // For JSON, parse and download
        const result = await response.json();
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || `export_${exportType}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: 'Export Successful',
          description: `Exported ${result.count} items to ${result.filename}`,
        });
      }
    } catch (error) {
      logger.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export templates',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Templates</CardTitle>
        <CardDescription>Export existing courses and events to JSON or CSV format</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Basic Export</TabsTrigger>
            <TabsTrigger value="filtered">Filtered Export</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            {/* Export Type */}
            <div className="space-y-2">
              <Label>Export Type</Label>
              <RadioGroup
                value={exportType}
                onValueChange={value => setExportType(value as 'course' | 'event' | 'both')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="course" id="export-course" />
                  <Label htmlFor="export-course">Courses Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="event" id="export-event" />
                  <Label htmlFor="export-event">Events Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="export-both" />
                  <Label htmlFor="export-both">Both Courses and Events</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Export Format */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <RadioGroup
                value={exportFormat}
                onValueChange={value => setExportFormat(value as 'json' | 'csv')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="json" id="format-json" />
                  <Label htmlFor="format-json" className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    JSON (Recommended for re-import)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="format-csv" />
                  <Label htmlFor="format-csv" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV (For spreadsheet editing)
                  </Label>
                </div>
              </RadioGroup>
              {exportFormat === 'csv' && exportType === 'both' && (
                <p className="text-sm text-yellow-600">
                  Note: CSV export requires separate files for courses and events
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="filtered" className="space-y-4">
            {/* Category Filter */}
            {exportType !== 'event' && (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Technology"
                  value={filters.category || ''}
                  onChange={e => setFilters({ ...filters, category: e.target.value })}
                />
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-from">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.date_from || ''}
                  onChange={e => setFilters({ ...filters, date_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.date_to || ''}
                  onChange={e => setFilters({ ...filters, date_to: e.target.value })}
                />
              </div>
            </div>

            {/* Status Filters */}
            <div className="space-y-2">
              <Label>Status Filters</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active-only"
                    checked={filters.is_active === true}
                    onCheckedChange={checked =>
                      setFilters({ ...filters, is_active: checked ? true : undefined })
                    }
                  />
                  <Label htmlFor="active-only">Active items only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="display-only"
                    checked={filters.display === true}
                    onCheckedChange={checked =>
                      setFilters({ ...filters, display: checked ? true : undefined })
                    }
                  />
                  <Label htmlFor="display-only">Displayed items only</Label>
                </div>
              </div>
            </div>

            {/* Specific IDs */}
            <div className="space-y-2">
              <Label htmlFor="ids">Specific IDs (comma-separated)</Label>
              <Input
                id="ids"
                placeholder="e.g., 1,2,3"
                onChange={e => {
                  const ids = e.target.value
                    .split(',')
                    .map(id => parseInt(id.trim()))
                    .filter(id => !isNaN(id));
                  setFilters({ ...filters, ids: ids.length > 0 ? ids : undefined });
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <Label>Include Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-inactive"
                    checked={options.include_inactive}
                    onCheckedChange={checked =>
                      setOptions({ ...options, include_inactive: checked as boolean })
                    }
                  />
                  <Label htmlFor="include-inactive">Include inactive items</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-hidden"
                    checked={options.include_hidden}
                    onCheckedChange={checked =>
                      setOptions({ ...options, include_hidden: checked as boolean })
                    }
                  />
                  <Label htmlFor="include-hidden">Include hidden items</Label>
                </div>
                {exportType !== 'event' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-materials"
                      checked={options.include_materials}
                      onCheckedChange={checked =>
                        setOptions({ ...options, include_materials: checked as boolean })
                      }
                    />
                    <Label htmlFor="include-materials">Include course materials</Label>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-metadata"
                    checked={options.include_metadata}
                    onCheckedChange={checked =>
                      setOptions({ ...options, include_metadata: checked as boolean })
                    }
                  />
                  <Label htmlFor="include-metadata">Include metadata (IDs, timestamps)</Label>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Export Button */}
        <div className="mt-6 flex justify-end">
          <Button onClick={handleExport} disabled={isExporting} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export Templates'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
