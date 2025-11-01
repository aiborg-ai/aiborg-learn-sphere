import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { MediaUploadButton } from '@/components/ui/MediaUploadButton';
import { Course } from './types';

interface CourseBasicFieldsProps {
  register: UseFormRegister<Course>;
  errors: FieldErrors<Course>;
  setValue: UseFormSetValue<Course>;
  watch: UseFormWatch<Course>;
}

export function CourseBasicFields({ register, errors, setValue, watch }: CourseBasicFieldsProps) {
  const currentDescription = watch('description') || '';
  const currentImage = watch('image_url') || '';

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Basic Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Course Title *</Label>
          <Input
            id="title"
            {...register('title', { required: 'Title is required' })}
            placeholder="Introduction to AI"
          />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <select
            id="category"
            {...register('category')}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="AI">AI</option>
            <option value="Machine Learning">Machine Learning</option>
            <option value="Data Science">Data Science</option>
            <option value="Young Learners">Young Learners</option>
            <option value="Corporate Training">Corporate Training</option>
          </select>
        </div>
      </div>

      {/* Rich Text Editor for Description */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Description * (supports rich formatting)</div>
        <RichTextEditor
          content={currentDescription}
          onChange={content => setValue('description', content)}
          placeholder="Learn the fundamentals of artificial intelligence..."
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      {/* Course Image Upload */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Course Image/Thumbnail</div>
        <MediaUploadButton
          bucketName="course-images"
          onUploadComplete={url => setValue('image_url', url)}
          currentImage={currentImage}
          label="Upload Course Image"
          maxSizeMB={5}
        />
      </div>
    </div>
  );
}
