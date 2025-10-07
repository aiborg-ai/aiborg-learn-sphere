import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type {
  ValidationResponse,
  ValidationError,
  ValidationWarning,
  DuplicateInfo,
} from '@/services/templateService';

interface ImportOptions {
  skip_duplicates?: boolean;
  update_existing?: boolean;
  dry_run?: boolean;
  send_notifications?: boolean;
  auto_publish?: boolean;
  [key: string]: unknown;
}

interface TemplateValidationProps {
  validationResult: ValidationResponse | null;
  onProceedToImport: (options: ImportOptions) => void;
  isImporting?: boolean;
}

export function TemplateValidation({
  validationResult,
  onProceedToImport,
  isImporting,
}: TemplateValidationProps) {
  const [importOptions, setImportOptions] = useState({
    skip_duplicates: true,
    update_existing: false,
    dry_run: false,
    send_notifications: false,
    auto_publish: false,
  });

  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());

  if (!validationResult) {
    return null;
  }

  const toggleErrorExpansion = (index: number) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedErrors(newExpanded);
  };

  const renderValidationStatus = () => {
    const { summary } = validationResult;

    if (!summary) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{summary.valid}</div>
            <p className="text-xs text-muted-foreground">Valid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{summary.invalid}</div>
            <p className="text-xs text-muted-foreground">Invalid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
            <p className="text-xs text-muted-foreground">Warnings</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderErrors = (errors: ValidationError[]) => {
    const groupedErrors: { [key: number]: ValidationError[] } = {};

    errors.forEach(error => {
      const index = error.index ?? -1;
      if (!groupedErrors[index]) {
        groupedErrors[index] = [];
      }
      groupedErrors[index].push(error);
    });

    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Validation Errors</AlertTitle>
        <AlertDescription>
          <ScrollArea className="h-[200px] mt-2">
            {Object.entries(groupedErrors).map(([index, errors]) => (
              <Collapsible
                key={index}
                open={expandedErrors.has(Number(index))}
                onOpenChange={() => toggleErrorExpansion(Number(index))}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left p-2 hover:bg-gray-50 rounded">
                  {expandedErrors.has(Number(index)) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {index === '-1' ? 'General Errors' : `Item ${Number(index) + 1}`}
                  </span>
                  <Badge variant="destructive" className="ml-auto">
                    {errors.length} errors
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 space-y-2">
                  {errors.map((error, i) => (
                    <div key={i} className="text-sm space-y-1 p-2 bg-red-50 rounded">
                      <div className="font-medium">{error.field}</div>
                      <div className="text-red-600">{error.message}</div>
                      {error.suggestion && (
                        <div className="text-xs text-gray-600 italic">💡 {error.suggestion}</div>
                      )}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </ScrollArea>
        </AlertDescription>
      </Alert>
    );
  };

  const renderWarnings = (warnings: ValidationWarning[]) => {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warnings</AlertTitle>
        <AlertDescription>
          <ScrollArea className="h-[150px] mt-2">
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <div key={index} className="text-sm p-2 bg-yellow-50 rounded">
                  <div className="font-medium">{warning.field}</div>
                  <div className="text-yellow-700">{warning.message}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </AlertDescription>
      </Alert>
    );
  };

  const renderDuplicates = (duplicates: DuplicateInfo[]) => {
    return (
      <Alert>
        <Copy className="h-4 w-4" />
        <AlertTitle>Duplicate Items Detected</AlertTitle>
        <AlertDescription>
          <ScrollArea className="h-[150px] mt-2">
            <div className="space-y-2">
              {duplicates.map((duplicate, index) => (
                <div key={index} className="text-sm p-2 bg-blue-50 rounded">
                  <div className="font-medium">{duplicate.field}</div>
                  <div>{duplicate.value}</div>
                  {duplicate.indices && (
                    <div className="text-xs text-gray-600">
                      Items: {duplicate.indices.map(i => i + 1).join(', ')}
                    </div>
                  )}
                  {duplicate.existingId && (
                    <div className="text-xs text-gray-600">
                      Exists in database (ID: {duplicate.existingId})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </AlertDescription>
      </Alert>
    );
  };

  const renderImportOptions = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Options</CardTitle>
          <CardDescription>Configure how to handle the import process</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="skip_duplicates"
              checked={importOptions.skip_duplicates}
              onCheckedChange={checked =>
                setImportOptions({ ...importOptions, skip_duplicates: checked as boolean })
              }
            />
            <Label htmlFor="skip_duplicates">
              Skip duplicate items
              <span className="text-xs text-muted-foreground ml-1">
                (Skip items that already exist)
              </span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="update_existing"
              checked={importOptions.update_existing}
              onCheckedChange={checked =>
                setImportOptions({ ...importOptions, update_existing: checked as boolean })
              }
              disabled={importOptions.skip_duplicates}
            />
            <Label htmlFor="update_existing">
              Update existing items
              <span className="text-xs text-muted-foreground ml-1">
                (Update items that already exist)
              </span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dry_run"
              checked={importOptions.dry_run}
              onCheckedChange={checked =>
                setImportOptions({ ...importOptions, dry_run: checked as boolean })
              }
            />
            <Label htmlFor="dry_run">
              Dry run
              <span className="text-xs text-muted-foreground ml-1">
                (Preview without making changes)
              </span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="send_notifications"
              checked={importOptions.send_notifications}
              onCheckedChange={checked =>
                setImportOptions({ ...importOptions, send_notifications: checked as boolean })
              }
            />
            <Label htmlFor="send_notifications">
              Send notifications
              <span className="text-xs text-muted-foreground ml-1">
                (Notify users about new items)
              </span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto_publish"
              checked={importOptions.auto_publish}
              onCheckedChange={checked =>
                setImportOptions({ ...importOptions, auto_publish: checked as boolean })
              }
            />
            <Label htmlFor="auto_publish">
              Auto-publish
              <span className="text-xs text-muted-foreground ml-1">
                (Make items immediately visible)
              </span>
            </Label>
          </div>
        </CardContent>
      </Card>
    );
  };

  const canProceed =
    validationResult.success || (validationResult.errors && validationResult.errors.length === 0);

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      {renderValidationStatus()}

      {/* Success Message */}
      {validationResult.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Validation Successful</AlertTitle>
          <AlertDescription className="text-green-700">
            All items passed validation and are ready for import.
          </AlertDescription>
        </Alert>
      )}

      {/* Errors */}
      {validationResult.errors &&
        validationResult.errors.length > 0 &&
        renderErrors(validationResult.errors)}

      {/* Warnings */}
      {validationResult.warnings &&
        validationResult.warnings.length > 0 &&
        renderWarnings(validationResult.warnings)}

      {/* Duplicates */}
      {validationResult.duplicates &&
        validationResult.duplicates.length > 0 &&
        renderDuplicates(validationResult.duplicates)}

      {/* Import Options */}
      {canProceed && renderImportOptions()}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          onClick={() => onProceedToImport(importOptions)}
          disabled={!canProceed || isImporting}
        >
          {isImporting
            ? 'Importing...'
            : importOptions.dry_run
              ? 'Run Dry Import'
              : 'Proceed with Import'}
        </Button>
      </div>
    </div>
  );
}
