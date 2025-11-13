/**
 * GlobalSearchEnhanced Component
 * Enhanced search with AI-powered semantic search
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  FileText,
  Video,
  MapPin,
  FileQuestion,
  Sparkles,
  ArrowRight,
  Search,
  Loader2,
} from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import type { SearchResult, ContentType } from '@/services/search/SearchService';
import { cn } from '@/lib/utils';

const CONTENT_TYPE_ICONS: Record<ContentType, React.ReactNode> = {
  course: <BookOpen className="h-4 w-4" />,
  learning_path: <MapPin className="h-4 w-4" />,
  blog_post: <FileText className="h-4 w-4" />,
  assignment: <FileQuestion className="h-4 w-4" />,
  material: <Video className="h-4 w-4" />,
};

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  course: 'Course',
  learning_path: 'Learning Path',
  blog_post: 'Blog Post',
  assignment: 'Assignment',
  material: 'Material',
};

function getRelevanceColor(score: number): string {
  if (score >= 0.8) return 'bg-green-500/10 text-green-700';
  if (score >= 0.6) return 'bg-blue-500/10 text-blue-700';
  if (score >= 0.4) return 'bg-yellow-500/10 text-yellow-700';
  return 'bg-gray-500/10 text-gray-700';
}

function getMatchTypeBadge(matchType: 'keyword' | 'semantic' | 'hybrid') {
  if (matchType === 'semantic') {
    return (
      <Badge variant="secondary" className="gap-1 text-xs">
        <Sparkles className="h-3 w-3" />
        AI Match
      </Badge>
    );
  }
  if (matchType === 'hybrid') {
    return (
      <Badge variant="default" className="gap-1 text-xs">
        <Sparkles className="h-3 w-3" />
        Perfect Match
      </Badge>
    );
  }
  return null;
}

interface SearchResultItemProps {
  result: SearchResult;
  onSelect: () => void;
}

function SearchResultItem({ result, onSelect }: SearchResultItemProps) {
  const relevancePercent = Math.round(result.relevanceScore * 100);

  return (
    <CommandItem
      key={`${result.type}-${result.id}`}
      value={`${result.title} ${result.description}`}
      onSelect={onSelect}
      className="flex items-start gap-3 py-3"
    >
      {/* Icon */}
      <div className="shrink-0 mt-0.5">{CONTENT_TYPE_ICONS[result.type]}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium line-clamp-1">{result.title}</span>
          {getMatchTypeBadge(result.matchType)}
        </div>
        {result.description && (
          <p className="text-sm text-muted-foreground line-clamp-1">{result.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {CONTENT_TYPE_LABELS[result.type]}
          </Badge>
          <Badge className={cn('text-xs', getRelevanceColor(result.relevanceScore))}>
            {relevancePercent}% match
          </Badge>
        </div>
      </div>
    </CommandItem>
  );
}

export function GlobalSearchEnhanced() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const {
    query,
    setQuery,
    results,
    isLoading,
    hasQuery,
    hasResults,
  } = useSearch('', {
    limit: 10,
    minRelevance: 0.3,
  });

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open, setQuery]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);

    // Navigate based on content type
    switch (result.type) {
      case 'course':
        navigate(`/courses/${result.id}`);
        break;
      case 'learning_path':
        navigate(`/learning-paths/${result.id}`);
        break;
      case 'blog_post':
        navigate(`/blog/${result.id}`);
        break;
      case 'assignment':
      case 'material':
        navigate(result.metadata?.url || '/');
        break;
      default:
        break;
    }
  };

  const handleViewAllResults = () => {
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  // Group results by type
  const resultsByType = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<ContentType, SearchResult[]>);

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search everything...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Search Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search courses, paths, blog posts..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {/* Loading State */}
          {isLoading && hasQuery && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Searching with AI...
            </div>
          )}

          {/* Empty State */}
          {!isLoading && hasQuery && !hasResults && (
            <CommandEmpty>
              <div className="py-6 text-center">
                <p className="text-sm font-medium mb-1">No results found</p>
                <p className="text-xs text-muted-foreground">
                  Try different keywords or check your spelling
                </p>
              </div>
            </CommandEmpty>
          )}

          {/* Results Grouped by Type */}
          {!isLoading && hasResults && (
            <>
              {Object.entries(resultsByType).map(([type, typeResults]) => (
                <div key={type}>
                  <CommandGroup heading={CONTENT_TYPE_LABELS[type as ContentType] + 's'}>
                    {typeResults.map((result) => (
                      <SearchResultItem
                        key={`${result.type}-${result.id}`}
                        result={result}
                        onSelect={() => handleSelect(result)}
                      />
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </div>
              ))}

              {/* View All Results Button */}
              {results.length >= 10 && (
                <CommandGroup>
                  <CommandItem onSelect={handleViewAllResults} className="justify-center">
                    <span className="text-sm font-medium flex items-center gap-2">
                      View all results
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </CommandItem>
                </CommandGroup>
              )}
            </>
          )}

          {/* Initial State - Show Tips */}
          {!hasQuery && (
            <div className="py-6 px-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  AI-Powered Search
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Try natural language queries like:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>• "machine learning for beginners"</li>
                  <li>• "web development courses"</li>
                  <li>• "data science learning path"</li>
                </ul>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">⌘K</kbd> to
                  open • <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">↵</kbd>{' '}
                  to select • <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">
                    esc
                  </kbd>{' '}
                  to close
                </p>
              </div>
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
