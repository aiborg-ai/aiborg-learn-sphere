/**
 * ForumCategoryPage Component
 * Display threads in a category with filters and sorting
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThreadCard, ThreadFilters } from '@/components/forum';
import { useForumCategory, useForumThreads } from '@/hooks/forum';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ThreadFilters as ThreadFiltersType } from '@/types/forum';

export default function ForumCategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { user } = useAuth();
  const { category, isLoading: isLoadingCategory } = useForumCategory(categorySlug || '');

  const [filters, setFilters] = useState<ThreadFiltersType>({
    category_id: category?.id,
    sort_by: 'hot',
    time_range: 'all',
  });

  const { threads, pinnedThreads, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useForumThreads(filters);

  const handleSortChange = (sort: 'hot' | 'new' | 'top' | 'controversial') => {
    setFilters(prev => ({ ...prev, sort_by: sort }));
  };

  const handleTimeRangeChange = (range: ThreadFiltersType['time_range']) => {
    setFilters(prev => ({ ...prev, time_range: range }));
  };

  const handleSearchChange = (query: string) => {
    setFilters(prev => ({ ...prev, search_query: query }));
  };

  if (isLoadingCategory) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-40 w-full mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Category not found.{' '}
            <Link to="/forum" className="underline">
              Return to forum
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Header */}
      <div className="border-b border-gray-200" style={{ backgroundColor: `${category.color}10` }}>
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link to="/forum" className="hover:text-blue-600">
              Forum
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium" style={{ color: category.color }}>
              {category.name}
            </span>
          </div>

          {/* Category Info */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
              {category.description && (
                <p className="text-gray-600 text-lg">{category.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <span>{category.thread_count} threads</span>
                <span>•</span>
                <span>{category.post_count} posts</span>
              </div>
            </div>

            {/* New Thread Button */}
            {user && (
              <Button size="lg" style={{ backgroundColor: category.color }}>
                <Plus className="h-5 w-5 mr-2" />
                New Thread
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Thread List */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Filters */}
          <ThreadFilters
            onSortChange={handleSortChange}
            onTimeRangeChange={handleTimeRangeChange}
            onSearchChange={handleSearchChange}
            currentSort={filters.sort_by}
            currentTimeRange={filters.time_range}
          />

          {/* Pinned Threads */}
          {pinnedThreads.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Pinned</h2>
              {pinnedThreads.map(thread => (
                <ThreadCard key={thread.id} thread={thread} showCategory={false} />
              ))}
              <div className="border-t border-gray-300 my-6" />
            </div>
          )}

          {/* Thread List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <Alert>
              <AlertDescription>
                No threads yet in this category.
                {user ? ' Be the first to start a discussion!' : ' Sign in to start a discussion.'}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-4">
                {threads.map(thread => (
                  <ThreadCard key={thread.id} thread={thread} showCategory={false} />
                ))}
              </div>

              {/* Load More */}
              {hasNextPage && (
                <div className="flex justify-center pt-6">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
