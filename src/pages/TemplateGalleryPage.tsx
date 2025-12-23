/**
 * Template Gallery Page
 *
 * Public gallery of dashboard templates that users can browse and clone
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Star,
  TrendingUp,
  Clock,
  Grid3x3,
  LayoutGrid,
} from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TemplateCard } from '@/components/dashboard-builder/TemplateCard';
import { TemplateGalleryService } from '@/services/dashboard/TemplateGalleryService';
import type { TemplateFilters, TemplateSortBy } from '@/types/dashboard';

export default function TemplateGalleryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<TemplateSortBy>('popular');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Set page title
  useEffect(() => {
    document.title = 'Template Gallery | AiBorg Learn Sphere';
  }, []);

  // Build filters
  const filters: TemplateFilters = {
    search: searchQuery || undefined,
    category: category !== 'all' ? category : undefined,
    sortBy,
  };

  // Fetch templates
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-templates', filters, page],
    queryFn: async () => {
      return await TemplateGalleryService.getTemplates(filters, page);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleClone = (viewId: string) => {
    navigate(`/dashboard-builder?view=${viewId}`);
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Templates</h1>
              <p className="text-muted-foreground mt-1">
                Browse and clone pre-built dashboard layouts
              </p>
            </div>

            <Button onClick={() => navigate('/dashboard-builder')}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Create Custom Dashboard
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            {/* Category */}
            <Select
              value={category}
              onValueChange={value => {
                setCategory(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Tabs
              value={sortBy}
              onValueChange={v => {
                setSortBy(v as TemplateSortBy);
                setPage(1);
              }}
            >
              <TabsList>
                <TabsTrigger value="popular" title="Most Popular">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Popular</span>
                </TabsTrigger>
                <TabsTrigger value="rating" title="Highest Rated">
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Top Rated</span>
                </TabsTrigger>
                <TabsTrigger value="recent" title="Most Recent">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Recent</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* View Mode */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
              aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Results count */}
        {data && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              {data.total} {data.total === 1 ? 'template' : 'templates'} found
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div
            className={cn(
              'grid gap-6',
              viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            )}
          >
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load templates</p>
            <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && data && data.templates.length === 0 && (
          <div className="text-center py-12">
            <LayoutGrid className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search or filters</p>
            <Button onClick={() => navigate('/dashboard-builder')}>
              Create Your Own Dashboard
            </Button>
          </div>
        )}

        {/* Templates Grid */}
        {!isLoading && !error && data && data.templates.length > 0 && (
          <>
            <div
              className={cn(
                'grid gap-6',
                viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              )}
            >
              {data.templates.map(template => (
                <TemplateCard key={template.id} template={template} onClone={handleClone} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;

                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        onClick={() => setPage(pageNum)}
                        size="icon"
                        aria-label={`Go to page ${pageNum}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Featured Badge Info */}
        <div className="mt-12 p-6 border rounded-lg bg-muted/30">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Featured Templates</h3>
              <p className="text-sm text-muted-foreground">
                Templates marked as{' '}
                <Badge variant="default" className="mx-1">
                  Featured
                </Badge>{' '}
                are hand-picked by our team for their design quality and usefulness. Clone them to
                get started quickly with a professional dashboard layout.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
