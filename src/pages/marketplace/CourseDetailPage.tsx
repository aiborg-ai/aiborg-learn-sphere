/**
 * Course Detail Page
 * Full details of an external course
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Star,
  Clock,
  Users,
  Award,
  ExternalLink,
  Heart,
  Share2,
  Bell,
  ArrowLeft,
  Globe,
  BookOpen,
  CheckCircle,
  Target,
} from 'lucide-react';
import { useMarketplaceCourse, useMarketplaceFavorites } from '@/hooks/useMarketplaceCourses';
import { ProviderBadge } from '@/components/marketplace/ProviderBadge';
import { PriceDisplay } from '@/components/marketplace/PriceDisplay';
import { LEVEL_LABELS, MODE_LABELS } from '@/types/marketplace';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: course, isLoading, error } = useMarketplaceCourse(slug || '');
  const { toggleFavorite } = useMarketplaceFavorites();

  const handleFavorite = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save courses to your favorites.',
      });
      return;
    }
    if (course) {
      toggleFavorite(course.id);
    }
  };

  const handleShare = async () => {
    if (!course) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: course.title,
          text: `Check out this AI course: ${course.title}`,
          url: course.external_url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(course.external_url);
      toast({
        title: 'Link copied',
        description: 'Course link copied to clipboard.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-lg" />
            <div className="h-6 w-full bg-muted rounded" />
            <div className="h-6 w-3/4 bg-muted rounded" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Course not found</h1>
          <p className="text-muted-foreground mb-6">
            The course you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/marketplace">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Marketplace
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm">
              <Link to="/marketplace" className="text-muted-foreground hover:text-foreground">
                Marketplace
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="truncate">{course.title}</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="border-b py-8">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-start justify-between">
                  <ProviderBadge
                    provider={course.provider_slug}
                    logoUrl={course.provider_logo_url}
                    size="md"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={handleFavorite}>
                      <Heart className={course.is_favorite ? 'fill-red-500 text-red-500' : ''} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <h1 className="text-3xl font-bold">{course.title}</h1>

                {course.instructor_name && (
                  <p className="text-lg text-muted-foreground">by {course.instructor_name}</p>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {course.level && <Badge variant="outline">{LEVEL_LABELS[course.level]}</Badge>}
                  {course.mode && <Badge variant="outline">{MODE_LABELS[course.mode]}</Badge>}
                  {course.certificate_available && (
                    <Badge variant="secondary">
                      <Award className="mr-1 h-3 w-3" />
                      Certificate
                    </Badge>
                  )}
                  {course.is_featured && <Badge className="bg-amber-500">Featured</Badge>}
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  {course.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-lg">{course.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">
                        ({course.review_count.toLocaleString()} reviews)
                      </span>
                    </div>
                  )}
                  {course.enrollment_count > 0 && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {course.enrollment_count.toLocaleString()} students
                    </div>
                  )}
                  {course.duration_text && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {course.duration_text}
                    </div>
                  )}
                  {course.language && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      {course.language.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Description */}
                {course.description && (
                  <div className="prose dark:prose-invert max-w-none">
                    <p>{course.description}</p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  {course.thumbnail_url && (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full aspect-video object-cover rounded-t-lg"
                    />
                  )}
                  <CardContent className="p-6 space-y-4">
                    <PriceDisplay
                      priceType={course.price_type}
                      amount={course.price_amount}
                      currency={course.price_currency}
                      originalPrice={course.original_price}
                    />

                    <Button asChild className="w-full" size="lg">
                      <a href={course.external_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Go to Course
                      </a>
                    </Button>

                    {course.price_type === 'paid' && (
                      <Button variant="outline" className="w-full">
                        <Bell className="mr-2 h-4 w-4" />
                        Set Price Alert
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Details Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Skills */}
              {course.skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Skills You'll Learn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {course.skills.map(skill => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Learning Outcomes */}
              {course.learning_outcomes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      What You'll Learn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {course.learning_outcomes.map((outcome, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Prerequisites */}
              {course.prerequisites.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Prerequisites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {course.prerequisites.map((prereq, i) => (
                        <li key={i}>{prereq}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Categories */}
              {course.categories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {course.categories.map(category => (
                        <Badge key={category} variant="outline">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
