import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import {
  EditorHeader,
  ContentEditor,
  SEOSettings,
  PostSettings,
  BlogPreview,
} from '@/components/blog-editor';

interface BlogPost {
  id: string;
  title?: string;
  published_at?: string;
  [key: string]: unknown;
}

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

interface BlogPostEditorProps {
  post?: BlogPost;
  onClose: () => void;
}

function BlogPostEditor({ post, onClose }: BlogPostEditorProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category_id: '',
    featured_image: '',
    status: 'draft',
    is_featured: false,
    is_sticky: false,
    allow_comments: true,
    meta_title: '',
    meta_description: '',
    seo_keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
    canonical_url: '',
    scheduled_for: '',
    reading_time: 0,
  });
  const [preview, setPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchTags();
    if (post) {
      loadPost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    setCategories(data || []);
  };

  const fetchTags = async () => {
    const { data } = await supabase.from('blog_tags').select('*').order('name');
    setTags(data || []);
  };

  const loadPost = async () => {
    if (!post) return;

    const { data: postData } = await supabase
      .from('blog_posts')
      .select(
        `
        *,
        blog_post_tags(tag_id)
      `
      )
      .eq('id', post.id)
      .single();

    if (postData) {
      setFormData({
        ...formData,
        ...postData,
        scheduled_for: postData.scheduled_for || '',
      });

      const tagIds = postData.blog_post_tags?.map((pt: { tag_id: string }) => pt.tag_id) || [];
      setSelectedTags(tagIds);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const handleSave = async (publishNow = false) => {
    try {
      setLoading(true);

      const saveData = {
        ...formData,
        status: publishNow ? 'published' : formData.status,
        published_at: publishNow && !post?.published_at ? new Date().toISOString() : undefined,
        reading_time: calculateReadingTime(formData.content),
        last_modified_by: (await supabase.auth.getUser()).data.user?.id,
      };

      let result;
      if (post) {
        // Update existing post
        result = await supabase
          .from('blog_posts')
          .update(saveData)
          .eq('id', post.id)
          .select()
          .single();
      } else {
        // Create new post
        result = await supabase.from('blog_posts').insert(saveData).select().single();
      }

      if (result.error) throw result.error;

      // Handle tags
      if (result.data) {
        // Delete existing tags
        await supabase.from('blog_post_tags').delete().eq('post_id', result.data.id);

        // Insert new tags
        if (selectedTags.length > 0) {
          await supabase.from('blog_post_tags').insert(
            selectedTags.map(tag_id => ({
              post_id: result.data.id,
              tag_id,
            }))
          );
        }
      }

      toast({
        title: 'Success',
        description: `Post ${post ? 'updated' : 'created'} successfully`,
      });

      onClose();
    } catch (error) {
      logger.error('Error saving post:', error);
      toast({
        title: 'Error',
        description: 'Failed to save post',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const insertMarkdown = (before: string, after = '') => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const replacement = `${before}${selectedText}${after}`;

    const newContent =
      formData.content.substring(0, start) + replacement + formData.content.substring(end);

    setFormData({ ...formData, content: newContent });

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleTagToggle = (tagId: string, checked: boolean) => {
    if (checked) {
      setSelectedTags([...selectedTags, tagId]);
    } else {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    }
  };

  return (
    <div className="space-y-6">
      <EditorHeader
        isEditMode={!!post}
        isPreview={preview}
        loading={loading}
        onBack={onClose}
        onTogglePreview={() => setPreview(!preview)}
        onSaveDraft={() => handleSave(false)}
        onPublish={() => handleSave(true)}
      />

      {preview ? (
        <BlogPreview
          title={formData.title}
          excerpt={formData.excerpt}
          featuredImage={formData.featured_image}
          content={formData.content}
          parseMarkdown={parseMarkdown}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <ContentEditor
              title={formData.title}
              slug={formData.slug}
              excerpt={formData.excerpt}
              content={formData.content}
              readingTime={calculateReadingTime(formData.content)}
              onChange={handleFieldChange}
              onGenerateSlug={() => handleFieldChange('slug', generateSlug(formData.title))}
              onInsertMarkdown={insertMarkdown}
            />

            <SEOSettings
              metaTitle={formData.meta_title}
              metaDescription={formData.meta_description}
              seoKeywords={formData.seo_keywords}
              canonicalUrl={formData.canonical_url}
              onChange={handleFieldChange}
            />
          </div>

          {/* Sidebar */}
          <div>
            <PostSettings
              status={formData.status}
              scheduledFor={formData.scheduled_for}
              categoryId={formData.category_id}
              isFeatured={formData.is_featured}
              isSticky={formData.is_sticky}
              allowComments={formData.allow_comments}
              featuredImage={formData.featured_image}
              categories={categories}
              tags={tags}
              selectedTags={selectedTags}
              onChange={handleFieldChange}
              onTagToggle={handleTagToggle}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Simple markdown parser for preview
function parseMarkdown(content: string): string {
  return content
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

export default BlogPostEditor;
