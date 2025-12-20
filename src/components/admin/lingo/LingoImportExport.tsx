/**
 * LingoImportExport Component
 *
 * UI for importing and exporting AIBORGLingo lessons in JSON format.
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Icon } from '@/utils/iconLoader';
import { useToast } from '@/hooks/use-toast';
import { LingoImportExportService } from '@/services/lingo/LingoImportExportService';
import type {
  LingoExportFile,
  LingoImportMode,
  LingoImportValidation,
  LingoImportResult,
} from '@/types/lingo-import-export.types';

interface LingoImportExportProps {
  onImportComplete?: () => void;
}

export function LingoImportExport({ onImportComplete }: LingoImportExportProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<LingoExportFile | null>(null);
  const [validation, setValidation] = useState<LingoImportValidation | null>(null);
  const [importMode, setImportMode] = useState<LingoImportMode>('create_only');
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<LingoImportResult | null>(null);

  // Handle export
  async function handleExport() {
    setIsExporting(true);
    try {
      const data = await LingoImportExportService.exportLessons({
        include_inactive: includeInactive,
      });

      LingoImportExportService.downloadAsFile(data);

      toast({
        title: 'Export Complete',
        description: `Exported ${data.lessons.length} lessons with their questions`,
      });
    } catch {
      toast({
        title: 'Export Failed',
        description: 'Failed to export lessons. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }

  // Handle file selection
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setImportFile(file);
    setImportData(null);
    setValidation(null);
    setImportResult(null);

    // Parse and validate file
    setIsValidating(true);
    try {
      const data = await LingoImportExportService.parseFile(file);
      setImportData(data);

      const validationResult = await LingoImportExportService.validateImport(data);
      setValidation(validationResult);

      if (!validationResult.is_valid) {
        toast({
          title: 'Validation Issues Found',
          description: 'Please review the validation results before importing.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Invalid File',
        description: error instanceof Error ? error.message : 'Failed to parse file',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  }

  // Handle import
  async function handleImport() {
    if (!importData) return;

    setIsImporting(true);
    try {
      const result = await LingoImportExportService.importLessons(importData, {
        mode: importMode,
      });

      setImportResult(result);

      if (result.success) {
        toast({
          title: 'Import Complete',
          description: `Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`,
        });
        onImportComplete?.();
      } else {
        toast({
          title: 'Import Completed with Errors',
          description: `${result.failed} lessons failed to import`,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Import Failed',
        description: 'An unexpected error occurred during import.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  }

  // Reset import state
  function resetImport() {
    setImportFile(null);
    setImportData(null);
    setValidation(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import / Export Lessons</CardTitle>
        <CardDescription>
          Export lessons to JSON for backup or import lessons from a JSON file
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export" className="space-y-4">
          <TabsList>
            <TabsTrigger value="export">
              <Icon name="Download" className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import">
              <Icon name="Upload" className="h-4 w-4 mr-2" />
              Import
            </TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeInactive"
                  checked={includeInactive}
                  onCheckedChange={checked => setIncludeInactive(checked === true)}
                />
                <Label htmlFor="includeInactive">Include inactive lessons</Label>
              </div>

              <Alert>
                <Icon name="Info" className="h-4 w-4" />
                <AlertTitle>Export Format</AlertTitle>
                <AlertDescription>
                  Lessons will be exported as a JSON file including all questions and their
                  configurations. The file can be used for backup or to import into another
                  environment.
                </AlertDescription>
              </Alert>

              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Icon name="Download" className="h-4 w-4 mr-2" />
                    Export All Lessons
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            {/* File Upload */}
            {!importFile && (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Icon name="FileJson" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Drop a JSON file here or click to browse
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Icon name="Upload" className="h-4 w-4 mr-2" />
                  Select File
                </Button>
              </div>
            )}

            {/* Loading */}
            {isValidating && (
              <div className="flex items-center justify-center py-8">
                <Icon name="Loader2" className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2">Validating file...</span>
              </div>
            )}

            {/* Validation Results */}
            {validation && !importResult && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">{validation.total_lessons}</p>
                    <p className="text-sm text-muted-foreground">Total Lessons</p>
                  </div>
                  <div className="bg-green-100 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">{validation.new_lessons}</p>
                    <p className="text-sm text-green-600">New</p>
                  </div>
                  <div className="bg-blue-100 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-700">
                      {validation.existing_lessons}
                    </p>
                    <p className="text-sm text-blue-600">Existing</p>
                  </div>
                  <div
                    className={`rounded-lg p-4 text-center ${validation.is_valid ? 'bg-green-100' : 'bg-red-100'}`}
                  >
                    <p className="text-2xl font-bold">
                      {validation.is_valid ? (
                        <Icon name="Check" className="h-6 w-6 mx-auto text-green-700" />
                      ) : (
                        <Icon name="X" className="h-6 w-6 mx-auto text-red-700" />
                      )}
                    </p>
                    <p className="text-sm">{validation.is_valid ? 'Valid' : 'Has Errors'}</p>
                  </div>
                </div>

                {/* Global Errors */}
                {validation.global_errors.length > 0 && (
                  <Alert variant="destructive">
                    <Icon name="AlertTriangle" className="h-4 w-4" />
                    <AlertTitle>Validation Errors</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside mt-2">
                        {validation.global_errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Lesson Details */}
                <div className="space-y-2">
                  <h4 className="font-medium">Lessons in Import</h4>
                  <ScrollArea className="h-[200px] border rounded-lg">
                    <div className="p-4 space-y-2">
                      {validation.lessons.map(lesson => (
                        <div
                          key={lesson.lesson_id}
                          className={`flex items-center justify-between p-2 rounded ${
                            lesson.is_valid ? 'bg-muted/50' : 'bg-red-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {lesson.is_valid ? (
                              <Icon name="Check" className="h-4 w-4 text-green-600" />
                            ) : (
                              <Icon name="X" className="h-4 w-4 text-red-600" />
                            )}
                            <span className="font-medium">{lesson.title}</span>
                            <Badge variant="outline">{lesson.question_count} questions</Badge>
                            {lesson.exists && <Badge variant="secondary">Exists</Badge>}
                          </div>
                          {lesson.errors.length > 0 && (
                            <span className="text-xs text-red-600">
                              {lesson.errors.length} error(s)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Import Mode Selection */}
                {validation.is_valid && (
                  <>
                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium">Import Mode</h4>
                      <RadioGroup
                        value={importMode}
                        onValueChange={v => setImportMode(v as LingoImportMode)}
                      >
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="create_only" id="create_only" />
                          <div>
                            <Label htmlFor="create_only">Create only</Label>
                            <p className="text-sm text-muted-foreground">
                              Only import new lessons. Skip lessons that already exist.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="update_existing" id="update_existing" />
                          <div>
                            <Label htmlFor="update_existing">Update existing</Label>
                            <p className="text-sm text-muted-foreground">
                              Create new lessons and update existing ones. Questions will be
                              replaced.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="replace_all" id="replace_all" />
                          <div>
                            <Label htmlFor="replace_all" className="text-destructive">
                              Replace all
                            </Label>
                            <p className="text-sm text-destructive">
                              Delete ALL existing lessons and replace with imported data. Use with
                              caution!
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleImport} disabled={isImporting}>
                        {isImporting ? (
                          <>
                            <Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Icon name="Upload" className="h-4 w-4 mr-2" />
                            Import Lessons
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={resetImport}>
                        Cancel
                      </Button>
                    </div>
                  </>
                )}

                {/* Invalid - show reset button */}
                {!validation.is_valid && (
                  <Button variant="outline" onClick={resetImport}>
                    <Icon name="RotateCcw" className="h-4 w-4 mr-2" />
                    Try Different File
                  </Button>
                )}
              </div>
            )}

            {/* Import Results */}
            {importResult && (
              <div className="space-y-4">
                <Alert variant={importResult.success ? 'default' : 'destructive'}>
                  <Icon
                    name={importResult.success ? 'CheckCircle' : 'AlertTriangle'}
                    className="h-4 w-4"
                  />
                  <AlertTitle>
                    {importResult.success ? 'Import Successful' : 'Import Completed with Issues'}
                  </AlertTitle>
                  <AlertDescription>
                    <div className="flex gap-4 mt-2">
                      <span className="text-green-600">Created: {importResult.created}</span>
                      <span className="text-blue-600">Updated: {importResult.updated}</span>
                      <span className="text-muted-foreground">Skipped: {importResult.skipped}</span>
                      {importResult.failed > 0 && (
                        <span className="text-red-600">Failed: {importResult.failed}</span>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Results Details */}
                <ScrollArea className="h-[200px] border rounded-lg">
                  <div className="p-4 space-y-2">
                    {importResult.lessons.map(lesson => (
                      <div
                        key={lesson.lesson_id}
                        className={`flex items-center justify-between p-2 rounded ${
                          lesson.status === 'failed'
                            ? 'bg-red-50'
                            : lesson.status === 'created'
                              ? 'bg-green-50'
                              : lesson.status === 'updated'
                                ? 'bg-blue-50'
                                : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              lesson.status === 'created'
                                ? 'default'
                                : lesson.status === 'updated'
                                  ? 'secondary'
                                  : lesson.status === 'failed'
                                    ? 'destructive'
                                    : 'outline'
                            }
                          >
                            {lesson.status}
                          </Badge>
                          <span className="font-medium">{lesson.title}</span>
                          {lesson.questions_created > 0 && (
                            <span className="text-sm text-muted-foreground">
                              ({lesson.questions_created} questions)
                            </span>
                          )}
                        </div>
                        {lesson.error && (
                          <span className="text-xs text-red-600">{lesson.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Button onClick={resetImport}>
                  <Icon name="RotateCcw" className="h-4 w-4 mr-2" />
                  Import Another File
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
