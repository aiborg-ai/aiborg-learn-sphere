import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Course } from './types';

interface CourseBasicFieldsProps {
  register: UseFormRegister<Course>;
  errors: FieldErrors<Course>;
}

export function CourseBasicFields({ register, errors }: CourseBasicFieldsProps) {
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

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...register('description', { required: 'Description is required' })}
          placeholder="Learn the fundamentals of artificial intelligence..."
          rows={4}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>
    </div>
  );
}
