import React, { useState, useCallback } from 'react';
import { Upload, FileJson, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { templateService } from '@/services/templateService';
import { useParseJSONFile } from '@/hooks/useTemplates';

interface UploadedTemplateData {
  courses?: unknown[];
  events?: unknown[];
}

interface TemplateUploadProps {
  onFileUpload: (data: UploadedTemplateData, type: 'course' | 'event') => void;
  isLoading?: boolean;
}

export function TemplateUpload({ onFileUpload, isLoading }: TemplateUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateType, setTemplateType] = useState<'course' | 'event'>('course');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useParseJSONFile();

  const handleFile = useCallback(
    async (file: File) => {
      // Validate file type
      if (file.type !== 'application/json') {
        setError('Please upload a JSON file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);

      // Parse and validate JSON
      try {
        const data = await parseFile.mutateAsync(file);

        // Auto-detect template type
        if (data.courses && Array.isArray(data.courses)) {
          setTemplateType('course');
        } else if (data.events && Array.isArray(data.events)) {
          setTemplateType('event');
        } else {
          setError('Invalid template format. Must contain "courses" or "events" array');
          setSelectedFile(null);
        }
      } catch (_err) {
        setError('Failed to parse JSON file');
        setSelectedFile(null);
      }
    },
    [parseFile]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      setError(null);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      setError(null);
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const data = await parseFile.mutateAsync(selectedFile);
      onFileUpload(data, templateType);
    } catch (_err) {
      setError('Failed to process file');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const handleDownloadTemplate = () => {
    templateService.downloadTemplateExample(templateType);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Template</CardTitle>
        <CardDescription>
          Upload a JSON file containing course or event templates for bulk import
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Type Selection */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Template Type</div>
          <RadioGroup
            value={templateType}
            onValueChange={value => setTemplateType(value as 'course' | 'event')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="course" id="course" />
              <Label htmlFor="course">Course Template</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="event" id="event" />
              <Label htmlFor="event">Event Template</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Download Template Button */}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download {templateType === 'course' ? 'Course' : 'Event'} Template Example
          </Button>
        </div>

        {/* File Upload Area */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isLoading}
          />

          {selectedFile ? (
            <div className="space-y-4">
              <FileJson className="h-12 w-12 mx-auto text-primary" />
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({templateService.formatFileSize(selectedFile.size)})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Drop your JSON file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Supports JSON files up to 5MB</p>
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        <Button onClick={handleUpload} disabled={!selectedFile || isLoading} className="w-full">
          {isLoading ? 'Processing...' : 'Validate & Import'}
        </Button>
      </CardContent>
    </Card>
  );
}
