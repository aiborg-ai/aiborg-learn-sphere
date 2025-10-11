import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReviews } from "@/hooks/useReviews";
import UnifiedReviewForm from "@/components/UnifiedReviewForm";
import { MediaPlayer } from "@/components/media";
import { 
  Star, 
  MessageSquare, 
  User, 
  Calendar,
  MapPin,
  Mic,
  Video,
  Plus,
  Filter,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

import { logger } from '@/utils/logger';
export function ReviewsSection({ courseFilter }: { courseFilter?: number }) {
  const { reviews, loading, error, refetch } = useReviews();
  const [showForm, setShowForm] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [activeCourseFilter, setActiveCourseFilter] = useState<number | null>(courseFilter || null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  logger.log('ReviewsSection render:', { reviews, loading, error, reviewCount: reviews.length, courseFilter, activeCourseFilter });

  // Listen for course filter events
  useEffect(() => {
    const handleCourseFilter = (event: CustomEvent) => {
      setActiveCourseFilter(event.detail.courseId);
    };

    window.addEventListener('filterReviewsByCourse', handleCourseFilter as EventListener);
    return () => window.removeEventListener('filterReviewsByCourse', handleCourseFilter as EventListener);
  }, []);

  const filteredReviews = reviews.filter(review => {
    const matchesCourse = !activeCourseFilter || review.course_id === activeCourseFilter;
    const matchesRating = !filterRating || review.rating === filterRating;
    return matchesCourse && matchesRating;
  });

  const averageRating = filteredReviews.length > 0 
    ? filteredReviews.reduce((sum, review) => sum + review.rating, 0) / filteredReviews.length 
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: filteredReviews.filter(r => r.rating === rating).length,
    percentage: filteredReviews.length > 0 ? (filteredReviews.filter(r => r.rating === rating).length / filteredReviews.length) * 100 : 0
  }));

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getReviewTypeIcon = (type: string) => {
    switch (type) {
      case 'voice':
        return <Mic className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMMM do, yyyy");
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading reviews...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-destructive">Error loading reviews: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <MessageSquare className="h-4 w-4" />
            <span>Student Reviews</span>
          </div>
          
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">
              {activeCourseFilter ? 'Course Reviews' : 'What Our Students Say'}
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {activeCourseFilter 
              ? `Reviews specifically for this course from our learning community.`
              : 'Real feedback from our AI education community. Read authentic experiences from learners who have transformed their careers through our programs.'
            }
          </p>
          
          {activeCourseFilter && (
            <button
              onClick={() => setActiveCourseFilter(null)}
              className="mt-4 text-primary hover:underline"
            >
              View all reviews
            </button>
          )}
        </div>

        {/* Overall Rating Stats */}
        {reviews.length > 0 && (
          <div className="max-w-4xl mx-auto mb-12">
            <Card className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Average Rating */}
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary mb-2">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="flex justify-center mb-2">
                    {renderStars(Math.round(averageRating))}
                  </div>
                  <p className="text-muted-foreground">
                    Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Rating Distribution */}
                <div className="space-y-2">
                  {ratingDistribution.map(({ rating, count, percentage }) => (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-12">
                        <span className="text-sm">{rating}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center mb-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => setShowForm(!showForm)}
                    className="btn-hero"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {showForm ? 'Hide Review Form' : 'Write a Review'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={refetch}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Reviews
                  </Button>
            
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filter by rating:</span>
                {[5, 4, 3, 2, 1].map(rating => (
                  <Button
                    key={rating}
                    variant={filterRating === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                    className="text-xs"
                  >
                    {rating} ⭐
                  </Button>
                ))}
                {filterRating && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterRating(null)}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Review Form */}
        {showForm && (
          <div className="mb-16">
            <UnifiedReviewForm />
          </div>
        )}

        {/* Reviews Grid */}
        {filteredReviews.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(showAllReviews ? filteredReviews : filteredReviews.slice(0, 3)).map((review) => (
              <Card key={review.id} className="h-full flex flex-col hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-muted-foreground">
                        {review.rating}/5
                      </span>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      {getReviewTypeIcon(review.review_type)}
                      {review.review_type}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-semibold text-sm text-primary">
                      {review.courses?.title || `Course ${review.course_id}`}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>
                        {review.display_name_option === 'full_name' || review.display_name_option === 'first_name'
                          ? review.profiles?.display_name || 'Student'
                          : 'Anonymous Student'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{review.course_period}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="capitalize">{review.course_mode.replace('-', ' ')}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  {review.review_type === 'written' && review.written_review && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6">
                      "{review.written_review}"
                    </p>
                  )}
                  
                  {review.review_type === 'voice' && review.voice_review_url && (
                    <div className="py-4">
                      <MediaPlayer
                        bucket="review-voices"
                        path={review.voice_review_url}
                        type="audio"
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {review.review_type === 'video' && review.video_review_url && (
                    <div className="py-4">
                      <MediaPlayer
                        bucket="review-videos"
                        path={review.video_review_url}
                        type="video"
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Fallback for voice/video without files */}
                  {review.review_type === 'voice' && !review.voice_review_url && (
                    <div className="text-center py-4">
                      <Mic className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Voice review (file not available)</p>
                    </div>
                  )}
                  
                  {review.review_type === 'video' && !review.video_review_url && (
                    <div className="text-center py-4">
                      <Video className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Video review (file not available)</p>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Reviewed on {formatDate(review.created_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
            
            {filteredReviews.length > 3 && (
              <div className="text-center mt-8">
                <Button 
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  variant="outline"
                  className="px-8 py-2"
                >
                  {showAllReviews ? 'Show Less' : `Show More (${filteredReviews.length - 3} more)`}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="col-span-full">
              <Card className="p-12 text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  {filterRating ? 'No reviews found' : 'Be the First to Review'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {filterRating 
                    ? `No reviews with ${filterRating} star${filterRating !== 1 ? 's' : ''} found.`
                    : 'Share your experience and help other learners make informed decisions.'
                  }
                </p>
                {filterRating ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setFilterRating(null)}
                  >
                    Show All Reviews
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setShowForm(true)}
                    className="btn-hero"
                  >
                    Write First Review
                  </Button>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}