import React, { useState } from 'react';
import {
  ArrowLeft, FileJson, Upload, History, Download, Link, Calendar,
  BarChart3, Hammer, GitCompare, CheckSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemplateUpload } from '@/components/admin/TemplateUpload';
import { TemplateValidation } from '@/components/admin/TemplateValidation';
import { ImportProgress } from '@/components/admin/ImportProgress';
import { ImportHistory } from '@/components/admin/ImportHistory';
import { TemplateExport } from '@/components/admin/TemplateExport';
import { URLImport } from '@/components/admin/URLImport';
import { ScheduledImports } from '@/components/admin/ScheduledImports';
import { ImportDashboard } from '@/components/admin/ImportDashboard';
import { TemplateBuilder } from '@/components/admin/TemplateBuilder';
import { DiffViewer } from '@/components/admin/DiffViewer';
import { BulkActions } from '@/components/admin/BulkActions';
import { useValidateTemplates, useImportTemplates } from '@/hooks/useTemplates';
import { ValidationResponse, ImportResponse } from '@/services/templateService';

export function TemplateImport() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [templateType, setTemplateType] = useState<'course' | 'event'>('course');
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);

  const validateMutation = useValidateTemplates();
  const importMutation = useImportTemplates();

  const handleFileUpload = async (data: any, type: 'course' | 'event') => {
    setUploadedData(data);
    setTemplateType(type);

    // Automatically validate after upload
    const result = await validateMutation.mutateAsync({
      type,
      data: type === 'course' ? data.courses : data.events,
      options: {
        checkDuplicates: true,
        validateDependencies: true,
        batchMode: true,
      },
    });

    setValidationResult(result);
    setActiveTab('validate');
  };

  const handleProceedToImport = async (options: any) => {
    if (!uploadedData || !templateType) return;

    const result = await importMutation.mutateAsync({
      type: templateType,
      data: templateType === 'course' ? uploadedData.courses : uploadedData.events,
      options: {
        ...options,
        validate_first: false, // Already validated
      },
    });

    setImportResult(result);
    setActiveTab('progress');
  };

  const handleReset = () => {
    setUploadedData(null);
    setValidationResult(null);
    setImportResult(null);
    setActiveTab('upload');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Template Management System</h1>
            <p className="text-muted-foreground mt-1">
              Import, export, and manage course and event templates
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="space-y-2">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Hammer className="h-4 w-4" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="url-import" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              URL Import
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="bulk-actions" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Bulk Actions
            </TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger
              value="validate"
              disabled={!validationResult}
              className="flex items-center gap-2"
            >
              <FileJson className="h-4 w-4" />
              Validate
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              disabled={!importResult}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="diff" className="flex items-center gap-2">
              <GitCompare className="h-4 w-4" />
              Changes
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="space-y-4">
          <ImportDashboard />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <TemplateUpload
            onFileUpload={handleFileUpload}
            isLoading={validateMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="builder" className="space-y-4">
          <TemplateBuilder />
        </TabsContent>

        <TabsContent value="url-import" className="space-y-4">
          <URLImport
            onImportComplete={(result) => {
              setImportResult(result);
              setActiveTab('progress');
            }}
          />
        </TabsContent>

        <TabsContent value="validate" className="space-y-4">
          {validationResult && (
            <>
              <TemplateValidation
                validationResult={validationResult}
                onProceedToImport={handleProceedToImport}
                isImporting={importMutation.isPending}
              />
              {!importMutation.isPending && !importResult && (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={handleReset}>
                    Upload Another File
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <ImportProgress
            importResponse={importResult}
            isImporting={importMutation.isPending}
          />
          {importResult && !importMutation.isPending && (
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={handleReset}>
                Import Another File
              </Button>
              <Button onClick={() => setActiveTab('history')}>
                View Import History
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <TemplateExport />
        </TabsContent>

        <TabsContent value="bulk-actions" className="space-y-4">
          <BulkActions />
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <ScheduledImports />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ImportHistory />
        </TabsContent>

        <TabsContent value="diff" className="space-y-4">
          {validationResult && uploadedData && (
            <DiffViewer
              originalData={{}}
              updatedData={uploadedData.courses?.[0] || uploadedData.events?.[0] || {}}
              type={templateType}
              mode="preview"
            />
          )}
          {!validationResult && (
            <div className="text-center py-12 text-muted-foreground">
              <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Upload and validate a template to view changes</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}