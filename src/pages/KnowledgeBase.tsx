/**
 * Knowledge Base Landing Page
 * Public wiki-style browsable knowledge base for AI/ML topics
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Search,
  Clock,
  TrendingUp,
  Sparkles,
  Brain,
  Code,
  Briefcase,
  Shield,
  Rocket,
  MessageSquare,
  BarChart,
} from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const KB_CATEGORIES = [
  {
    value: 'ai_fundamentals',
    label: 'AI/ML Fundamentals',
    icon: Brain,
    color: 'bg-blue-100 text-blue-700',
  },
  {
    value: 'ml_algorithms',
    label: 'ML Algorithms',
    icon: BarChart,
    color: 'bg-purple-100 text-purple-700',
  },
  {
    value: 'practical_tools',
    label: 'Practical Tools',
    icon: Code,
    color: 'bg-green-100 text-green-700',
  },
  {
    value: 'prompt_engineering',
    label: 'Prompt Engineering',
    icon: MessageSquare,
    color: 'bg-yellow-100 text-yellow-700',
  },
  {
    value: 'business_ai',
    label: 'Business AI',
    icon: Briefcase,
    color: 'bg-orange-100 text-orange-700',
  },
  { value: 'ai_ethics', label: 'AI Ethics', icon: Shield, color: 'bg-red-100 text-red-700' },
  {
    value: 'deployment',
    label: 'MLOps & Deployment',
    icon: Rocket,
    color: 'bg-indigo-100 text-indigo-700',
  },
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-800' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'advanced', label: 'Advanced', color: 'bg-red-100 text-red-800' },
];

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  kb_category: string;
  kb_difficulty: string;
  tags: string[];
  created_at: string;
  view_count: number;
  metadata: {
    reading_time_minutes?: number;
  };
}

export default function KnowledgeBase() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch KB articles
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['kb-articles', selectedCategory, selectedDifficulty, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('vault_content')
        .select('*')
        .eq('is_knowledge_base', true)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('kb_category', selectedCategory);
      }

      if (selectedDifficulty) {
        query = query.eq('kb_difficulty', selectedDifficulty);
      }

      if (searchQuery.trim()) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Article[];
    },
  });

  // Fetch article count by category
  const { data: categoryCounts = {} } = useQuery({
    queryKey: ['kb-category-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vault_content')
        .select('kb_category')
        .eq('is_knowledge_base', true)
        .eq('status', 'published');

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach(item => {
        counts[item.kb_category] = (counts[item.kb_category] || 0) + 1;
      });

      return counts;
    },
  });

  const getCategoryInfo = (categoryValue: string) => {
    return KB_CATEGORIES.find(c => c.value === categoryValue);
  };

  const getDifficultyInfo = (difficultyValue: string) => {
    return DIFFICULTY_LEVELS.find(d => d.value === difficultyValue);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedDifficulty(null);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategory || selectedDifficulty || searchQuery.trim();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="h-12 w-12 text-primary" />
              <h1 className="text-5xl font-bold">AI Knowledge Base</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your comprehensive guide to AI, machine learning, and practical implementation. Learn
              from fundamentals to advanced deployment strategies.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mt-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles, topics, concepts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Category Pills */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">BROWSE BY CATEGORY</h2>
          <div className="flex flex-wrap gap-3">
            {KB_CATEGORIES.map(category => {
              const Icon = category.icon;
              const count = categoryCounts[category.value] || 0;
              const isSelected = selectedCategory === category.value;

              return (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(isSelected ? null : category.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 hover:border-primary/50 bg-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{category.label}</span>
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Difficulty Filter */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">DIFFICULTY LEVEL</h2>
          <div className="flex flex-wrap gap-3">
            {DIFFICULTY_LEVELS.map(difficulty => {
              const isSelected = selectedDifficulty === difficulty.value;

              return (
                <button
                  key={difficulty.value}
                  onClick={() => setSelectedDifficulty(isSelected ? null : difficulty.value)}
                  className={`px-4 py-2 rounded-full border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 hover:border-primary/50 bg-white'
                  }`}
                >
                  {difficulty.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1">
                {getCategoryInfo(selectedCategory)?.label}
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="ml-1 hover:text-destructive"
                >
                  ✕
                </button>
              </Badge>
            )}
            {selectedDifficulty && (
              <Badge variant="secondary" className="gap-1">
                {getDifficultyInfo(selectedDifficulty)?.label}
                <button
                  onClick={() => setSelectedDifficulty(null)}
                  className="ml-1 hover:text-destructive"
                >
                  ✕
                </button>
              </Badge>
            )}
            {searchQuery.trim() && (
              <Badge variant="secondary" className="gap-1">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-destructive">
                  ✕
                </button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}

        {/* Articles Grid */}
        <section>
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No articles found</h3>
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters
                    ? 'Try adjusting your filters or search query'
                    : 'No published articles yet. Check back soon!'}
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
                  Showing {articles.length} article{articles.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map(article => {
                  const categoryInfo = getCategoryInfo(article.kb_category);
                  const difficultyInfo = getDifficultyInfo(article.kb_difficulty);
                  const CategoryIcon = categoryInfo?.icon || BookOpen;

                  return (
                    <Link key={article.id} to={`/kb/${article.slug}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className={`p-2 rounded-lg ${categoryInfo?.color}`}>
                              <CategoryIcon className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {difficultyInfo?.label}
                            </Badge>
                          </div>
                          <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
                            {article.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-3">
                            {article.excerpt}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {article.metadata?.reading_time_minutes && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{article.metadata.reading_time_minutes} min</span>
                              </div>
                            )}
                            {article.view_count > 0 && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                <span>{article.view_count} views</span>
                              </div>
                            )}
                          </div>

                          {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {article.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* CTA Section */}
        {!isLoading && articles.length > 0 && (
          <section className="mt-16 text-center">
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="py-12">
                <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">Want to learn more?</h2>
                <p className="text-muted-foreground mb-6">
                  Explore our comprehensive AI courses and hands-on projects
                </p>
                <Button asChild size="lg">
                  <Link to="/courses">Browse Courses</Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
