import React, { useState } from 'react';
import { Link, Upload, Globe, FileJson, FileText, AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface URLImportOptions {
  skip_duplicates?: boolean;
  update_existing?: boolean;
  dry_run?: boolean;
  validate_first?: boolean;
  headers?: Record<string, string>;
}

export function URLImport({ onImportComplete }: { onImportComplete?: (result: any) => void }) {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [templateType, setTemplateType] = useState<'auto' | 'course' | 'event'>('auto');
  const [format, setFormat] = useState<'auto' | 'json' | 'csv'>('auto');
  const [isImporting, setIsImporting] = useState(false);
  const [authType, setAuthType] = useState<'none' | 'basic' | 'bearer' | 'api_key'>('none');
  const [authValue, setAuthValue] = useState('');
  const [options, setOptions] = useState<URLImportOptions>({
    skip_duplicates: true,
    update_existing: false,
    dry_run: false,
    validate_first: true
  });

  const handleImport = async () => {
    if (!url) {
      toast({
        title: 'URL Required',
        description: 'Please enter a URL to import from',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsImporting(true);

      const { data: session } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to import templates',
          variant: 'destructive'
        });
        return;
      }

      // Build headers based on auth type
      const headers: Record<string, string> = {};
      if (authType === 'bearer' && authValue) {
        headers['Authorization'] = `Bearer ${authValue}`;
      } else if (authType === 'basic' && authValue) {
        headers['Authorization'] = `Basic ${authValue}`;
      } else if (authType === 'api_key' && authValue) {
        headers['X-API-Key'] = authValue;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-from-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session?.access_token}`
          },
          body: JSON.stringify({
            url,
            type: templateType === 'auto' ? undefined : templateType,
            format: format === 'auto' ? undefined : format,
            options: {
              ...options,
              headers: Object.keys(headers).length > 0 ? headers : undefined
            }
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      if (options.dry_run) {
        toast({
          title: 'Dry Run Complete',
          description: `Found ${result.summary?.total || 0} items ready for import`
        });
      } else {
        toast({
          title: 'Import Successful',
          description: `Imported ${result.summary?.imported || 0} items from URL`
        });
      }

      if (onImportComplete) {
        onImportComplete(result);
      }

      // Clear form on success
      setUrl('');
      setAuthValue('');

    } catch (error) {
      console.error('URL import error:', error);
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import from URL',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import from URL</CardTitle>
        <CardDescription>
          Import templates directly from a URL (JSON or CSV format)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Basic Import</TabsTrigger>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="url">Template URL</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/templates.json"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Template Type */}
            <div className="space-y-2">
              <Label>Template Type</Label>
              <RadioGroup
                value={templateType}
                onValueChange={(value) => setTemplateType(value as any)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="auto" id="type-auto" />
                  <Label htmlFor="type-auto">Auto-detect</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="course" id="type-course" />
                  <Label htmlFor="type-course">Courses</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="event" id="type-event" />
                  <Label htmlFor="type-event">Events</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label>File Format</Label>
              <RadioGroup
                value={format}
                onValueChange={(value) => setFormat(value as any)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="auto" id="format-auto" />
                  <Label htmlFor="format-auto">Auto-detect from URL</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="json" id="format-json" />
                  <Label htmlFor="format-json" className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    JSON
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="format-csv" />
                  <Label htmlFor="format-csv" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Authentication</AlertTitle>
              <AlertDescription>
                If the URL requires authentication, configure it here
              </AlertDescription>
            </Alert>

            {/* Auth Type */}
            <div className="space-y-2">
              <Label>Authentication Type</Label>
              <Select
                value={authType}
                onValueChange={(value) => setAuthType(value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auth Value */}
            {authType !== 'none' && (
              <div className="space-y-2">
                <Label htmlFor="auth-value">
                  {authType === 'bearer' && 'Bearer Token'}
                  {authType === 'basic' && 'Base64 Encoded Credentials'}
                  {authType === 'api_key' && 'API Key'}
                </Label>
                <Input
                  id="auth-value"
                  type="password"
                  placeholder={
                    authType === 'basic'
                      ? 'Base64(username:password)'
                      : 'Enter authentication value'
                  }
                  value={authValue}
                  onChange={(e) => setAuthValue(e.target.value)}
                />
                {authType === 'basic' && (
                  <p className="text-xs text-muted-foreground">
                    Encode your username:password in Base64 format
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            {/* Import Options */}
            <div className="space-y-2">
              <Label>Import Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skip-duplicates"
                    checked={options.skip_duplicates}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, skip_duplicates: checked as boolean })
                    }
                  />
                  <Label htmlFor="skip-duplicates">Skip duplicate items</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="update-existing"
                    checked={options.update_existing}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, update_existing: checked as boolean })
                    }
                    disabled={options.skip_duplicates}
                  />
                  <Label htmlFor="update-existing">Update existing items</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="validate-first"
                    checked={options.validate_first}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, validate_first: checked as boolean })
                    }
                  />
                  <Label htmlFor="validate-first">Validate before importing</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dry-run"
                    checked={options.dry_run}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, dry_run: checked as boolean })
                    }
                  />
                  <Label htmlFor="dry-run">Dry run (preview without importing)</Label>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Security Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Only import templates from trusted sources. The system will validate
            all data before importing.
          </AlertDescription>
        </Alert>

        {/* Import Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleImport}
            disabled={!url || isImporting}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isImporting ? 'Importing...' : options.dry_run ? 'Preview Import' : 'Import from URL'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}