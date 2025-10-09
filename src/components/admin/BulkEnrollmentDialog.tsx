import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
  Users,
  Loader2,
  X,
} from 'lucide-react';
import {
  parseCSV,
  generateBulkEnrollmentTemplate,
  generateErrorReportCSV,
  type BulkEnrollmentRow,
  type CSVRowError,
} from '@/utils/csvParser';
import { useBulkEnrollment, type EnrollmentResult } from '@/hooks/useBulkEnrollment';
import { useToast } from '@/components/ui/use-toast';

interface BulkEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'preview' | 'processing' | 'results';

export function BulkEnrollmentDialog({ open, onOpenChange, onSuccess }: BulkEnrollmentDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [validData, setValidData] = useState<BulkEnrollmentRow[]>([]);
  const [parseErrors, setParseErrors] = useState<CSVRowError[]>([]);
  const [results, setResults] = useState<EnrollmentResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isProcessing, progress, processEnrollments, resetProgress } = useBulkEnrollment();
  const { toast } = useToast();

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const parseResult = parseCSV(text);

      if (parseResult.validRows > 0) {
        setValidData(parseResult.data);
        setParseErrors(parseResult.errors);
        setStep('preview');
      } else {
        setParseErrors(parseResult.errors);
        toast({
          title: 'Validation failed',
          description: `Found ${parseResult.errors.length} errors. Please fix and try again.`,
          variant: 'destructive',
        });
      }
    };

    reader.readAsText(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleProcess = async () => {
    setStep('processing');
    try {
      const enrollmentResults = await processEnrollments(validData);
      setResults(enrollmentResults);
      setStep('results');

      const successCount = enrollmentResults.filter(r => r.success).length;
      if (successCount > 0) {
        onSuccess();
        toast({
          title: 'Bulk enrollment completed',
          description: `Successfully enrolled ${successCount} out of ${enrollmentResults.length} students.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Processing failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      setStep('preview');
    }
  };

  const downloadTemplate = () => {
    const template = generateBulkEnrollmentTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_enrollment_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadErrorReport = () => {
    const errorReport = generateErrorReportCSV(parseErrors);
    const blob = new Blob([errorReport], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enrollment_errors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadResults = () => {
    const headers = ['Email', 'Course ID', 'Status', 'Error'];
    const rows = results.map(r => [
      r.row.email,
      r.row.course_id.toString(),
      r.success ? 'Success' : 'Failed',
      r.error || '',
    ]);

    const csvRows = rows.map(row => row.map(cell => '"' + cell + '"').join(','));
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = 'bulk_enrollment_results_' + dateStr + '.csv';
    a.click();
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setValidData([]);
    setParseErrors([]);
    setResults([]);
    resetProgress();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Enrollment
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to enroll multiple students at once
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
              <p className="text-sm text-gray-500 mb-4">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertTitle>CSV Format</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    <strong>Required columns:</strong> email, course_id, payment_amount,
                    payment_status, payment_method
                  </p>
                  <p>
                    <strong>Payment status:</strong> completed, pending, or failed
                  </p>
                  <p>
                    <strong>Payment method:</strong> manual, card, upi, bank, or cash
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <Button variant="outline" onClick={downloadTemplate} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">File: {file?.name}</p>
                <p className="text-sm text-gray-500">
                  {validData.length} valid rows
                  {parseErrors.length > 0 && <span> , {parseErrors.length} errors</span>}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
                <X className="h-4 w-4 mr-2" />
                Change File
              </Button>
            </div>

            {parseErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Errors</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">
                    Found {parseErrors.length} errors. These rows will be skipped.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadErrorReport}
                    className="mt-2"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Error Report
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Course ID</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {validData.slice(0, 50).map((row, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">{row.email}</td>
                      <td className="px-4 py-2">{row.course_id}</td>
                      <td className="px-4 py-2">₹{row.payment_amount}</td>
                      <td className="px-4 py-2">
                        <Badge variant="outline">{row.payment_status}</Badge>
                      </td>
                      <td className="px-4 py-2">{row.payment_method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validData.length > 50 && (
                <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500 text-center">
                  ... and {validData.length - 50} more rows
                </div>
              )}
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium mb-2">Processing Enrollments...</p>
              <p className="text-sm text-gray-500">
                {progress.processed} of {progress.total} processed
              </p>
            </div>

            <Progress value={progress.percentage} className="w-full" />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{progress.successful}</p>
                <p className="text-sm text-gray-500">Successful</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{progress.failed}</p>
                <p className="text-sm text-gray-500">Failed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{progress.percentage}%</p>
                <p className="text-sm text-gray-500">Complete</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && (
          <div className="space-y-4">
            <Alert variant={results.every(r => r.success) ? 'default' : 'destructive'}>
              {results.every(r => r.success) ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>Processing Complete</AlertTitle>
              <AlertDescription>
                Successfully enrolled {results.filter(r => r.success).length} out of{' '}
                {results.length} students.
                {results.some(r => !r.success) && (
                  <p className="mt-2">
                    {results.filter(r => !r.success).length} enrollments failed.
                  </p>
                )}
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Course ID</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">{result.row.email}</td>
                      <td className="px-4 py-2">{result.row.course_id}</td>
                      <td className="px-4 py-2">
                        {result.success ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">{result.error || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button variant="outline" onClick={downloadResults} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Results Report
            </Button>
          </div>
        )}

        <DialogFooter>
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Cancel
              </Button>
              <Button onClick={handleProcess} disabled={validData.length === 0}>
                Process {validData.length} Enrollments
              </Button>
            </>
          )}
          {step === 'processing' && (
            <Button disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </Button>
          )}
          {step === 'results' && <Button onClick={handleClose}>Close</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
