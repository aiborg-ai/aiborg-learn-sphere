import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Video,
  FileText,
  Download,
  Trash2,
  CheckCircle,
  Loader2,
  Link as LinkIcon,
  CloudUpload,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface MaterialUploadSectionProps {
  courseId: number;
  courseName: string;
  onUploadComplete?: () => void;
}

interface CourseMaterial {
  id: string;
  course_id: number;
  title: string;
  description?: string;
  material_type: string;
  file_url: string;
  duration?: number;
  file_size?: number;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export function MaterialUploadSection({
  courseId,
  courseName,
  onUploadComplete,
}: MaterialUploadSectionProps) {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    material_type: 'recording',
    file_url: '',
    duration: '',
    file_size: '',
  });
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMaterials();
  }, [courseId]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      logger.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill some fields
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
      }
      setFormData(prev => ({ ...prev, file_size: file.size.toString() }));
    }
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${courseId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('course-materials')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: progress => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(percent);
          },
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('course-materials').getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      logger.error('Error uploading file to storage:', error);
      throw error; // Re-throw to be caught by handleSubmit
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a title',
        variant: 'destructive',
      });
      return;
    }

    if (uploadMode === 'file' && !selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    if (uploadMode === 'url' && !formData.file_url) {
      toast({
        title: 'Missing URL',
        description: 'Please provide a file URL',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      let fileUrl = formData.file_url;

      // Upload file if in file mode
      if (uploadMode === 'file' && selectedFile) {
        fileUrl = await uploadFileToStorage(selectedFile);
      }

      const { error } = await supabase.from('course_materials').insert({
        course_id: courseId,
        title: formData.title,
        description: formData.description || null,
        material_type: formData.material_type,
        file_url: fileUrl,
        duration: formData.duration ? parseInt(formData.duration) : null,
        file_size: formData.file_size ? parseInt(formData.file_size) : null,
        sort_order: materials.length,
      });

      if (error) throw error;

      toast({
        title: 'Material Added!',
        description: 'Course material has been uploaded successfully',
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        material_type: 'recording',
        file_url: '',
        duration: '',
        file_size: '',
      });
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh materials list
      await fetchMaterials();
      onUploadComplete?.();
    } catch (error) {
      logger.error('Error uploading material:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload material',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      const { error } = await supabase
        .from('course_materials')
        .update({ is_active: false })
        .eq('id', materialId);

      if (error) throw error;

      toast({
        title: 'Material Deleted',
        description: 'Material has been removed from the course',
      });

      await fetchMaterials();
      onUploadComplete?.();
    } catch (error) {
      logger.error('Error deleting material:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete material',
        variant: 'destructive',
      });
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'recording':
        return <Video className="h-5 w-5 text-blue-500" />;
      case 'handbook':
      case 'presentation':
        return <FileText className="h-5 w-5 text-green-500" />;
      default:
        return <Download className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Material
          </CardTitle>
          <CardDescription>Add videos, documents, or resources for {courseName}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={uploadMode}
            onValueChange={v => setUploadMode(v as 'url' | 'file')}
            className="mb-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">
                <CloudUpload className="h-4 w-4 mr-2" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="url">
                <LinkIcon className="h-4 w-4 mr-2" />
                Paste URL
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-4">
            {uploadMode === 'file' && (
              <div className="space-y-2">
                <Label htmlFor="file">Select File *</Label>
                <Input
                  id="file"
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept="video/*,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,.doc,.docx"
                />
                {selectedFile && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-1">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      Uploading... {uploadProgress.toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Material Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Introduction to AI"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the material"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Material Type *</Label>
              <Select
                value={formData.material_type}
                onValueChange={value => setFormData({ ...formData, material_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recording">🎥 Video Recording</SelectItem>
                  <SelectItem value="handbook">📖 Handbook/PDF</SelectItem>
                  <SelectItem value="presentation">📊 Presentation</SelectItem>
                  <SelectItem value="other">📎 Other Resource</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {uploadMode === 'url' && (
              <div className="space-y-2">
                <Label htmlFor="file_url">File URL *</Label>
                <Input
                  id="file_url"
                  type="url"
                  value={formData.file_url}
                  onChange={e => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://example.com/video.mp4"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Upload files to your storage (Google Drive, Dropbox, etc.) and paste the shareable
                  link here
                </p>
              </div>
            )}

            {formData.material_type === 'recording' && (
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="3600"
                />
                <p className="text-xs text-muted-foreground">e.g., 3600 for 1 hour</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="file_size">File Size (bytes)</Label>
              <Input
                id="file_size"
                type="number"
                value={formData.file_size}
                onChange={e => setFormData({ ...formData, file_size: e.target.value })}
                placeholder="10485760"
              />
              <p className="text-xs text-muted-foreground">Optional: File size in bytes</p>
            </div>

            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Add Material
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Materials List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Uploaded Materials ({materials.length})
          </CardTitle>
          <CardDescription>Current materials for this course</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : materials.length > 0 ? (
              <div className="space-y-3">
                {materials.map(material => (
                  <div key={material.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    {getMaterialIcon(material.material_type)}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{material.title}</h4>
                      {material.description && (
                        <p className="text-sm text-muted-foreground mt-1">{material.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {material.material_type}
                        </Badge>
                        {material.duration && (
                          <span className="text-xs text-muted-foreground">
                            {Math.floor(material.duration / 60)}m
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(material.file_url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(material.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No materials uploaded yet. Add your first material using the form.
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
