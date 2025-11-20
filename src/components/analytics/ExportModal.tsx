/**
 * Export Modal Component
 * Modal for configuring and executing analytics export to PDF or CSV
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Calendar,
  Settings,
  Loader2,
} from '@/components/ui/icons';
import {
  EnhancedPDFExportService,
  DEFAULT_TEMPLATES as PDF_TEMPLATES,
  type ChartSection,
  type ReportMetadata,
  type ReportTemplate,
} from '@/services/analytics/EnhancedPDFExportService';
import {
  EnhancedCSVExportService,
  DEFAULT_TEMPLATES as CSV_TEMPLATES,
  type CSVTemplate,
} from '@/services/analytics/EnhancedCSVExportService';
import { toast } from '@/components/ui/use-toast';

export interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // PDF Export options
  sections?: ChartSection[];
  reportTitle?: string;
  reportSubtitle?: string;

  // CSV Export options
  csvData?: Array<Record<string, any>>;
  csvTemplate?: string; // Template key from DEFAULT_TEMPLATES

  // Common options
  dateRange?: { startDate: Date | null; endDate: Date | null };
  metadata?: Record<string, string>;
  defaultFormat?: 'pdf' | 'csv';
}

export default function ExportModal({
  open,
  onOpenChange,
  sections = [],
  reportTitle = 'Analytics Report',
  reportSubtitle,
  csvData = [],
  csvTemplate,
  dateRange,
  metadata,
  defaultFormat = 'pdf',
}: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>(defaultFormat);
  const [filename, setFilename] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  // PDF state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');
  const [selectedSections, setSelectedSections] = useState<string[]>(
    sections.map(s => s.elementId)
  );
  const [author, setAuthor] = useState('');
  const [department, setDepartment] = useState('');

  // CSV state
  const [selectedCSVTemplate, setSelectedCSVTemplate] = useState<string>(
    csvTemplate || 'learnerPerformance'
  );
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setProgress(10);

      if (exportFormat === 'pdf') {
        await exportPDF();
      } else {
        await exportCSV();
      }

      setProgress(100);
      toast({
        title: 'Export Successful',
        description: `Your ${exportFormat.toUpperCase()} file has been downloaded.`,
      });

      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
        onOpenChange(false);
      }, 1000);
    } catch (error) {
      setIsExporting(false);
      setProgress(0);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'An error occurred during export',
      });
    }
  };

  const exportPDF = async () => {
    const template = PDF_TEMPLATES[selectedTemplate] as ReportTemplate;
    const filteredSections = sections.filter(s => selectedSections.includes(s.elementId));

    if (filteredSections.length === 0) {
      throw new Error('Please select at least one section to export');
    }

    setProgress(30);

    const reportMetadata: ReportMetadata = {
      title: reportTitle,
      subtitle: reportSubtitle,
      author: author || undefined,
      department: department || undefined,
      dateRange,
      generatedDate: new Date(),
      customFields: metadata,
    };

    setProgress(50);

    const generatedFilename =
      filename ||
      EnhancedPDFExportService.generateFilename(
        reportTitle.toLowerCase().replace(/\s+/g, '-'),
        dateRange
      );

    await EnhancedPDFExportService.exportToPDF({
      sections: filteredSections,
      metadata: reportMetadata,
      template,
      filename: generatedFilename,
    });
  };

  const exportCSV = async () => {
    if (csvData.length === 0) {
      throw new Error('No data available for export');
    }

    setProgress(30);

    const template = CSV_TEMPLATES[selectedCSVTemplate] as CSVTemplate;

    // Override template settings with user preferences
    const customTemplate: CSVTemplate = {
      ...template,
      includeMetadata,
      includeSummaryRow: includeSummary,
    };

    setProgress(50);

    const generatedFilename =
      filename ||
      EnhancedCSVExportService.generateFilename(
        reportTitle.toLowerCase().replace(/\s+/g, '-'),
        dateRange
      );

    await EnhancedCSVExportService.exportToCSV({
      data: csvData,
      template: customTemplate,
      filename: generatedFilename,
      metadata: {
        exportType: reportTitle,
        ...metadata,
      },
      dateRange,
    });
  };

  const toggleSection = (elementId: string) => {
    setSelectedSections(prev =>
      prev.includes(elementId) ? prev.filter(id => id !== elementId) : [...prev, elementId]
    );
  };

  const selectAllSections = () => {
    setSelectedSections(sections.map(s => s.elementId));
  };

  const deselectAllSections = () => {
    setSelectedSections([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Analytics
          </DialogTitle>
          <DialogDescription>
            Configure your export options and download analytics data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Format Selection */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Export Format</div>
            <RadioGroup
              value={exportFormat}
              onValueChange={v => setExportFormat(v as 'pdf' | 'csv')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  PDF Report (Charts & Visualizations)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV Data (Raw Data)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Common Options */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filename">Filename (optional)</Label>
              <Input
                id="filename"
                placeholder={`Auto-generated: ${reportTitle.toLowerCase().replace(/\s+/g, '-')}_${new Date().toISOString().split('T')[0]}`}
                value={filename}
                onChange={e => setFilename(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for auto-generated filename with timestamp
              </p>
            </div>

            {dateRange && dateRange.startDate && dateRange.endDate && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Date Range: {dateRange.startDate.toLocaleDateString()} -{' '}
                  {dateRange.endDate.toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Format-specific Options */}
          <Tabs value={exportFormat} className="w-full">
            <TabsContent value="pdf" className="space-y-4 mt-4">
              {/* PDF Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="pdf-template">Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger id="pdf-template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PDF_TEMPLATES).map(([key, template]) => (
                      <SelectItem key={key} value={key}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose a template that best fits your reporting needs
                </p>
              </div>

              {/* Section Selection */}
              {sections.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Sections to Include</div>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={selectAllSections}>
                        Select All
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={deselectAllSections}>
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                    {sections.map(section => (
                      <div key={section.elementId} className="flex items-center space-x-2">
                        <Checkbox
                          id={section.elementId}
                          checked={selectedSections.includes(section.elementId)}
                          onCheckedChange={() => toggleSection(section.elementId)}
                        />
                        <Label
                          htmlFor={section.elementId}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {section.title}
                          {section.description && (
                            <span className="text-xs text-muted-foreground block">
                              {section.description}
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <Badge variant="secondary">
                    {selectedSections.length} of {sections.length} sections selected
                  </Badge>
                </div>
              )}

              {/* Optional Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Author (optional)</Label>
                  <Input
                    id="author"
                    placeholder="Your name"
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department (optional)</Label>
                  <Input
                    id="department"
                    placeholder="Department name"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="csv" className="space-y-4 mt-4">
              {/* CSV Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="csv-template">Data Template</Label>
                <Select value={selectedCSVTemplate} onValueChange={setSelectedCSVTemplate}>
                  <SelectTrigger id="csv-template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CSV_TEMPLATES).map(([key, template]) => (
                      <SelectItem key={key} value={key}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Template controls column formatting and summary calculations
                </p>
              </div>

              {/* CSV Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-metadata"
                    checked={includeMetadata}
                    onCheckedChange={checked => setIncludeMetadata(checked as boolean)}
                  />
                  <Label htmlFor="include-metadata" className="cursor-pointer">
                    Include metadata header
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-summary"
                    checked={includeSummary}
                    onCheckedChange={checked => setIncludeSummary(checked as boolean)}
                  />
                  <Label htmlFor="include-summary" className="cursor-pointer">
                    Include summary row (totals/averages)
                  </Label>
                </div>
              </div>

              {/* Data Preview */}
              {csvData.length > 0 && (
                <div className="p-3 bg-muted rounded-md space-y-2">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Export Preview</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Rows:</span>{' '}
                      <span className="font-medium">{csvData.length.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Columns:</span>{' '}
                      <span className="font-medium">
                        {CSV_TEMPLATES[selectedCSVTemplate]?.columns.length || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Size:</span>{' '}
                      <span className="font-medium">
                        ~{Math.round((csvData.length * 200) / 1024)} KB
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Progress Bar */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Exporting...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
