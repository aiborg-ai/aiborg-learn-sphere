/**
 * Summit Theme Page
 * Display resources for a specific theme (Chakra)
 */

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  ArrowLeft,
  Filter,
  FileText,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from '@/components/ui/icons';
import {
  useSummitTheme,
  useSummitThemes,
  useSummitResources,
} from '@/hooks/summit/useSummitResources';
import { ResourceCard } from './components/ResourceCard';
import { RESOURCE_TYPE_CONFIGS, getThemeColors } from '@/types/summit';
import type { SummitResourceType, SummitResourceFilters } from '@/types/summit';

export default function SummitThemePage() {
  const { themeSlug } = useParams<{ themeSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial values from URL
  const initialSearch = searchParams.get('search') || '';
  const initialType = searchParams.get('type') || 'all';
  const initialSort = searchParams.get('sort') || 'latest';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [sortBy, setSortBy] = useState(initialSort);
  const [page, setPage] = useState(initialPage);

  const { data: theme, isLoading: loadingTheme } = useSummitTheme(themeSlug);
  const { data: allThemes = [] } = useSummitThemes();

  // Build filters
  const filters: SummitResourceFilters = {
    theme_slug: themeSlug,
    page,
    limit: 12,
    sortBy: sortBy as 'latest' | 'popular' | 'featured' | 'alphabetical',
  };

  if (searchQuery) filters.search = searchQuery;
  if (typeFilter !== 'all') filters.resource_type = typeFilter as SummitResourceType;

  const { data, isLoading: loadingResources } = useSummitResources(filters);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (sortBy !== 'latest') params.set('sort', sortBy);
    if (page > 1) params.set('page', page.toString());
    setSearchParams(params, { replace: true });
  }, [searchQuery, typeFilter, sortBy, page, setSearchParams]);

  // Reset page when filters change
  const handleFilterChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    setter(value);
    setPage(1);
  };

  const themeColors = theme ? getThemeColors(theme.slug) : {};

  if (loadingTheme) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="font-semibold text-xl mb-2">Theme Not Found</h2>
          <p className="text-muted-foreground mb-4">The theme you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/summit">Back to Summit Hub</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Theme Header */}
      <section className={`${themeColors.bgColor} border-b ${themeColors.borderColor}`}>
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/summit">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Summit Hub
              </Link>
            </Button>
          </div>

          {/* Theme Info */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="max-w-2xl">
              <Badge
                variant="outline"
                className={`${themeColors.textColor} ${themeColors.borderColor} mb-2`}
              >
                Chakra #{theme.sort_order}
              </Badge>
              <h1
                className={`font-display text-3xl md:text-4xl font-bold mb-3 ${themeColors.textColor}`}
              >
                {theme.name}
              </h1>
              <p className="text-muted-foreground">{theme.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <div className={`text-3xl font-bold ${themeColors.textColor}`}>
                  {theme.resource_count}
                </div>
                <div className="text-sm text-muted-foreground">Resources</div>
              </div>
            </div>
          </div>

          {/* Theme Navigation */}
          <div className="mt-6 flex flex-wrap gap-2">
            {allThemes.map(t => {
              const colors = getThemeColors(t.slug);
              const isActive = t.slug === themeSlug;
              return (
                <Button
                  key={t.id}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className={isActive ? '' : `${colors.textColor} hover:${colors.bgColor}`}
                  asChild
                >
                  <Link to={`/summit/${t.slug}`}>{t.name}</Link>
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={e => handleFilterChange(setSearchQuery, e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <Select
                value={typeFilter}
                onValueChange={val => handleFilterChange(setTypeFilter, val)}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {RESOURCE_TYPE_CONFIGS.map(config => (
                    <SelectItem key={config.type} value={config.type}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={val => handleFilterChange(setSortBy, val)}>
                <SelectTrigger className="w-full md:w-[160px]">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Most Viewed</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {data?.count || 0} resources found
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>

        {/* Resources Grid */}
        {loadingResources ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !data?.resources || data.resources.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No resources found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? `No resources match "${searchQuery}"`
                  : 'No resources available for this theme yet.'}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.resources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (data.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= data.totalPages - 2) {
                      pageNum = data.totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-10"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
