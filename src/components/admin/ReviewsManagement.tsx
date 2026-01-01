import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Star, Check, X, Loader2 } from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface Review {
  id: string;
  user_id: string;
  course_id: number;
  display_name_option: 'full_name' | 'first_name' | 'anonymous';
  review_type: 'written' | 'voice' | 'video';
  written_review: string | null;
  voice_review_url: string | null;
  video_review_url: string | null;
  course_period: string;
  course_mode: 'online' | 'in-person' | 'hybrid';
  rating: number;
  display: boolean;
  approved: boolean;
  created_at: string;
  profiles?: { display_name?: string; email?: string };
  courses?: { title: string };
}

export function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch reviews without embedded relations to avoid foreign key errors
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Fetch related data separately
      const reviewsWithRelations: Review[] = [];

      for (const review of reviewsData || []) {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('user_id', review.user_id)
          .single();

        // Fetch course
        const { data: courseData } = await supabase
          .from('courses')
          .select('title')
          .eq('id', review.course_id)
          .single();

        reviewsWithRelations.push({
          ...review,
          profiles: profileData || undefined,
          courses: courseData || undefined,
        });
      }

      setReviews(reviewsWithRelations);
    } catch (_error) {
      logger.error('Error fetching reviews:', _error);
      toast({
        title: 'Error',
        description: 'Failed to fetch reviews',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ approved: true })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Review approved successfully',
      });

      fetchReviews();
    } catch (_error) {
      logger.error('Error approving review:', _error);
      toast({
        title: 'Error',
        description: 'Failed to approve review',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Review rejected and deleted',
      });

      fetchReviews();
    } catch (_error) {
      logger.error('Error rejecting review:', _error);
      toast({
        title: 'Error',
        description: 'Failed to reject review',
        variant: 'destructive',
      });
    }
  };

  const handleToggleDisplay = async (reviewId: string, currentDisplay: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ display: !currentDisplay })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Review ${!currentDisplay ? 'shown' : 'hidden'} successfully`,
      });

      fetchReviews();
    } catch (_error) {
      logger.error('Error toggling review display:', _error);
      toast({
        title: 'Error',
        description: 'Failed to update review visibility',
        variant: 'destructive',
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Review Management</h2>
        <Button onClick={fetchReviews} variant="outline">
          Refresh
        </Button>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No reviews found</p>
          </CardContent>
        </Card>
      ) : (
        reviews.map(review => (
          <Card key={review.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {review.courses?.title || `Course ID: ${review.course_id}`}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {review.display_name_option === 'anonymous'
                        ? 'Anonymous'
                        : review.profiles?.display_name || review.profiles?.email || 'Unknown User'}
                    </span>
                    <span>•</span>
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={review.approved ? 'default' : 'secondary'}>
                    {review.approved ? 'Approved' : 'Pending'}
                  </Badge>
                  <Badge variant={review.display ? 'default' : 'outline'}>
                    {review.display ? 'Visible' : 'Hidden'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Rating</p>
                    {renderStars(review.rating)}
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Type</p>
                    <Badge variant="outline">{review.review_type}</Badge>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Course Mode</p>
                    <Badge variant="outline">{review.course_mode}</Badge>
                  </div>
                </div>

                {review.written_review && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Review Content</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                      {review.written_review}
                    </p>
                  </div>
                )}

                {review.voice_review_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Voice Review</p>
                    <audio controls className="w-full">
                      <source src={review.voice_review_url} type="audio/mpeg" />
                      <track kind="captions" srcLang="en" label="English" src="" />
                    </audio>
                  </div>
                )}

                {review.video_review_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Video Review</p>
                    <video controls className="w-full max-w-md rounded-md">
                      <source src={review.video_review_url} type="video/mp4" />
                      <track kind="captions" srcLang="en" label="English" src="" />
                    </video>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {!review.approved && (
                    <Button onClick={() => handleApprove(review.id)} size="sm">
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  <Button
                    onClick={() => handleToggleDisplay(review.id, review.display)}
                    variant="outline"
                    size="sm"
                  >
                    {review.display ? 'Hide' : 'Show'}
                  </Button>
                  <Button onClick={() => handleReject(review.id)} variant="destructive" size="sm">
                    <X className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
