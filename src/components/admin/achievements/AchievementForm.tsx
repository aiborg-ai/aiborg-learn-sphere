import React from 'react';
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
import type { AchievementFormData } from './types';

interface AchievementFormProps {
  formData: AchievementFormData;
  onChange: (data: AchievementFormData) => void;
}

export const AchievementForm: React.FC<AchievementFormProps> = ({ formData, onChange }) => {
  const handleChange = (field: keyof AchievementFormData, value: string | number | boolean) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="achievement-name">Name</Label>
          <Input
            id="achievement-name"
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            placeholder="Achievement name"
            className="bg-gray-800 border-gray-700"
          />
        </div>
        <div>
          <Label htmlFor="achievement-icon">Emoji Icon</Label>
          <Input
            id="achievement-icon"
            value={formData.icon_emoji}
            onChange={e => handleChange('icon_emoji', e.target.value)}
            placeholder="🏆"
            className="bg-gray-800 border-gray-700"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="achievement-description">Description</Label>
        <Textarea
          id="achievement-description"
          value={formData.description}
          onChange={e => handleChange('description', e.target.value)}
          placeholder="What does this achievement represent?"
          className="bg-gray-800 border-gray-700"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="achievement-category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={value => handleChange('category', value)}
          >
            <SelectTrigger id="achievement-category" className="bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="course_completion">Course Completion</SelectItem>
              <SelectItem value="skill_mastery">Skill Mastery</SelectItem>
              <SelectItem value="engagement">Engagement</SelectItem>
              <SelectItem value="milestone">Milestone</SelectItem>
              <SelectItem value="special">Special</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="achievement-rarity">Rarity</Label>
          <Select value={formData.rarity} onValueChange={value => handleChange('rarity', value)}>
            <SelectTrigger id="achievement-rarity" className="bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="common">Common</SelectItem>
              <SelectItem value="rare">Rare</SelectItem>
              <SelectItem value="epic">Epic</SelectItem>
              <SelectItem value="legendary">Legendary</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="achievement-points">Points</Label>
        <Input
          id="achievement-points"
          type="number"
          value={formData.points}
          onChange={e => handleChange('points', parseInt(e.target.value))}
          className="bg-gray-800 border-gray-700"
        />
      </div>
    </div>
  );
};
