/**
 * Favorites Page
 * User's saved/favorited external courses
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { Button } from '@/components/ui/button';
import { Heart, ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMarketplaceFavorites } from '@/hooks/useMarketplaceCourses';
import {
  ExternalCourseCard,
  ExternalCourseCardSkeleton,
} from '@/components/marketplace/ExternalCourseCard';

export default function FavoritesPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { favorites, isLoading, toggleFavorite } = useMarketplaceFavorites();

  // Not logged in
  if (!isAuthLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <Heart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in to view favorites</h1>
          <p className="text-muted-foreground mb-6">
            Create an account or sign in to save your favorite courses.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link to="/marketplace">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse Courses
              </Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="border-b bg-muted/30 py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="h-6 w-6 text-red-500 fill-red-500" />
              <h1 className="text-2xl font-bold">My Favorite Courses</h1>
            </div>
            <p className="text-muted-foreground">
              Courses you've saved for later. Click the heart to remove.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ExternalCourseCardSkeleton key={i} />
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
                <p className="text-muted-foreground mb-6">
                  Start exploring courses and save your favorites for quick access.
                </p>
                <Button asChild>
                  <Link to="/marketplace">
                    Browse Marketplace
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {favorites.map(({ course }) => (
                  <ExternalCourseCard
                    key={course.id}
                    course={{ ...course, is_favorite: true }}
                    onFavoriteToggle={() => toggleFavorite(course.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
