/**
 * SearchPage Component
 * Dedicated full-page search experience with filters and pagination
 */

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { SearchFilters } from '@/components/search/SearchFilters';
import { useSearch, useSearchFilters } from '@/hooks/useSearch';
import type { SearchResult } from '@/services/search/SearchService';
import { Search, Sparkles, ArrowLeft, Info, Lightbulb, TrendingUp } from '@/components/ui/icons';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get initial query from URL
  const initialQuery = searchParams.get('q') || '';

  // Search filters
  const {
    contentTypes,
    minRelevance,
    setContentTypes,
    setMinRelevance,
    _toggleContentType,
    resetFilters,
    hasFilters,
  } = useSearchFilters();

  // Search hook
  const { query, setQuery, results, isLoading, error, hasQuery, hasResults } = useSearch(
    initialQuery,
    {
      contentTypes,
      minRelevance,
      limit: 50,
    }
  );

  // Update URL when query changes
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  }, [query, setSearchParams]);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'course':
        navigate(`/course/${result.id}`);
        break;
      case 'learning_path':
        navigate(`/learning-path/ai/${result.id}`);
        break;
      case 'blog_post':
        navigate(`/blog/${result.id}`);
        break;
      case 'assignment':
      case 'material':
        navigate(result.metadata?.url || '/');
        break;
    }
  };

  // Group results by content type for better organization
  const _resultsByType = results.reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Search className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Search</h1>
              <p className="text-white/80">AI-powered semantic search across all content</p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative max-w-3xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search courses, learning paths, blog posts..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-10 pr-12 h-12 text-lg bg-white/95 backdrop-blur-sm"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <SearchFilters
                contentTypes={contentTypes}
                minRelevance={minRelevance}
                onContentTypesChange={setContentTypes}
                onMinRelevanceChange={setMinRelevance}
                onReset={resetFilters}
                hasFilters={hasFilters}
              />
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Results Header */}
            {hasQuery && !isLoading && (
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {results.length > 0 ? (
                        <>
                          <Sparkles className="h-5 w-5 text-yellow-500" />
                          <p className="text-sm font-medium">
                            Found {results.length} result{results.length !== 1 ? 's' : ''} for "
                            <span className="text-primary">{query}</span>"
                          </p>
                        </>
                      ) : (
                        <>
                          <Info className="h-5 w-5 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            No results found for "{query}"
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="bg-white/95 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <div className="flex gap-2">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-20" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <Alert variant="destructive" className="bg-white/95 backdrop-blur-sm">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Failed to search. Please try again or check your connection.
                </AlertDescription>
              </Alert>
            )}

            {/* Empty State - No Query */}
            {!hasQuery && !isLoading && (
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                      <Lightbulb className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Start Your Search</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Our AI-powered search understands natural language. Try queries like:
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        "machine learning for beginners"
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        "web development courses"
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        "data science learning path"
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Grid */}
            {!isLoading && hasResults && (
              <div className="grid grid-cols-1 gap-4">
                {results.map(result => (
                  <SearchResultCard
                    key={`${result.type}-${result.id}`}
                    result={result}
                    onClick={handleResultClick}
                    showFullDescription={false}
                  />
                ))}
              </div>
            )}

            {/* No Results with Suggestions */}
            {!isLoading && hasQuery && !hasResults && (
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100">
                      <Info className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                        We couldn't find any content matching "{query}"
                      </p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Try:</p>
                        <ul className="list-disc list-inside">
                          <li>Using different keywords</li>
                          <li>Checking your spelling</li>
                          <li>Using more general terms</li>
                          <li>Adjusting filters to show more content types</li>
                        </ul>
                      </div>
                    </div>
                    <Button variant="outline" onClick={resetFilters}>
                      Reset All Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
