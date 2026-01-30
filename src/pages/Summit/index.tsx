/**
 * Summit Landing Page
 * India AI Impact Summit 2026 - Seven Chakras Resource Hub
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Calendar,
  MapPin,
  Sparkles,
  ExternalLink,
  FileText,
  ArrowRight,
  Layers,
} from '@/components/ui/icons';
import {
  useSummitThemes,
  useSummitStats,
  useFeaturedSummitResources,
} from '@/hooks/summit/useSummitResources';
import { ThemeCard } from './components/ThemeCard';
import { ResourceCard } from './components/ResourceCard';
import { RESOURCE_TYPE_CONFIGS } from '@/types/summit';

export default function SummitPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const navigate = useNavigate();

  const { data: themes = [], isLoading: loadingThemes } = useSummitThemes();
  const { data: stats } = useSummitStats();
  const { data: featuredResources = [], isLoading: loadingFeatured } =
    useFeaturedSummitResources(6);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams({ search: searchQuery.trim() });
      if (typeFilter !== 'all') {
        params.set('type', typeFilter);
      }
      navigate(`/summit/${themes[0]?.slug || 'safe-trusted-ai'}?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Event Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium">India AI Impact Summit 2026</span>
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
              Seven Chakras
              <span className="block text-purple-300">Resource Hub</span>
            </h1>

            {/* Event Details */}
            <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-purple-200">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>February 19-20, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>New Delhi, India</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
              Explore curated resources across seven thematic pillars shaping India's AI future.
              From governance frameworks to innovation ecosystems, discover insights that matter.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search resources..."
                    className="pl-12 h-12 bg-white/95 text-gray-900 border-0"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-12 bg-white/95 text-gray-900 border-0">
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
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 bg-amber-500 hover:bg-amber-600 text-black"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 100V60C240 90 480 30 720 30C960 30 1200 90 1440 60V100H0Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Seven Chakras Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Layers className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold">The Seven Chakras</h2>
          </div>
          <p className="text-muted-foreground mb-8 max-w-3xl">
            Each chakra represents a crucial dimension of India's AI strategy. Click on a theme to
            explore its curated resources.
          </p>

          {loadingThemes ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {themes.map(theme => (
                <ThemeCard key={theme.id} theme={theme} />
              ))}
            </div>
          )}
        </section>

        {/* Stats Section */}
        {stats && stats.total_resources > 0 && (
          <section className="mb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.total_resources}</div>
                  <div className="text-sm text-muted-foreground">Total Resources</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600">{themes.length}</div>
                  <div className="text-sm text-muted-foreground">Thematic Pillars</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.published_count}</div>
                  <div className="text-sm text-muted-foreground">Published</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-amber-600">{stats.total_views}</div>
                  <div className="text-sm text-muted-foreground">Total Views</div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Featured Resources Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-amber-500" />
              <h2 className="text-2xl font-bold">Featured Resources</h2>
            </div>
            {themes.length > 0 && (
              <Button variant="outline" asChild>
                <Link to={`/summit/${themes[0].slug}`}>
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
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
          ) : featuredResources.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No featured resources yet</h3>
                <p className="text-muted-foreground">Check back soon for featured content!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredResources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} showTheme />
              ))}
            </div>
          )}
        </section>

        {/* Resource Types Guide */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Browse by Resource Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {RESOURCE_TYPE_CONFIGS.map(config => (
              <Card
                key={config.type}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  if (themes.length > 0) {
                    navigate(`/summit/${themes[0].slug}?type=${config.type}`);
                  }
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl mb-2 ${config.color}`}>
                    <FileText className="h-8 w-8 mx-auto" />
                  </div>
                  <div className="font-medium">{config.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-200">
            <CardContent className="py-12">
              <Sparkles className="h-12 w-12 mx-auto text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Join India AI Impact Summit 2026</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Be part of India's largest AI policy and innovation gathering. Connect with thought
                leaders, policymakers, and innovators shaping the future of AI.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Register Now
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/courses">Explore AI Courses</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
