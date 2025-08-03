import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReviews } from "@/hooks/useReviews";
import { ReviewForm } from "@/components/ReviewForm";
import { 
  Star, 
  MessageSquare, 
  User, 
  Calendar,
  MapPin,
  Mic,
  Video,
  Plus,
  Filter
} from "lucide-react";
import { format } from "date-fns";

export function ReviewsSection() {
  const { reviews, loading, error } = useReviews();
  const [showForm, setShowForm] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);

  console.log('ReviewsSection render:', { reviews, loading, error, reviewCount: reviews.length });

  const filteredReviews = filterRating 
    ? reviews.filter(review => review.rating === filterRating)
    : reviews;

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 : 0
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
            <span className="gradient-text">What Our Students Say</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Real feedback from our AI education community. Read authentic experiences from learners 
            who have transformed their careers through our programs.
          </p>
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
            <ReviewForm />
          </div>
        )}

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
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
                      {review.courses?.title || 'Course'}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>
                        {review.display_name_option === 'show_name' && review.profiles?.display_name
                          ? review.profiles.display_name
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
                  
                  {review.review_type === 'voice' && (
                    <div className="text-center py-4">
                      <Mic className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Voice review</p>
                    </div>
                  )}
                  
                  {review.review_type === 'video' && (
                    <div className="text-center py-4">
                      <Video className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Video review</p>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Reviewed on {formatDate(review.created_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
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
          )}
        </div>
      </div>
    </section>
  );
}