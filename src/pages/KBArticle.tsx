/**
 * Knowledge Base Article Reader
 * Display individual KB articles with TOC navigation, related articles, and ratings
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Clock,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Calendar,
  Tag,
  Share2,
} from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TOCItem {
  level: number;
  title: string;
  anchor: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  kb_category: string;
  kb_difficulty: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  view_count: number;
  metadata: {
    reading_time_minutes?: number;
    table_of_contents?: TOCItem[];
    related_articles?: string[];
    last_reviewed_date?: string;
  };
}

const KB_CATEGORIES: Record<string, { label: string; color: string }> = {
  ai_fundamentals: { label: 'AI/ML Fundamentals', color: 'bg-blue-100 text-blue-700' },
  ml_algorithms: { label: 'ML Algorithms', color: 'bg-purple-100 text-purple-700' },
  practical_tools: { label: 'Practical Tools', color: 'bg-green-100 text-green-700' },
  prompt_engineering: { label: 'Prompt Engineering', color: 'bg-yellow-100 text-yellow-700' },
  business_ai: { label: 'Business AI', color: 'bg-orange-100 text-orange-700' },
  ai_ethics: { label: 'AI Ethics', color: 'bg-red-100 text-red-700' },
  deployment: { label: 'MLOps & Deployment', color: 'bg-indigo-100 text-indigo-700' },
};

export default function KBArticle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  // Fetch article
  const { data: article, isLoading } = useQuery({
    queryKey: ['kb-article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vault_content')
        .select('*')
        .eq('slug', slug)
        .eq('is_knowledge_base', true)
        .eq('status', 'published')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Article not found');
        }
        throw error;
      }

      return data as Article;
    },
  });

  // Increment view count on mount
  useEffect(() => {
    if (article) {
      supabase
        .from('vault_content')
        .update({ view_count: (article.view_count || 0) + 1 })
        .eq('id', article.id)
        .then();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.id]);

  // Handle scroll for TOC active state
  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll('h2[id], h3[id]');
      let current = null;

      headings.forEach(heading => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100 && rect.top >= -100) {
          current = heading.id;
        }
      });

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Submit article rating
  const submitRating = useMutation({
    mutationFn: async (isHelpful: boolean) => {
      const { error } = await supabase.from('kb_article_ratings').insert({
        article_id: article!.id,
        is_helpful: isHelpful,
        user_id: null, // Anonymous for now
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setHasVoted(true);
      toast({
        title: 'Thank you for your feedback!',
        description: 'Your rating helps us improve our content',
      });
    },
    onError: () => {
      toast({
        title: 'Could not submit rating',
        description: 'You may have already rated this article',
        variant: 'destructive',
      });
    },
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.excerpt,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied!',
        description: 'Article link copied to clipboard',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="py-12">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Article not found</h2>
            <p className="text-muted-foreground mb-6">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/kb')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Knowledge Base
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryInfo = KB_CATEGORIES[article.kb_category];
  const toc = article.metadata?.table_of_contents || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/kb')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Button>
        </div>
      </div>

      <article className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_280px] gap-12">
          {/* Main Content */}
          <div className="max-w-4xl">
            {/* Breadcrumbs */}
            <nav className="mb-6 text-sm text-muted-foreground flex items-center gap-2">
              <Link to="/kb" className="hover:text-foreground">
                Knowledge Base
              </Link>
              <span>/</span>
              <Link to={`/kb?category=${article.kb_category}`} className="hover:text-foreground">
                {categoryInfo?.label}
              </Link>
              <span>/</span>
              <span className="text-foreground">{article.title}</span>
            </nav>

            {/* Article Header */}
            <header className="mb-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={categoryInfo?.color}>{categoryInfo?.label}</Badge>
                <Badge variant="outline">{article.kb_difficulty}</Badge>
                {article.metadata?.reading_time_minutes && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{article.metadata.reading_time_minutes} min read</span>
                  </div>
                )}
                {article.view_count > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>{article.view_count} views</span>
                  </div>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold leading-tight">{article.title}</h1>

              {article.excerpt && (
                <p className="text-xl text-muted-foreground leading-relaxed">{article.excerpt}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Published {new Date(article.created_at).toLocaleDateString()}</span>
                </div>
                {article.metadata?.last_reviewed_date && (
                  <div className="flex items-center gap-1">
                    <span>•</span>
                    <span>
                      Updated {new Date(article.metadata.last_reviewed_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={handleShare} className="ml-auto">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </header>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children, ...props }) => {
                    const text = String(children);
                    const id = text
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, '');
                    return (
                      <h2 id={id} {...props}>
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ children, ...props }) => {
                    const text = String(children);
                    const id = text
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, '');
                    return (
                      <h3 id={id} {...props}>
                        {children}
                      </h3>
                    );
                  },
                }}
              >
                {article.content}
              </ReactMarkdown>
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">TAGS</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator className="my-8" />

            {/* Article Rating */}
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold mb-3">Was this article helpful?</h3>
              {hasVoted ? (
                <p className="text-sm text-muted-foreground">Thank you for your feedback! 🎉</p>
              ) : (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => submitRating.mutate(true)}
                    disabled={submitRating.isPending}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Yes, helpful
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => submitRating.mutate(false)}
                    disabled={submitRating.isPending}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Not helpful
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-4 lg:self-start space-y-6">
            {/* Table of Contents */}
            {toc.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Table of Contents
                  </h3>
                  <nav className="space-y-1">
                    {toc.map((item, index) => (
                      <a
                        key={index}
                        href={`#${item.anchor}`}
                        className={`block text-sm py-1 transition-colors ${
                          item.level === 3 ? 'pl-4' : ''
                        } ${
                          activeSection === item.anchor
                            ? 'text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={e => {
                          e.preventDefault();
                          document.getElementById(item.anchor)?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          });
                        }}
                      >
                        {item.title}
                      </a>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            )}

            {/* Quick Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">Article Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <Badge variant="outline" className="text-xs">
                      {categoryInfo?.label}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Level</span>
                    <Badge variant="outline" className="text-xs">
                      {article.kb_difficulty}
                    </Badge>
                  </div>
                  {article.metadata?.reading_time_minutes && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reading time</span>
                      <span>{article.metadata.reading_time_minutes} min</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </article>
    </div>
  );
}
