import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Course } from './types';

interface CourseDetailsFieldsProps {
  register: UseFormRegister<Course>;
  errors: FieldErrors<Course>;
}

export function CourseDetailsFields({ register, errors }: CourseDetailsFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Course Details</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mode">Mode *</Label>
          <select id="mode" {...register('mode')} className="w-full px-3 py-2 border rounded-md">
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="level">Level *</Label>
          <select id="level" {...register('level')} className="w-full px-3 py-2 border rounded-md">
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="All Levels">All Levels</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration *</Label>
          <Input id="duration" {...register('duration')} placeholder="8 weeks / 40 hours" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price *</Label>
          <Input id="price" {...register('price')} placeholder="£5,100 / Free" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date *</Label>
          <Input
            id="start_date"
            type="date"
            {...register('start_date', { required: 'Start date is required' })}
          />
          {errors.start_date && <p className="text-sm text-red-500">{errors.start_date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sort_order">Display Order</Label>
          <Input id="sort_order" type="number" {...register('sort_order')} placeholder="0" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prerequisites">Prerequisites</Label>
        <Textarea
          id="prerequisites"
          {...register('prerequisites')}
          placeholder="No prior experience required / Basic Python knowledge recommended"
          rows={2}
        />
      </div>
    </div>
  );
}
