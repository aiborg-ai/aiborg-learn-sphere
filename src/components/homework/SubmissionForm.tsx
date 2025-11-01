import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, Save, Send, Loader2, FileIcon, X, AlertCircle } from 'lucide-react';
import type { Assignment } from './AssignmentDetails';
import {
  detectEarlySubmission,
  calculateBonusPoints,
  getSubmissionUrgency,
  formatTimeRemaining,
} from '@/utils/earlySubmissionDetection';
import {
  EarlySubmissionBadge,
  SubmissionUrgencyIndicator,
  EarlySubmissionIncentive,
} from './EarlySubmissionBadge';

export interface Submission {
  id: string;
  assignment_id: string;
  submission_text: string;
  file_urls: string[];
  status: string;
  score: number | null;
  feedback: string | null;
  submitted_at: string | null;
  graded_at: string | null;
}

interface SubmissionFormProps {
  assignment: Assignment;
  submission: Submission | null;
  submissionText: string;
  setSubmissionText: (text: string) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  uploadedFileUrls: string[];
  uploadProgress: number;
  uploading: boolean;
  saving: boolean;
  onSaveDraft: () => Promise<void>;
  onSubmit: () => Promise<void>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onRemoveUploadedFile: (index: number) => void;
}

export function SubmissionForm({
  assignment,
  submission,
  submissionText,
  setSubmissionText,
  files,
  setFiles,
  uploadedFileUrls,
  uploadProgress,
  uploading,
  saving,
  onSaveDraft,
  onSubmit,
  onFileSelect,
  onRemoveFile,
  onRemoveUploadedFile,
}: SubmissionFormProps) {
  const [dragActive, setDragActive] = useState(false);

  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'graded';
  const isGraded = submission?.status === 'graded';
  const isOverdue = new Date(assignment.due_date) < new Date();

  // Early submission detection
  const earlySubmissionData = useMemo(() => {
    if (!submission?.submitted_at) return null;

    const submissionDate = new Date(submission.submitted_at);
    const dueDate = new Date(assignment.due_date);

    const result = detectEarlySubmission(submissionDate, {
      dueDate,
      bonusPoints: {
        enabled: true,
        veryEarly: 5,
        early: 3,
        onTime: 1,
      },
    });

    const bonusPoints = submission.score ? calculateBonusPoints(submission.score, result) : 0;

    return { result, bonusPoints };
  }, [submission, assignment.due_date]);

  // Submission urgency for pending submissions
  const urgencyData = useMemo(() => {
    if (isSubmitted) return null;

    const dueDate = new Date(assignment.due_date);
    const urgency = getSubmissionUrgency(dueDate);
    const timeRemaining = formatTimeRemaining(dueDate);

    return { urgency, timeRemaining, dueDate };
  }, [isSubmitted, assignment.due_date]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Submission</CardTitle>
        <CardDescription>
          {isSubmitted
            ? `Submitted on ${new Date(submission.submitted_at!).toLocaleString()}`
            : 'Write your answer and attach any required files'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Early Submission Badge for Submitted Work */}
        {earlySubmissionData && isSubmitted && (
          <EarlySubmissionBadge
            result={earlySubmissionData.result}
            showBonus={true}
            bonusPoints={earlySubmissionData.bonusPoints}
            variant="alert"
          />
        )}

        {/* Grading Information */}
        {isGraded && submission?.score !== null && (
          <Alert className="bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-green-800">
                  Score: {submission.score} / {assignment.max_score} points
                  {earlySubmissionData && earlySubmissionData.bonusPoints > 0 && (
                    <span className="ml-2 text-sm">
                      (Base: {submission.score}, Bonus: +{earlySubmissionData.bonusPoints})
                    </span>
                  )}
                </p>
                {submission.feedback && (
                  <div>
                    <p className="font-semibold text-green-800">Feedback:</p>
                    <p className="text-green-700">{submission.feedback}</p>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Urgency Indicator for Pending Submissions */}
        {!isSubmitted && urgencyData && (
          <SubmissionUrgencyIndicator
            dueDate={urgencyData.dueDate}
            urgency={urgencyData.urgency}
            timeRemaining={urgencyData.timeRemaining}
          />
        )}

        {/* Early Submission Incentive */}
        {!isSubmitted && !isOverdue && (
          <EarlySubmissionIncentive
            daysUntilDue={Math.ceil(
              (new Date(assignment.due_date).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            )}
            bonusConfig={{ veryEarly: 5, early: 3, onTime: 1 }}
          />
        )}

        <div className="space-y-2">
          <Label htmlFor="submission-text">Your Answer</Label>
          <Textarea
            id="submission-text"
            placeholder="Type your answer here..."
            value={submissionText}
            onChange={e => setSubmissionText(e.target.value)}
            className="min-h-[300px]"
            disabled={isSubmitted && !isGraded}
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Attachments</div>
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              dragActive ? 'border-primary bg-primary/10' : 'border-gray-300'
            } ${isSubmitted && !isGraded ? 'opacity-50' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              onChange={onFileSelect}
              className="hidden"
              id="file-upload"
              accept={assignment.allowed_file_types.join(',')}
              disabled={isSubmitted && !isGraded}
            />
            <label
              htmlFor="file-upload"
              className={`cursor-pointer ${isSubmitted && !isGraded ? 'pointer-events-none' : ''}`}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Drag and drop files here, or click to select</p>
              <p className="text-xs text-gray-500 mt-1">
                Max size: {assignment.max_file_size_mb}MB per file
              </p>
            </label>
          </div>

          {uploading && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Uploading files...</p>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Files to be uploaded */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Files to upload:</p>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  {!isSubmitted && (
                    <Button size="sm" variant="ghost" onClick={() => onRemoveFile(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Already uploaded files */}
          {uploadedFileUrls.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Uploaded files:</p>
              {uploadedFileUrls.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-green-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-green-600" />
                    <span className="text-sm">File {index + 1}</span>
                  </div>
                  {!isSubmitted && (
                    <Button size="sm" variant="ghost" onClick={() => onRemoveUploadedFile(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {!isSubmitted && (
          <div className="flex gap-3">
            <Button onClick={onSaveDraft} disabled={saving || uploading} variant="outline">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </>
              )}
            </Button>

            <Button
              onClick={onSubmit}
              disabled={saving || uploading || (!submissionText && files.length === 0)}
              variant="default"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Assignment
                </>
              )}
            </Button>

            {isOverdue && !assignment.allow_late_submission && (
              <p className="text-sm text-destructive self-center">
                This assignment is overdue and does not accept late submissions
              </p>
            )}
          </div>
        )}

        {isSubmitted && !isGraded && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your assignment has been submitted and is awaiting grading.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
