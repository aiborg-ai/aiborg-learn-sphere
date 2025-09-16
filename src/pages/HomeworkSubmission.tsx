import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText, Upload, Clock, Calendar, CheckCircle, AlertCircle,
  Download, Trash, Send, Save, ArrowLeft, Loader2, FileIcon,
  X, Eye
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  due_date: string;
  max_score: number;
  rubric: any;
  allowed_file_types: string[];
  max_file_size_mb: number;
  allow_late_submission: boolean;
  course_id: number;
}

interface Submission {
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

interface CourseInfo {
  id: number;
  title: string;
}

export default function HomeworkSubmission() {
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

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (assignmentId) {
      fetchAssignmentAndSubmission();
    }
  }, [user, assignmentId]);

  const fetchAssignmentAndSubmission = async () => {
    if (!user || !assignmentId) return;

    try {
      setLoading(true);

      // Fetch assignment details
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('homework_assignments')
        .select(`
          *,
          courses!inner(id, title)
        `)
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
        toast({
          title: 'Access Denied',
          description: 'You must be enrolled in this course to submit homework',
          variant: 'destructive'
        });
        navigate('/dashboard');
        return;
      }

      // Fetch existing submission if any
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
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignment details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    // Validate file types
    const allowedTypes = assignment?.allowed_file_types || [];
    const invalidFiles = selectedFiles.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return !allowedTypes.includes(ext || '');
    });

    if (invalidFiles.length > 0) {
      toast({
        title: 'Invalid File Type',
        description: `Allowed types: ${allowedTypes.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    // Validate file sizes
    const maxSize = (assignment?.max_file_size_mb || 10) * 1024 * 1024;
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      toast({
        title: 'File Too Large',
        description: `Maximum file size: ${assignment?.max_file_size_mb}MB`,
        variant: 'destructive'
      });
      return;
    }

    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedFile = (url: string) => {
    setUploadedFileUrls(prev => prev.filter(u => u !== url));
  };

  const uploadFiles = async (): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${assignmentId}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('homework-submissions')
        .upload(fileName, file, {
          onUploadProgress: (progress) => {
            setUploadProgress((progress.loaded / progress.total) * 100);
          }
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('homework-submissions')
        .getPublicUrl(fileName);

      return publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  const handleSaveDraft = async () => {
    if (!user || !assignmentId) return;

    try {
      setSaving(true);

      let fileUrls = [...uploadedFileUrls];
      if (files.length > 0) {
        setUploading(true);
        const newUrls = await uploadFiles();
        fileUrls = [...fileUrls, ...newUrls];
        setUploading(false);
      }

      const submissionData = {
        assignment_id: assignmentId,
        user_id: user.id,
        submission_text: submissionText,
        file_urls: fileUrls,
        status: 'draft',
        is_late: false
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

      setUploadedFileUrls(fileUrls);
      setFiles([]);

      toast({
        title: 'Draft Saved',
        description: 'Your homework draft has been saved successfully'
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to save draft',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !assignmentId || !assignment) return;

    // Check if submission is late
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const isLate = now > dueDate;

    if (isLate && !assignment.allow_late_submission) {
      toast({
        title: 'Submission Closed',
        description: 'This assignment no longer accepts submissions',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);

      let fileUrls = [...uploadedFileUrls];
      if (files.length > 0) {
        setUploading(true);
        const newUrls = await uploadFiles();
        fileUrls = [...fileUrls, ...newUrls];
        setUploading(false);
      }

      const submissionData = {
        assignment_id: assignmentId,
        user_id: user.id,
        submission_text: submissionText,
        file_urls: fileUrls,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        is_late: isLate
      };

      if (submission) {
        const { error } = await supabase
          .from('homework_submissions')
          .update(submissionData)
          .eq('id', submission.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('homework_submissions')
          .insert(submissionData)
          .select()
          .single();

        if (error) throw error;
        setSubmission(data);
      }

      // Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'course_update',
          title: 'Homework Submitted',
          message: `Your homework for "${assignment.title}" has been submitted successfully`,
          data: { assignment_id: assignmentId }
        });

      toast({
        title: 'Success',
        description: 'Your homework has been submitted successfully'
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting homework:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit homework',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'submitted':
        return <Badge variant="default">Submitted</Badge>;
      case 'grading':
        return <Badge variant="outline">Grading</Badge>;
      case 'graded':
        return <Badge className="bg-green-500">Graded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-white text-center">Assignment not found</p>
            <Button
              className="w-full mt-4"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const dueDate = new Date(assignment.due_date);
  const isOverdue = now > dueDate;
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-hero p-6">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          {submission && getStatusBadge(submission.status)}
        </div>

        {/* Assignment Details */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-white text-2xl">{assignment.title}</CardTitle>
                <CardDescription className="text-white/60 mt-2">
                  {course?.title}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-white/80">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </span>
                </div>
                {isOverdue ? (
                  <Badge variant="destructive" className="mt-2">
                    Overdue
                  </Badge>
                ) : (
                  <p className="text-white/60 text-sm mt-1">
                    {daysUntilDue} days remaining
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-white font-medium mb-2">Description</h3>
              <p className="text-white/80">{assignment.description}</p>
            </div>

            {assignment.instructions && (
              <div>
                <h3 className="text-white font-medium mb-2">Instructions</h3>
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-white/80 whitespace-pre-wrap">{assignment.instructions}</p>
                </div>
              </div>
            )}

            {assignment.rubric && (
              <div>
                <h3 className="text-white font-medium mb-2">Grading Rubric</h3>
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-white/60 text-sm">Max Score: {assignment.max_score} points</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submission Form */}
        {submission?.status === 'graded' ? (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Graded Submission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/60 text-sm">Score</p>
                  <p className="text-2xl font-bold text-white">
                    {submission.score}/{assignment.max_score}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Submitted</p>
                  <p className="text-white">
                    {submission.submitted_at && new Date(submission.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {submission.feedback && (
                <div>
                  <h3 className="text-white font-medium mb-2">Instructor Feedback</h3>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <p className="text-white/80">{submission.feedback}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-white font-medium mb-2">Your Submission</h3>
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-white/80 whitespace-pre-wrap">{submission.submission_text}</p>
                </div>
              </div>

              {submission.file_urls && submission.file_urls.length > 0 && (
                <div>
                  <h3 className="text-white font-medium mb-2">Submitted Files</h3>
                  <div className="space-y-2">
                    {submission.file_urls.map((url, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white/5 p-2 rounded">
                        <FileIcon className="h-4 w-4 text-white/60" />
                        <span className="text-white/80 text-sm flex-1">
                          File {index + 1}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">
                {submission?.status === 'submitted' ? 'Your Submission' : 'Submit Homework'}
              </CardTitle>
              <CardDescription className="text-white/60">
                {submission?.status === 'submitted'
                  ? 'Your homework has been submitted and is awaiting grading'
                  : 'Complete your homework submission below'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {submission?.status !== 'submitted' && (
                <>
                  <div>
                    <Label htmlFor="submission" className="text-white mb-2">
                      Your Answer
                    </Label>
                    <Textarea
                      id="submission"
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="Enter your homework response here..."
                      className="min-h-[200px] bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2">
                      File Attachments
                    </Label>
                    <div className="space-y-3">
                      {/* File Input */}
                      <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          multiple
                          accept={assignment.allowed_file_types.map(t => `.${t}`).join(',')}
                          onChange={handleFileSelect}
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <Upload className="h-12 w-12 text-white/40 mb-3" />
                          <p className="text-white/80">Click to upload or drag and drop</p>
                          <p className="text-white/60 text-sm mt-1">
                            Allowed: {assignment.allowed_file_types.join(', ')} (Max {assignment.max_file_size_mb}MB)
                          </p>
                        </label>
                      </div>

                      {/* Pending Files */}
                      {files.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-white/80 text-sm font-medium">Files to upload:</p>
                          {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-white/5 p-2 rounded">
                              <div className="flex items-center gap-2">
                                <FileIcon className="h-4 w-4 text-white/60" />
                                <span className="text-white/80 text-sm">{file.name}</span>
                                <span className="text-white/60 text-xs">
                                  ({formatFileSize(file.size)})
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-4 w-4 text-red-400" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Uploaded Files */}
                      {uploadedFileUrls.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-white/80 text-sm font-medium">Uploaded files:</p>
                          {uploadedFileUrls.map((url, index) => (
                            <div key={url} className="flex items-center justify-between bg-white/5 p-2 rounded">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                <span className="text-white/80 text-sm">File {index + 1}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(url, '_blank')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeUploadedFile(url)}
                                >
                                  <Trash className="h-4 w-4 text-red-400" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {uploading && (
                        <div className="space-y-2">
                          <p className="text-white/60 text-sm">Uploading files...</p>
                          <Progress value={uploadProgress} className="h-2" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={handleSaveDraft}
                      disabled={saving || uploading}
                      className="flex-1"
                    >
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Save className="h-4 w-4 mr-2" />
                      Save Draft
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={saving || uploading || (!submissionText && uploadedFileUrls.length === 0)}
                      className="flex-1"
                    >
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Send className="h-4 w-4 mr-2" />
                      Submit Homework
                    </Button>
                  </div>

                  {isOverdue && assignment.allow_late_submission && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This assignment is overdue. Late submissions are accepted but may incur penalties.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {submission?.status === 'submitted' && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your homework has been submitted successfully and is awaiting grading.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h3 className="text-white font-medium mb-2">Your Submission</h3>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-white/80 whitespace-pre-wrap">{submission.submission_text}</p>
                    </div>
                  </div>

                  {submission.file_urls && submission.file_urls.length > 0 && (
                    <div>
                      <h3 className="text-white font-medium mb-2">Submitted Files</h3>
                      <div className="space-y-2">
                        {submission.file_urls.map((url, index) => (
                          <div key={index} className="flex items-center gap-2 bg-white/5 p-2 rounded">
                            <FileIcon className="h-4 w-4 text-white/60" />
                            <span className="text-white/80 text-sm flex-1">
                              File {index + 1}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(url, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}