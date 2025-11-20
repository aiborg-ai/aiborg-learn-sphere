/**
 * AI Content Studio Component
 *
 * Interface for AI-powered content generation:
 * - Course generation
 * - Quiz/assessment generation
 * - Content translation
 * - Video scripts
 * - Slide decks
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  Languages,
  Video,
  Presentation,
  RefreshCw,
  CheckCircle2,
  Clock,
  FileText,
  Zap,
  TrendingUp,
  Eye,
} from '@/components/ui/icons';
import { useToast } from '@/hooks/use-toast';
import {
  AIContentService,
  AIContentJob,
  CourseTemplate,
  GeneratedCourse,
  GenerationStats,
  SupportedLanguage,
} from '@/services/ai-content';

export function AIContentStudio() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');

  // Data states
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [templates, setTemplates] = useState<CourseTemplate[]>([]);
  const [jobs, setJobs] = useState<AIContentJob[]>([]);
  const [generatedCourses, setGeneratedCourses] = useState<GeneratedCourse[]>([]);
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);

  // Form states
  const [courseForm, setCourseForm] = useState({
    topic: '',
    audience: 'professional' as const,
    difficulty: 'intermediate' as const,
    duration_hours: 10,
    num_modules: 5,
    include_quizzes: true,
    include_exercises: true,
    template_id: '',
  });

  const [quizForm, setQuizForm] = useState({
    source_content: '',
    num_questions: 10,
    difficulty: 'intermediate' as const,
    include_explanations: true,
  });

  const [translationForm, setTranslationForm] = useState({
    content_id: '',
    content_type: 'course',
    target_language: '',
  });

  // Dialog states
  const [previewCourse, setPreviewCourse] = useState<GeneratedCourse | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, templatesData, jobsData, coursesData, languagesData] = await Promise.all([
        AIContentService.getGenerationStats(),
        AIContentService.getTemplates(),
        AIContentService.getJobs({ limit: 20 }),
        AIContentService.getGeneratedCourses({ limit: 10 }),
        AIContentService.getSupportedLanguages(),
      ]);

      setStats(statsData);
      setTemplates(templatesData);
      setJobs(jobsData);
      setGeneratedCourses(coursesData);
      setLanguages(languagesData);
    } catch (error) {
      console.error('Error loading AI content data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI content data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCourse = async () => {
    if (!courseForm.topic) {
      toast({
        title: 'Topic Required',
        description: 'Please enter a course topic',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGenerating(true);
      const jobId = await AIContentService.generateCourse(courseForm);
      toast({
        title: 'Course Generation Started',
        description: `Job ${jobId.slice(0, 8)}... is processing`,
      });
      setCourseForm({
        topic: '',
        audience: 'professional',
        difficulty: 'intermediate',
        duration_hours: 10,
        num_modules: 5,
        include_quizzes: true,
        include_exercises: true,
        template_id: '',
      });
      await loadData();
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!quizForm.source_content) {
      toast({
        title: 'Content Required',
        description: 'Please enter content to generate questions from',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGenerating(true);
      const jobId = await AIContentService.generateQuiz(quizForm);
      toast({
        title: 'Quiz Generation Started',
        description: `Job ${jobId.slice(0, 8)}... is processing`,
      });
      setQuizForm({
        source_content: '',
        num_questions: 10,
        difficulty: 'intermediate',
        include_explanations: true,
      });
      await loadData();
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleTranslate = async () => {
    if (!translationForm.content_id || !translationForm.target_language) {
      toast({
        title: 'Fields Required',
        description: 'Please select content and target language',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGenerating(true);
      const jobId = await AIContentService.translateContent(translationForm);
      toast({
        title: 'Translation Started',
        description: `Job ${jobId.slice(0, 8)}... is processing`,
      });
      await loadData();
    } catch (error) {
      toast({
        title: 'Translation Failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveCourse = async (id: string) => {
    await AIContentService.approveCourse(id);
    toast({ title: 'Course Approved' });
    await loadData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-yellow-500" />
            AI Content Studio
          </h1>
          <p className="text-muted-foreground">
            Generate courses, quizzes, translations, and more with AI
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_jobs}</div>
              <p className="text-xs text-muted-foreground">{stats.completed_jobs} completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_jobs > 0
                  ? Math.round((stats.completed_jobs / stats.total_jobs) * 100)
                  : 0}
                %
              </div>
              <Progress
                value={stats.total_jobs > 0 ? (stats.completed_jobs / stats.total_jobs) * 100 : 0}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.total_tokens / 1000).toFixed(1)}K</div>
              <p className="text-xs text-muted-foreground">Total tokens consumed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.total_cost.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">API usage cost</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="courses" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="flex items-center gap-1">
            <HelpCircle className="h-4 w-4" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="translate" className="flex items-center gap-1">
            <Languages className="h-4 w-4" />
            Translate
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-1">
            <Video className="h-4 w-4" />
            Video
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Course Generation Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Generation Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generate Course</CardTitle>
                <CardDescription>Create a complete course with AI in minutes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Course Topic *</Label>
                  <Input
                    value={courseForm.topic}
                    onChange={e => setCourseForm({ ...courseForm, topic: e.target.value })}
                    placeholder="e.g., Introduction to Machine Learning"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Audience</Label>
                    <Select
                      value={courseForm.audience}
                      onValueChange={value =>
                        setCourseForm({ ...courseForm, audience: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary School</SelectItem>
                        <SelectItem value="secondary">Secondary School</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Difficulty</Label>
                    <Select
                      value={courseForm.difficulty}
                      onValueChange={value =>
                        setCourseForm({ ...courseForm, difficulty: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Duration (hours)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={courseForm.duration_hours}
                      onChange={e =>
                        setCourseForm({
                          ...courseForm,
                          duration_hours: parseInt(e.target.value) || 10,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Number of Modules</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={courseForm.num_modules}
                      onChange={e =>
                        setCourseForm({ ...courseForm, num_modules: parseInt(e.target.value) || 5 })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Include Quizzes</Label>
                  <Switch
                    checked={courseForm.include_quizzes}
                    onCheckedChange={checked =>
                      setCourseForm({ ...courseForm, include_quizzes: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Include Exercises</Label>
                  <Switch
                    checked={courseForm.include_exercises}
                    onCheckedChange={checked =>
                      setCourseForm({ ...courseForm, include_exercises: checked })
                    }
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleGenerateCourse}
                  disabled={generating || !courseForm.topic}
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Course
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Templates</CardTitle>
                <CardDescription>Use a template for faster course creation</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  <div className="space-y-3">
                    {templates.map(template => (
                      <div
                        key={template.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          courseForm.template_id === template.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-muted-foreground/50'
                        }`}
                        onClick={() =>
                          setCourseForm({
                            ...courseForm,
                            template_id: template.id,
                            num_modules: template.default_modules,
                            duration_hours: template.default_duration_hours,
                            include_quizzes: template.include_quizzes,
                            include_exercises: template.include_exercises,
                          })
                        }
                      >
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{template.default_modules} modules</Badge>
                          <Badge variant="outline">{template.default_duration_hours}h</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Generated Courses */}
          {generatedCourses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generated Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generatedCourses.map(course => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{course.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {course.modules.length} modules • {course.estimated_duration_hours}h
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {course.status}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => setPreviewCourse(course)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {course.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproveCourse(course.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Quiz Generation Tab */}
        <TabsContent value="quizzes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generate Quiz Questions</CardTitle>
              <CardDescription>Create quiz questions from any content using AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Source Content *</Label>
                <Textarea
                  value={quizForm.source_content}
                  onChange={e => setQuizForm({ ...quizForm, source_content: e.target.value })}
                  placeholder="Paste the content you want to generate questions from..."
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Number of Questions</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={quizForm.num_questions}
                    onChange={e =>
                      setQuizForm({ ...quizForm, num_questions: parseInt(e.target.value) || 10 })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Difficulty</Label>
                  <Select
                    value={quizForm.difficulty}
                    onValueChange={value => setQuizForm({ ...quizForm, difficulty: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Include Explanations</Label>
                <Switch
                  checked={quizForm.include_explanations}
                  onCheckedChange={checked =>
                    setQuizForm({ ...quizForm, include_explanations: checked })
                  }
                />
              </div>

              <Button
                className="w-full"
                onClick={handleGenerateQuiz}
                disabled={generating || !quizForm.source_content}
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Generate Questions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Translation Tab */}
        <TabsContent value="translate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Translate Content</CardTitle>
              <CardDescription>
                Translate courses and content to {languages.length}+ languages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Content ID</Label>
                <Input
                  value={translationForm.content_id}
                  onChange={e =>
                    setTranslationForm({ ...translationForm, content_id: e.target.value })
                  }
                  placeholder="Enter content UUID"
                />
              </div>

              <div className="grid gap-2">
                <Label>Content Type</Label>
                <Select
                  value={translationForm.content_type}
                  onValueChange={value =>
                    setTranslationForm({ ...translationForm, content_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="lesson">Lesson</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="blog_post">Blog Post</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Target Language</Label>
                <Select
                  value={translationForm.target_language}
                  onValueChange={value =>
                    setTranslationForm({ ...translationForm, target_language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name} ({lang.native_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleTranslate}
                disabled={
                  generating || !translationForm.content_id || !translationForm.target_language
                }
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <Languages className="h-4 w-4 mr-2" />
                    Translate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Tab */}
        <TabsContent value="video" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Video Script</CardTitle>
                <CardDescription>Generate narration scripts for video lessons</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Coming soon: AI-powered video script generation with visual cues and timing.
                </p>
                <Button disabled className="w-full">
                  <Video className="h-4 w-4 mr-2" />
                  Generate Script
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Slide Deck</CardTitle>
                <CardDescription>Generate presentation slides with speaker notes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Coming soon: AI-powered slide deck generation with export to PowerPoint.
                </p>
                <Button disabled className="w-full">
                  <Presentation className="h-4 w-4 mr-2" />
                  Generate Slides
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generation History</CardTitle>
              <CardDescription>View all your AI content generation jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {jobs.map(job => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {job.job_type === 'course' && <BookOpen className="h-4 w-4" />}
                        {job.job_type === 'quiz' && <HelpCircle className="h-4 w-4" />}
                        {job.job_type === 'translation' && <Languages className="h-4 w-4" />}
                        {job.job_type === 'video_script' && <Video className="h-4 w-4" />}
                        {job.job_type === 'slide_deck' && <Presentation className="h-4 w-4" />}
                        <div>
                          <p className="font-medium capitalize">{job.job_type.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(job.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.total_tokens && (
                          <span className="text-xs text-muted-foreground">
                            {(job.total_tokens / 1000).toFixed(1)}K tokens
                          </span>
                        )}
                        {getStatusBadge(job.status)}
                      </div>
                    </div>
                  ))}
                  {jobs.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No generation history yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Course Preview Dialog */}
      <Dialog open={!!previewCourse} onOpenChange={() => setPreviewCourse(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {previewCourse && (
            <>
              <DialogHeader>
                <DialogTitle>{previewCourse.title}</DialogTitle>
                <DialogDescription>{previewCourse.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <h4 className="font-medium mb-2">Learning Objectives</h4>
                  <ul className="list-disc list-inside text-sm">
                    {previewCourse.learning_objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Modules ({previewCourse.modules.length})</h4>
                  <div className="space-y-2">
                    {previewCourse.modules.map((module, i) => (
                      <div key={i} className="p-3 border rounded">
                        <p className="font-medium">{module.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {module.lessons.length} lessons
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewCourse(null)}>
                  Close
                </Button>
                {previewCourse.status === 'draft' && (
                  <Button
                    onClick={() => {
                      handleApproveCourse(previewCourse.id);
                      setPreviewCourse(null);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve Course
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AIContentStudio;
