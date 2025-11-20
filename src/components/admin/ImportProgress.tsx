import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  SkipForward,
  RefreshCw,
} from '@/components/ui/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ImportResponse, ImportResult } from '@/services/templateService';

interface ImportProgressProps {
  importResponse: ImportResponse | null;
  isImporting: boolean;
}

export function ImportProgress({ importResponse, isImporting }: ImportProgressProps) {
  if (!importResponse && !isImporting) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'imported':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case 'skipped':
        return <SkipForward className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'destructive' | 'secondary'> = {
      imported: 'success',
      updated: 'default',
      skipped: 'secondary',
      failed: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const calculateProgress = () => {
    if (!importResponse?.summary) return 0;
    const { total, imported, updated, skipped, failed } = importResponse.summary;
    const processed = imported + updated + skipped + failed;
    return total > 0 ? (processed / total) * 100 : 0;
  };

  const renderSummaryCards = () => {
    if (!importResponse?.summary) return null;
    const { total, imported, updated, skipped, failed } = importResponse.summary;

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xl font-bold text-green-600">{imported}</div>
            <p className="text-xs text-muted-foreground">Imported</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xl font-bold text-blue-600">{updated}</div>
            <p className="text-xs text-muted-foreground">Updated</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xl font-bold text-yellow-600">{skipped}</div>
            <p className="text-xs text-muted-foreground">Skipped</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xl font-bold text-red-600">{failed}</div>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderResults = (results: ImportResult[]) => {
    // Group results by status for better organization
    const groupedResults = results.reduce(
      (acc, result) => {
        if (!acc[result.status]) {
          acc[result.status] = [];
        }
        acc[result.status].push(result);
        return acc;
      },
      {} as Record<string, ImportResult[]>
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Results</CardTitle>
          <CardDescription>Detailed status of each imported item</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {Object.entries(groupedResults).map(([status, items]) => (
                <div key={status} className="space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    {getStatusIcon(status)}
                    <span className="capitalize">{status}</span>
                    <Badge variant="outline" className="ml-auto">
                      {items.length}
                    </Badge>
                  </div>
                  <div className="pl-6 space-y-2">
                    {items.map((result, index) => (
                      <div
                        key={`${result.id}-${index}`}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{result.title}</div>
                          {result.message && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {result.message}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {result.index !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              #{result.index + 1}
                            </span>
                          )}
                          {getStatusBadge(result.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  const renderErrors = () => {
    if (!importResponse?.errors || importResponse.errors.length === 0) return null;

    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Import Errors</CardTitle>
          <CardDescription>Issues encountered during the import process</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {importResponse.errors.map((error, index) => (
                <div key={index} className="p-2 bg-red-50 rounded">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      {error.index !== undefined && (
                        <span className="text-xs font-medium">Item #{error.index + 1}: </span>
                      )}
                      <span className="text-sm">{error.message}</span>
                      {error.field && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Field: {error.field}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      {isImporting && (
        <Card>
          <CardHeader>
            <CardTitle>Import Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={calculateProgress()} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">Processing items...</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {importResponse && renderSummaryCards()}

      {/* Import ID */}
      {importResponse?.import_id && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Import ID:</span>
          <code className="bg-gray-100 px-2 py-1 rounded">{importResponse.import_id}</code>
        </div>
      )}

      {/* Results */}
      {importResponse?.results &&
        importResponse.results.length > 0 &&
        renderResults(importResponse.results)}

      {/* Errors */}
      {renderErrors()}
    </div>
  );
}
