import { Button } from '@/components/ui/button';
import { Plus, Sparkles, Calendar } from '@/components/ui/icons';
import { Link } from 'react-router-dom';

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
        <Button
          asChild
          variant="default"
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          <Link to="/admin/ai-blog-workflow">
            <Sparkles className="mr-2 h-4 w-4" />
            AI Blog Generator
          </Link>
        </Button>
        <Button
          asChild
          variant="default"
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          <Link to="/admin/batch-blog-scheduler">
            <Calendar className="mr-2 h-4 w-4" />
            <Sparkles className="mr-2 h-4 w-4" />
            Batch Scheduler
          </Link>
        </Button>
        <Button onClick={onNewPost}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>
    </div>
  );
}
