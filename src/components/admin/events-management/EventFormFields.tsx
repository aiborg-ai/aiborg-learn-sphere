import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Event } from './types';

interface EventFormFieldsProps {
  register: UseFormRegister<Event>;
  errors: FieldErrors<Event>;
  watchIsActive: boolean;
  watchIsVisible: boolean;
}

export function EventFormFields({
  register,
  errors,
  watchIsActive,
  watchIsVisible,
}: EventFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          {...register('title', { required: 'Title is required' })}
          placeholder="AI Workshop 2024"
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...register('description', { required: 'Description is required' })}
          placeholder="Join us for an intensive workshop on AI fundamentals..."
          rows={4}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event_type">Event Type</Label>
          <select
            id="event_type"
            {...register('event_type')}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="workshop">Workshop</option>
            <option value="seminar">Seminar</option>
            <option value="bootcamp">Bootcamp</option>
            <option value="webinar">Webinar</option>
            <option value="conference">Conference</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            {...register('location', { required: 'Location is required' })}
            placeholder="Online / Tech Hub / Virtual"
          />
          {errors.location && <p className="text-sm text-red-500">{errors.location.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event_date">Event Date *</Label>
          <Input
            id="event_date"
            type="date"
            {...register('event_date', { required: 'Date is required' })}
          />
          {errors.event_date && <p className="text-sm text-red-500">{errors.event_date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="event_time">Event Time</Label>
          <Input id="event_time" type="time" {...register('event_time')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_capacity">Max Capacity *</Label>
          <Input
            id="max_capacity"
            type="number"
            {...register('max_capacity', {
              required: 'Capacity is required',
              min: { value: 1, message: 'Capacity must be at least 1' },
            })}
            placeholder="50"
          />
          {errors.max_capacity && (
            <p className="text-sm text-red-500">{errors.max_capacity.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex items-center space-x-2">
          <Switch id="is_active" {...register('is_active')} defaultChecked={watchIsActive} />
          <Label htmlFor="is_active">Active</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="is_visible" {...register('is_visible')} defaultChecked={watchIsVisible} />
          <Label htmlFor="is_visible">Visible on Website</Label>
        </div>
      </div>
    </>
  );
}
