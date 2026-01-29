/**
 * Marketplace Page
 * Main page for exploring external AI courses
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  useMarketplaceCourses,
  useMarketplaceCategories,
  useMarketplaceFavorites,
  useMarketplaceRecommendations,
  useCourseComparison,
} from '@/hooks/useMarketplaceCourses';
import {
  MarketplaceFilters,
  CourseMarketplaceGrid,
  RecommendedCoursesSection,
  CourseComparisonModal,
} from '@/components/marketplace';
import { Scale, X, Globe, GraduationCap, BookOpen } from 'lucide-react';
import type {
  MarketplaceFilters as FilterType,
  MarketplaceSortOption,
  ExternalCourseWithProvider,
} from '@/types/marketplace';
import { DEFAULT_FILTERS, DEFAULT_SORT, DEFAULT_PAGE_SIZE } from '@/types/marketplace';

export default function MarketplacePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse URL params for initial state
  const initialFilters = useMemo<FilterType>(() => {
    const search = searchParams.get('search') || '';
    const providers = searchParams.get('providers')?.split(',').filter(Boolean) || [];
    const levels = searchParams.get('levels')?.split(',').filter(Boolean) || [];
    return {
      ...DEFAULT_FILTERS,
      search: search || undefined,
      providers: providers.length > 0 ? (providers as FilterType['providers']) : undefined,
      levels: levels.length > 0 ? (levels as FilterType['levels']) : undefined,
    };
  }, []);

  // State
  const [filters, setFilters] = useState<FilterType>(initialFilters);
  const [debouncedFilters] = useDebounce(filters, 300);
  const [sort, setSort] = useState<MarketplaceSortOption>(DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  // Queries
  const {
    data: coursesData,
    isLoading: isLoadingCourses,
    error: coursesError,
  } = useMarketplaceCourses(debouncedFilters, sort, page, DEFAULT_PAGE_SIZE);

  const { data: categories = [] } = useMarketplaceCategories();
  const { data: recommendations = [], isLoading: isLoadingRecommendations } =
    useMarketplaceRecommendations(6);

  // Favorites
  const { toggleFavorite, isToggling } = useMarketplaceFavorites();

  // Comparison
  const comparison = useCourseComparison(4);

  // Handlers
  const handleFiltersChange = useCallback(
    (newFilters: Partial<FilterType>) => {
      setFilters(prev => ({ ...prev, ...newFilters }));
      setPage(1); // Reset to first page on filter change

      // Update URL params
      const params = new URLSearchParams();
      const combined = { ...filters, ...newFilters };
      if (combined.search) params.set('search', combined.search);
      if (combined.providers?.length) params.set('providers', combined.providers.join(','));
      if (combined.levels?.length) params.set('levels', combined.levels.join(','));
      setSearchParams(params);
    },
    [filters, setSearchParams]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setSearchParams({});
  }, [setSearchParams]);

  const handleSortChange = useCallback((newSort: MarketplaceSortOption) => {
    setSort(newSort);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleFavoriteToggle = useCallback(
    (courseId: string) => {
      if (!user) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to save courses to your favorites.',
          variant: 'default',
        });
        return;
      }
      toggleFavorite(courseId);
    },
    [user, toggleFavorite, toast]
  );

  const handleCompareToggle = useCallback(
    (course: ExternalCourseWithProvider) => {
      if (!comparison.canAddMore && !comparison.isSelected(course.id)) {
        toast({
          title: 'Maximum reached',
          description: 'You can compare up to 4 courses at a time.',
          variant: 'default',
        });
        return;
      }
      comparison.toggleCourse(course);
    },
    [comparison, toast]
  );

  const handleShare = useCallback(
    async (course: ExternalCourseWithProvider) => {
      const shareUrl = course.external_url;
      const shareText = `Check out this AI course: ${course.title}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: course.title,
            text: shareText,
            url: shareUrl,
          });
        } catch (err) {
          // User cancelled or error
        }
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Link copied',
          description: 'Course link copied to clipboard.',
        });
      }
    },
    [toast]
  );

  const handlePriceAlert = useCallback(
    (course: ExternalCourseWithProvider) => {
      if (!user) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to set price alerts.',
          variant: 'default',
        });
        return;
      }
      // TODO: Open price alert modal
      toast({
        title: 'Coming soon',
        description: 'Price alerts will be available soon.',
      });
    },
    [user, toast]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-b from-muted/50 to-background py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 flex items-center justify-center gap-2">
                <Globe className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  AI Course Marketplace
                </h1>
              </div>
              <p className="text-lg text-muted-foreground">
                Explore AI training courses from 15+ leading platforms worldwide. Find the perfect
                course for your skill level and learning goals.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  <BookOpen className="mr-1 h-3.5 w-3.5" />
                  {coursesData?.pagination.total || 0}+ Courses
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  <GraduationCap className="mr-1 h-3.5 w-3.5" />
                  All Skill Levels
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  <Globe className="mr-1 h-3.5 w-3.5" />
                  15+ Providers
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Recommendations Section (for logged-in users) */}
        {user && (
          <section className="border-b py-8">
            <div className="container mx-auto px-4">
              <RecommendedCoursesSection
                recommendations={recommendations}
                isLoading={isLoadingRecommendations}
              />
            </div>
          </section>
        )}

        {/* Main Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-8 lg:flex-row">
              {/* Sidebar Filters */}
              <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0">
                <MarketplaceFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onReset={handleResetFilters}
                  categories={categories}
                />
              </aside>

              {/* Course Grid */}
              <div className="flex-1 min-w-0">
                {/* Comparison Bar */}
                {comparison.count > 0 && (
                  <div className="mb-6 flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-center gap-3">
                      <Scale className="h-5 w-5 text-primary" />
                      <span className="font-medium">
                        {comparison.count} course{comparison.count > 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={comparison.clearAll}>
                        <X className="mr-1 h-4 w-4" />
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setIsComparisonOpen(true)}
                        disabled={comparison.count < 2}
                      >
                        Compare
                      </Button>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {coursesError && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
                    <p className="text-destructive">
                      Failed to load courses. Please try again later.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {/* Course Grid */}
                {!coursesError && (
                  <CourseMarketplaceGrid
                    courses={coursesData?.courses || []}
                    pagination={
                      coursesData?.pagination || {
                        page: 1,
                        pageSize: DEFAULT_PAGE_SIZE,
                        total: 0,
                        totalPages: 0,
                      }
                    }
                    sort={sort}
                    isLoading={isLoadingCourses}
                    comparingCourses={comparison.selectedCourses}
                    onSortChange={handleSortChange}
                    onPageChange={handlePageChange}
                    onFavoriteToggle={handleFavoriteToggle}
                    onCompareToggle={handleCompareToggle}
                    onShare={handleShare}
                    onPriceAlert={handlePriceAlert}
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Comparison Modal */}
      <CourseComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        courses={comparison.selectedCourses}
        onRemoveCourse={comparison.removeCourse}
      />

      <Footer />
    </div>
  );
}
