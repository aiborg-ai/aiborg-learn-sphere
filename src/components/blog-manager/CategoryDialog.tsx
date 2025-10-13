import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryForm: {
    name: string;
    slug: string;
    description: string;
    color: string;
  };
  onFormChange: (field: string, value: string) => void;
  onSubmit: () => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  categoryForm,
  onFormChange,
  onSubmit,
}: CategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
          <DialogDescription>Add a new category for blog posts</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={categoryForm.name}
              onChange={e => onFormChange('name', e.target.value)}
              placeholder="e.g., Technology"
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={categoryForm.slug}
              onChange={e => onFormChange('slug', e.target.value)}
              placeholder="e.g., technology"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={categoryForm.description}
              onChange={e => onFormChange('description', e.target.value)}
              placeholder="Category description..."
            />
          </div>
          <div>
            <Label>Color</Label>
            <Input
              type="color"
              value={categoryForm.color}
              onChange={e => onFormChange('color', e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit}>Create Category</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
