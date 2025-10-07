import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import homework components
import {
  AssignmentDetails,
  type Assignment,
  type CourseInfo,
} from '@/components/homework/AssignmentDetails';
import { SubmissionForm, type Submission } from '@/components/homework/SubmissionForm';
import { SubmissionHistory } from '@/components/homework/SubmissionHistory';

export default function HomeworkSubmissionRefactored() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previousSubmissions, setPreviousSubmissions] = useState<Submission[]>([]);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchAssignmentAndSubmission = useCallback(async () => {
    if (!user || !assignmentId) return;

    try {
      setLoading(true);

      // Fetch assignment details
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('homework_assignments')
        .select(
          `
          *,
          courses!inner(id, title)
        `
        )
        .eq('id', assignmentId)
        .single();

      if (assignmentError) throw assignmentError;

      setAssignment(assignmentData);
      setCourse({ id: assignmentData.courses.id, title: assignmentData.courses.title });

      // Check if user is enrolled in the course
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', assignmentData.course_id)
        .single();

      if (!enrollmentData) {
        setEnrollmentError('You must be enrolled in this course to submit assignments.');
        return;
      }

      // Fetch existing submission
      const { data: submissionData } = await supabase
        .from('homework_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('user_id', user.id)
        .single();

      if (submissionData) {
        setSubmission(submissionData);
        setSubmissionText(submissionData.submission_text || '');
        setUploadedFileUrls(submissionData.file_urls || []);
      }

      // Fetch previous submissions
      const { data: historyData } = await supabase
        .from('homework_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (historyData) {
        setPreviousSubmissions(historyData);
      }
    } catch (error) {
      logger.error('Error fetching assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignment details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, assignmentId, toast]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (assignmentId) {
      fetchAssignmentAndSubmission();
    }
  }, [user, assignmentId, navigate, fetchAssignmentAndSubmission]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !assignment) return;

    const selectedFiles = Array.from(e.target.files);
    const validFiles: File[] = [];
    const maxSize = assignment.max_file_size_mb * 1024 * 1024;

    for (const file of selectedFiles) {
      // Check file size
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds the ${assignment.max_file_size_mb}MB limit`,
          variant: 'destructive',
        });
        continue;
      }

      // Check file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!assignment.allowed_file_types.includes(fileExtension)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not an allowed file type`,
          variant: 'destructive',
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setFiles([...files, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFileUrls(uploadedFileUrls.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (files.length === 0) return [];

    setUploading(true);
    const fileUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${assignmentId}/${Date.now()}_${i}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('homework-submissions')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        if (data) {
          const {
            data: { publicUrl },
          } = supabase.storage.from('homework-submissions').getPublicUrl(data.path);

          fileUrls.push(publicUrl);
        }

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      return fileUrls;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSaveDraft = async () => {
    if (!assignment || !user) return;

    try {
      setSaving(true);
      setUploading(true);

      // Upload files if there are any
      const newFileUrls = await uploadFiles();
      const allFileUrls = [...uploadedFileUrls, ...newFileUrls];

      const submissionData = {
        assignment_id: assignment.id,
        user_id: user.id,
        submission_text: submissionText,
        file_urls: allFileUrls,
        status: 'draft',
        submitted_at: null,
      };

      if (submission) {
        // Update existing submission
        const { error } = await supabase
          .from('homework_submissions')
          .update(submissionData)
          .eq('id', submission.id);

        if (error) throw error;
      } else {
        // Create new submission
        const { data, error } = await supabase
          .from('homework_submissions')
          .insert(submissionData)
          .select()
          .single();

        if (error) throw error;
        setSubmission(data);
      }

      setUploadedFileUrls(allFileUrls);
      setFiles([]);

      toast({
        title: 'Draft Saved',
        description: 'Your homework draft has been saved successfully',
      });
    } catch (error) {
      logger.error('Error saving draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to save draft',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!assignment || !user) return;

    // Check if submission is allowed
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    if (now > dueDate && !assignment.allow_late_submission) {
      toast({
        title: 'Submission Not Allowed',
        description: 'This assignment is overdue and does not accept late submissions',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      setUploading(true);

      // Upload files if there are any
      const newFileUrls = await uploadFiles();
      const allFileUrls = [...uploadedFileUrls, ...newFileUrls];

      const submissionData = {
        assignment_id: assignment.id,
        user_id: user.id,
        submission_text: submissionText,
        file_urls: allFileUrls,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      };

      if (submission) {
        // Update existing submission
        const { error } = await supabase
          .from('homework_submissions')
          .update(submissionData)
          .eq('id', submission.id);

        if (error) throw error;
      } else {
        // Create new submission
        const { error } = await supabase.from('homework_submissions').insert(submissionData);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Your homework has been submitted successfully',
      });

      navigate('/dashboard');
    } catch (error) {
      logger.error('Error submitting homework:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit homework',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleViewSubmission = (submission: Submission) => {
    setSubmissionText(submission.submission_text);
    setUploadedFileUrls(submission.file_urls);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadSubmission = (submission: Submission) => {
    submission.file_urls.forEach((url, index) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = `submission_file_${index + 1}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <div className="container mx-auto px-4 py-8">
          <Alert className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Assignment not found. Please check the URL or contact your instructor.
            </AlertDescription>
          </Alert>
          <div className="text-center mt-4">
            <Link to="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/dashboard">
          <Button variant="outline" className="btn-outline-ai mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="space-y-6">
          {enrollmentError ? (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{enrollmentError}</AlertDescription>
            </Alert>
          ) : (
            <>
              <AssignmentDetails assignment={assignment} course={course} />

              <SubmissionForm
                assignment={assignment}
                submission={submission}
                submissionText={submissionText}
                setSubmissionText={setSubmissionText}
                files={files}
                setFiles={setFiles}
                uploadedFileUrls={uploadedFileUrls}
                uploadProgress={uploadProgress}
                uploading={uploading}
                saving={saving}
                onSaveDraft={handleSaveDraft}
                onSubmit={handleSubmit}
                onFileSelect={handleFileSelect}
                onRemoveFile={removeFile}
                onRemoveUploadedFile={removeUploadedFile}
              />

              <SubmissionHistory
                submissions={previousSubmissions}
                onViewSubmission={handleViewSubmission}
                onDownloadSubmission={handleDownloadSubmission}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
