import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBlogPosts } from '@/hooks/blog/useBlogPosts';
import { useBlogCategories } from '@/hooks/blog/useBlogCategories';
import { BlogPostCard } from '@/components/Blog/BlogPostCard';
import { Navbar, Footer } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, TrendingUp, Clock, Users, Filter } from '@/components/ui/icons';

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const { posts, loading, totalCount, filters, updateFilters } = useBlogPosts({
    category: searchParams.get('category') || undefined,
    search: searchParams.get('search') || undefined,
    sortBy: (searchParams.get('sort') as 'latest' | 'popular' | 'trending') || 'latest',
    page: parseInt(searchParams.get('page') || '1'),
  });

  const { categories } = useBlogCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      newParams.set('search', searchQuery);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
    updateFilters({ search: searchQuery, page: 1 });
  };

  const handleCategoryFilter = (categorySlug: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (categorySlug) {
      newParams.set('category', categorySlug);
    } else {
      newParams.delete('category');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
    updateFilters({ category: categorySlug || undefined, page: 1 });
  };

  const handleSortChange = (sortBy: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', sortBy);
    newParams.set('page', '1');
    setSearchParams(newParams);
    updateFilters({ sortBy: sortBy as 'latest' | 'popular' | 'trending', page: 1 });
  };

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
    updateFilters({ page });
  };

  const featuredPost = posts.find(post => post.is_featured);
  const regularPosts = posts.filter(post => !post.is_featured);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navbar />
      {/* Header */}
      <div className="bg-gradient-hero text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Aiborg Blog</h1>
          <p className="text-xl text-white/80 max-w-2xl">
            Insights, tutorials, and stories from the world of AI education
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by:</span>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={!filters.category ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => handleCategoryFilter(null)}
              >
                All Categories
              </Badge>
              {categories.map(category => (
                <Badge
                  key={category.id}
                  variant={filters.category === category.slug ? 'default' : 'outline'}
                  className="cursor-pointer"
                  style={{
                    backgroundColor:
                      filters.category === category.slug ? category.color : 'transparent',
                    borderColor: category.color,
                    color: filters.category === category.slug ? 'white' : category.color,
                  }}
                  onClick={() => handleCategoryFilter(category.slug)}
                >
                  {category.name} ({category.post_count})
                </Badge>
              ))}
            </div>

            {/* Sort */}
            <Select value={filters.sortBy || 'latest'} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Latest
                  </span>
                </SelectItem>
                <SelectItem value="popular">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Most Popular
                  </span>
                </SelectItem>
                <SelectItem value="trending">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trending
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filters.search && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing results for: <span className="font-medium">"{filters.search}"</span>
              {totalCount > 0 && ` (${totalCount} results)`}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video" />
                <CardHeader>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardFooter>
                  <Skeleton className="h-8 w-8 rounded-full mr-2" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">
              No articles found matching your criteria
            </p>
            <Button
              onClick={() => {
                setSearchParams(new URLSearchParams());
                updateFilters({});
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Blog Posts Grid */}
        {!loading && posts.length > 0 && (
          <>
            {/* Featured Post */}
            {featuredPost && filters.page === 1 && !filters.search && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Featured Article</h2>
                <BlogPostCard post={featuredPost} variant="featured" />
              </div>
            )}

            {/* Regular Posts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map(post => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalCount > (filters.limit || 12) && (
              <div className="flex justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                  disabled={(filters.page || 1) <= 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {[...Array(Math.ceil(totalCount / (filters.limit || 12)))].map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={(filters.page || 1) === i + 1 ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                  disabled={(filters.page || 1) >= Math.ceil(totalCount / (filters.limit || 12))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

// Add missing imports for Card components
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
