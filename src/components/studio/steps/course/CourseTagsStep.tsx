/**
 * CourseTagsStep Component
 * Step 6: Tags and keywords for categorization and SEO
 */

import React, { useState } from 'react';
import { Tag, Plus, X } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DragDropTagManager } from '@/components/studio/shared/DragDropTagManager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StepComponentProps, CourseWizardData, Tag as TagType } from '@/types/studio.types';

// Sample available tags (in real app, fetch from database)
const AVAILABLE_TAGS: TagType[] = [
  { id: '1', name: 'AI', category: 'technology' },
  { id: '2', name: 'Machine Learning', category: 'technology' },
  { id: '3', name: 'Leadership', category: 'skills' },
  { id: '4', name: 'Management', category: 'skills' },
  { id: '5', name: 'Python', category: 'technology' },
  { id: '6', name: 'Data Science', category: 'technology' },
  { id: '7', name: 'Business Strategy', category: 'business' },
  { id: '8', name: 'Communication', category: 'skills' },
  { id: '9', name: 'Team Building', category: 'skills' },
  { id: '10', name: 'Innovation', category: 'business' },
  { id: '11', name: 'Digital Transformation', category: 'business' },
  { id: '12', name: 'Agile', category: 'methodology' },
];

export function CourseTagsStep({ data, onUpdate }: StepComponentProps<CourseWizardData>) {
  const [newKeyword, setNewKeyword] = useState('');

  // Add keyword
  const addKeyword = () => {
    if (newKeyword.trim() && !data.keywords.includes(newKeyword.trim())) {
      onUpdate({ keywords: [...data.keywords, newKeyword.trim()] });
      setNewKeyword('');
    }
  };

  // Remove keyword
  const removeKeyword = (index: number) => {
    onUpdate({ keywords: data.keywords.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Tag className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Tags & Keywords</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize your course with tags and improve discoverability with keywords
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Tags help students find your course when browsing. Keywords improve search engine
          visibility.
        </AlertDescription>
      </Alert>

      {/* Drag-Drop Tag Manager */}
      <div className="space-y-2">
        <div className="text-base font-medium">Course Tags</div>
        <p className="text-sm text-muted-foreground">
          Select and organize tags that best describe your course. Drag to reorder.
        </p>
        <DragDropTagManager
          availableTags={AVAILABLE_TAGS}
          selectedTags={data.tags}
          onChange={tags => onUpdate({ tags })}
          maxTags={10}
          allowCustomTags
          placeholder="Search tags or create custom ones..."
        />
      </div>

      {/* SEO Keywords */}
      <div className="space-y-4">
        <div>
          <div className="text-base font-medium">SEO Keywords (Optional)</div>
          <p className="text-sm text-muted-foreground">
            Add keywords to help search engines find your course
          </p>
        </div>

        {/* Add Keyword Input */}
        <div className="flex gap-2">
          <Input
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            placeholder="Enter a keyword..."
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword();
              }
            }}
          />
          <Button onClick={addKeyword} disabled={!newKeyword.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>

        {/* Keywords List */}
        {data.keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.keywords.map((keyword, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                {keyword}
                <button
                  onClick={() => removeKeyword(index)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No keywords added yet</p>
        )}
      </div>
    </div>
  );
}
