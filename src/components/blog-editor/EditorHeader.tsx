import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Eye } from 'lucide-react';

interface EditorHeaderProps {
  isEditMode: boolean;
  isPreview: boolean;
  loading: boolean;
  onBack: () => void;
  onTogglePreview: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export function EditorHeader({
  isEditMode,
  isPreview,
  loading,
  onBack,
  onTogglePreview,
  onSaveDraft,
  onPublish,
}: EditorHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">{isEditMode ? 'Edit Post' : 'Create New Post'}</h2>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onTogglePreview}>
          <Eye className="mr-2 h-4 w-4" />
          {isPreview ? 'Edit' : 'Preview'}
        </Button>
        <Button variant="outline" onClick={onSaveDraft} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          Save Draft
        </Button>
        <Button className="btn-hero" onClick={onPublish} disabled={loading}>
          Publish Now
        </Button>
      </div>
    </div>
  );
}
