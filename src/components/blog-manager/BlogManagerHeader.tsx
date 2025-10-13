import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface BlogManagerHeaderProps {
  onNewCategory: () => void;
  onNewPost: () => void;
}

export function BlogManagerHeader({ onNewCategory, onNewPost }: BlogManagerHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-3xl font-bold">Blog Management</h2>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onNewCategory}>
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
        <Button onClick={onNewPost}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>
    </div>
  );
}
