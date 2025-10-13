import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BlogPost, BlogCategory } from '@/types/blog';

interface PostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPost: BlogPost | null;
  postForm: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featured_image: string;
    category_id: string;
    status: BlogPost['status'];
    is_featured: boolean;
    allow_comments: boolean;
    meta_title: string;
    meta_description: string;
  };
  categories: BlogCategory[];
  onFormChange: (field: string, value: string | boolean) => void;
  onSubmit: () => void;
}

export function PostDialog({
  open,
  onOpenChange,
  editingPost,
  postForm,
  categories,
  onFormChange,
  onSubmit,
}: PostDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input
                value={postForm.title}
                onChange={e => onFormChange('title', e.target.value)}
                placeholder="Post title"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={postForm.slug}
                onChange={e => onFormChange('slug', e.target.value)}
                placeholder="post-slug (auto-generated if empty)"
              />
            </div>
          </div>

          <div>
            <Label>Excerpt</Label>
            <Textarea
              value={postForm.excerpt}
              onChange={e => onFormChange('excerpt', e.target.value)}
              placeholder="Brief description of the post..."
              rows={2}
            />
          </div>

          <div>
            <Label>Content</Label>
            <Textarea
              value={postForm.content}
              onChange={e => onFormChange('content', e.target.value)}
              placeholder="Write your post content here..."
              rows={10}
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select
                value={postForm.category_id}
                onValueChange={value => onFormChange('category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={postForm.status}
                onValueChange={value => onFormChange('status', value)}
              >
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
          </div>

          <div>
            <Label>Featured Image URL</Label>
            <Input
              value={postForm.featured_image}
              onChange={e => onFormChange('featured_image', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Meta Title (SEO)</Label>
              <Input
                value={postForm.meta_title}
                onChange={e => onFormChange('meta_title', e.target.value)}
                placeholder="SEO title (max 160 chars)"
                maxLength={160}
              />
            </div>
            <div>
              <Label>Meta Description (SEO)</Label>
              <Input
                value={postForm.meta_description}
                onChange={e => onFormChange('meta_description', e.target.value)}
                placeholder="SEO description (max 320 chars)"
                maxLength={320}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={postForm.is_featured}
                  onCheckedChange={checked => onFormChange('is_featured', checked)}
                />
                <Label>Featured Post</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={postForm.allow_comments}
                  onCheckedChange={checked => onFormChange('allow_comments', checked)}
                />
                <Label>Allow Comments</Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>{editingPost ? 'Update Post' : 'Create Post'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
