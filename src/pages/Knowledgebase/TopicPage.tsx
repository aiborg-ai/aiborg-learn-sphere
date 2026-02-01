/**
 * Knowledgebase Topic Page
 * Lists entries for a specific topic type (pioneers, events, companies, research)
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
  ArrowLeft,
  Search,
  Filter,
  BookOpen,
  Users,
  Calendar,
  Building2,
  FileText,
} from '@/components/ui/icons';
import { EntryCard } from './components/EntryCard';
import {
  useKnowledgebaseEntries,
  useKnowledgebaseTags,
} from '@/hooks/knowledgebase/useKnowledgebaseEntries';
import { getTopicConfig, type KnowledgebaseTopicType } from '@/types/knowledgebase';

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users: Users,
  Calendar: Calendar,
  Building2: Building2,
  FileText: FileText,
};

export default function TopicPage() {
  const { topic } = useParams<{ topic: KnowledgebaseTopicType }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial values from URL params
  const initialSearch = searchParams.get('search') || '';
  const initialSort =
    (searchParams.get('sort') as 'latest' | 'popular' | 'alphabetical') || 'latest';
  const initialTag = searchParams.get('tag') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'alphabetical'>(initialSort);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [page, setPage] = useState(initialPage);

  const topicConfig = topic ? getTopicConfig(topic) : undefined;
  const TopicIcon = topicConfig ? IconMap[topicConfig.icon] || BookOpen : BookOpen;

  // Fetch entries
  const { data, isLoading, refetch } = useKnowledgebaseEntries({
    topic_type: topic,
    search: searchQuery.trim() || undefined,
    tags: selectedTag ? [selectedTag] : undefined,
    sortBy,
    page,
    limit: 12,
  });

  // Fetch all tags for filtering
  const { data: allTags = [] } = useKnowledgebaseTags();

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'latest') params.set('sort', sortBy);
    if (selectedTag) params.set('tag', selectedTag);
    if (page > 1) params.set('page', page.toString());
    setSearchParams(params, { replace: true });
  }, [searchQuery, sortBy, selectedTag, page, setSearchParams]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy, selectedTag, topic]);

  const clearFilters = () => {
    setSearchQuery('');
    setSortBy('latest');
    setSelectedTag('');
    setPage(1);
  };

  const hasActiveFilters = searchQuery || selectedTag || sortBy !== 'latest';

  if (!topicConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="py-12">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Topic not found</h2>
            <p className="text-muted-foreground mb-6">
              The topic you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link to="/knowledgebase">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Knowledgebase
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/knowledgebase">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Knowledgebase
            </Link>
          </Button>
        </div>
      </div>

      {/* Topic Hero */}
      <section className={`py-12 px-4 ${topicConfig.bgColor}`}>
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl bg-white/50`}>
              <TopicIcon className={`h-10 w-10 ${topicConfig.color}`} />
            </div>
            <div>
              <h1 className="text-4xl font-bold">{topicConfig.label}</h1>
              <p className="text-lg text-muted-foreground">{topicConfig.description}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${topicConfig.label.toLowerCase()}...`}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Tag Filter */}
              {allTags.length > 0 && (
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Tags</SelectItem>
                    {allTags.map(tag => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Sort */}
              <Select value={sortBy} onValueChange={val => setSortBy(val as typeof sortBy)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {selectedTag && (
                  <Badge variant="secondary" className="gap-1">
                    Tag: {selectedTag}
                    <button
                      onClick={() => setSelectedTag('')}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {sortBy !== 'latest' && (
                  <Badge variant="secondary" className="gap-1">
                    Sort: {sortBy}
                    <button
                      onClick={() => setSortBy('latest')}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
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
        ) : !data || data.entries.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <TopicIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No entries found</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your filters or search query'
                  : `No ${topicConfig.label.toLowerCase()} entries yet. Check back soon!`}
              </p>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline">
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {data.entries.length} of {data.count} entries
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {data.entries.map(entry => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === data.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
