/**
 * Knowledgebase Landing Page
 * Main page with topic categories and featured entries
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, BookOpen } from '@/components/ui/icons';
import { KnowledgebaseHero } from './components/KnowledgebaseHero';
import { TopicCard } from './components/TopicCard';
import { EntryCard } from './components/EntryCard';
import {
  useKnowledgebaseStats,
  useFeaturedKnowledgebaseEntries,
} from '@/hooks/knowledgebase/useKnowledgebaseEntries';
import { TOPIC_CONFIGS } from '@/types/knowledgebase';

export default function KnowledgebasePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { data: stats } = useKnowledgebaseStats();
  const { data: featuredEntries = [], isLoading: loadingFeatured } =
    useFeaturedKnowledgebaseEntries(6);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      // Redirect to search with query parameter
      navigate(`/knowledgebase/pioneers?search=${encodeURIComponent(query.trim())}`);
    }
  };

  // Get count for each topic
  const getTopicCount = (topicType: string) => {
    if (!stats?.by_topic) return 0;
    const topicStat = stats.by_topic.find(ts => ts.topic_type === topicType);
    return topicStat?.published_count || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <KnowledgebaseHero
        searchQuery={searchQuery}
        onSearchChange={query => setSearchQuery(query)}
      />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Topic Categories Grid */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Explore Topics</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TOPIC_CONFIGS.map(config => (
              <TopicCard key={config.type} config={config} count={getTopicCount(config.type)} />
            ))}
          </div>
        </section>

        {/* Stats Section */}
        {stats && stats.total_entries > 0 && (
          <section className="mb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary">{stats.total_entries}</div>
                  <div className="text-sm text-muted-foreground">Total Entries</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary">{stats.total_views}</div>
                  <div className="text-sm text-muted-foreground">Total Views</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary">{stats.published_count}</div>
                  <div className="text-sm text-muted-foreground">Published</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary">{stats.featured_count}</div>
                  <div className="text-sm text-muted-foreground">Featured</div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Featured Entries Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Entries</h2>
            <Button variant="outline" asChild>
              <Link to="/knowledgebase/pioneers">View All</Link>
            </Button>
          </div>

          {loadingFeatured ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredEntries.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No featured entries yet</h3>
                <p className="text-muted-foreground">Check back soon for featured content!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEntries.map(entry => (
                <EntryCard key={entry.id} entry={entry} showTopic />
              ))}
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="py-12">
              <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Want to learn more?</h2>
              <p className="text-muted-foreground mb-6">
                Explore our AI courses and start your learning journey
              </p>
              <Button asChild size="lg">
                <Link to="/courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
