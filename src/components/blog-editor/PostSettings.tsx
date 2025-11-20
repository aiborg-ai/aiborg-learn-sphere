import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Image, Tag } from '@/components/ui/icons';

interface Category {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  sort_order: number;
}

interface Tag {
  id: string;
  name: string;
}

interface PostSettingsProps {
  status: string;
  scheduledFor: string;
  categoryId: string;
  isFeatured: boolean;
  isSticky: boolean;
  allowComments: boolean;
  featuredImage: string;
  categories: Category[];
  tags: Tag[];
  selectedTags: string[];
  onChange: (field: string, value: string | boolean) => void;
  onTagToggle: (tagId: string, checked: boolean) => void;
}

export function PostSettings({
  status,
  scheduledFor,
  categoryId,
  isFeatured,
  isSticky,
  allowComments,
  featuredImage,
  categories,
  tags,
  selectedTags,
  onChange,
  onTagToggle,
}: PostSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Publish Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Publish Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={value => onChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === 'scheduled' && (
            <div>
              <Label htmlFor="scheduled_for">Schedule For</Label>
              <Input
                id="scheduled_for"
                type="datetime-local"
                value={scheduledFor}
                onChange={e => onChange('scheduled_for', e.target.value)}
              />
            </div>
          )}

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={value => onChange('category_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_featured">Featured Post</Label>
            <Switch
              id="is_featured"
              checked={isFeatured}
              onCheckedChange={checked => onChange('is_featured', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_sticky">Pin to Top</Label>
            <Switch
              id="is_sticky"
              checked={isSticky}
              onCheckedChange={checked => onChange('is_sticky', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="allow_comments">Allow Comments</Label>
            <Switch
              id="allow_comments"
              checked={allowComments}
              onCheckedChange={checked => onChange('allow_comments', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Featured Image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Featured Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {featuredImage && (
              <img src={featuredImage} alt="Featured" className="w-full rounded-lg" />
            )}
            <Input
              value={featuredImage}
              onChange={e => onChange('featured_image', e.target.value)}
              placeholder="Image URL"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tags.map(tag => (
              <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.id)}
                  onChange={e => onTagToggle(tag.id, e.target.checked)}
                />
                <Badge variant="outline">{tag.name}</Badge>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
