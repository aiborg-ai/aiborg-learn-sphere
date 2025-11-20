import React, { useState } from 'react';
import {
  Clock,
  FileJson,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useImportHistory, useImportDetails, useImportStatistics } from '@/hooks/useTemplates';
import type { ImportRecord } from '@/services/templateService';
import { templateService } from '@/services/templateService';

export function ImportHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);

  const {
    data: historyData,
    isLoading,
    refetch,
  } = useImportHistory({
    page: currentPage,
    limit: 10,
  });

  const { data: statisticsData } = useImportStatistics();
  const { data: importDetails } = useImportDetails(selectedImportId || undefined);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'destructive' | 'secondary'> = {
      completed: 'success',
      processing: 'default',
      failed: 'destructive',
      cancelled: 'secondary',
      pending: 'secondary',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const renderStatistics = () => {
    if (!statisticsData) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{statisticsData.total_imports}</div>
            <p className="text-xs text-muted-foreground">Total Imports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {statisticsData.total_items_imported}
            </div>
            <p className="text-xs text-muted-foreground">Items Imported</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {statisticsData.total_items_failed}
            </div>
            <p className="text-xs text-muted-foreground">Items Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {statisticsData.total_items_skipped}
            </div>
            <p className="text-xs text-muted-foreground">Items Skipped</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderImportTable = () => {
    if (!historyData?.imports || historyData.imports.length === 0) {
      return (
        <Card>
          <CardContent className="text-center py-8">
            <FileJson className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No import history found</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>View all previous template import operations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Success</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyData.imports.map((importRecord: ImportRecord) => (
                <TableRow key={importRecord.id}>
                  <TableCell className="text-sm">
                    {templateService.formatDate(importRecord.started_at)}
                  </TableCell>
                  <TableCell className="font-medium">{importRecord.file_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{importRecord.import_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(importRecord.status)}
                      {getStatusBadge(importRecord.status)}
                    </div>
                  </TableCell>
                  <TableCell>{importRecord.total_count}</TableCell>
                  <TableCell className="text-green-600">{importRecord.success_count}</TableCell>
                  <TableCell className="text-red-600">{importRecord.error_count}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedImportId(importRecord.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {historyData.pagination && historyData.pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {historyData.pagination.page} of {historyData.pagination.total_pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === historyData.pagination.total_pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderImportDetails = () => {
    if (!importDetails) return null;

    return (
      <Dialog open={!!selectedImportId} onOpenChange={() => setSelectedImportId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Details</DialogTitle>
            <DialogDescription>
              Detailed information about import {importDetails.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Import Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">File Name</p>
                <p className="text-sm text-muted-foreground">{importDetails.file_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Type</p>
                <p className="text-sm text-muted-foreground">{importDetails.import_type}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Started At</p>
                <p className="text-sm text-muted-foreground">
                  {templateService.formatDate(importDetails.started_at)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Completed At</p>
                <p className="text-sm text-muted-foreground">
                  {importDetails.completed_at
                    ? templateService.formatDate(importDetails.completed_at)
                    : 'In Progress'}
                </p>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-2">
              <Card>
                <CardContent className="p-3">
                  <div className="text-lg font-bold">{importDetails.total_count}</div>
                  <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-lg font-bold text-green-600">
                    {importDetails.success_count}
                  </div>
                  <p className="text-xs text-muted-foreground">Success</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-lg font-bold text-red-600">{importDetails.error_count}</div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-lg font-bold text-yellow-600">
                    {importDetails.skipped_count}
                  </div>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </CardContent>
              </Card>
            </div>

            {/* Errors */}
            {importDetails.errors && importDetails.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Errors</h4>
                <ScrollArea className="h-[200px] border rounded p-2">
                  {importDetails.errors.map(
                    (error: { message: string; field?: string }, index: number) => (
                      <div key={index} className="p-2 bg-red-50 rounded mb-2">
                        <p className="text-sm text-red-600">{error.message}</p>
                        {error.field && (
                          <p className="text-xs text-muted-foreground">Field: {error.field}</p>
                        )}
                      </div>
                    )
                  )}
                </ScrollArea>
              </div>
            )}

            {/* Options Used */}
            {importDetails.options && Object.keys(importDetails.options).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Import Options</h4>
                <div className="space-y-1">
                  {Object.entries(importDetails.options).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{key}:</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-4" />
          <p className="text-muted-foreground">Loading import history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {renderStatistics()}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Import Table */}
      {renderImportTable()}

      {/* Import Details Dialog */}
      {renderImportDetails()}
    </div>
  );
}
