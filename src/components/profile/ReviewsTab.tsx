import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, MessageSquare, Star, Mic, Video } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  review_type: 'written' | 'voice' | 'video';
  approved: boolean;
  course_id: number;
  written_review?: string;
  voice_review_url?: string;
  video_review_url?: string;
  course_period: string;
  course_mode: string;
  created_at: string;
  courses?: {
    title: string;
  };
}

interface ReviewsTabProps {
  reviews: Review[];
  loading: boolean;
  onRefresh: () => void;
  onWriteReview: () => void;
}

const renderStars = (rating: number) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
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

export function ReviewsTab({ reviews, loading, onRefresh, onWriteReview }: ReviewsTabProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-center">Reviews Given</CardTitle>
            <CardDescription className="text-white/80 text-center">
              Your reviews and feedback on AI courses
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="ml-4"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
            <p className="text-white/80">Loading your reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-white/50 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No Reviews Yet</h3>
            <p className="text-white/60 mb-4">You haven't written any reviews yet.</p>
            <Button onClick={onWriteReview} className="btn-hero">
              Write Your First Review
            </Button>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {reviews.map(review => (
              <Card key={review.id} className="bg-white/5 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-white/60">{review.rating}/5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={review.approved ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {review.approved ? 'Approved' : 'Pending'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 text-xs border-white/20"
                      >
                        {getReviewTypeIcon(review.review_type)}
                        {review.review_type}
                      </Badge>
                    </div>
                  </div>

                  <h4 className="text-white font-medium mb-2">
                    {review.courses?.title || `Course ${review.course_id}`}
                  </h4>

                  <div className="text-sm text-white/60 mb-2">
                    {review.course_period} • {review.course_mode.replace('-', ' ')}
                  </div>

                  {review.review_type === 'written' && review.written_review && (
                    <p className="text-white/80 text-sm leading-relaxed">
                      "{review.written_review}"
                    </p>
                  )}

                  {review.review_type === 'voice' && review.voice_review_url && (
                    <div className="text-center py-2">
                      <Mic className="h-6 w-6 text-white/60 mx-auto mb-1" />
                      <p className="text-xs text-white/60">Voice review submitted</p>
                    </div>
                  )}

                  {review.review_type === 'video' && review.video_review_url && (
                    <div className="text-center py-2">
                      <Video className="h-6 w-6 text-white/60 mx-auto mb-1" />
                      <p className="text-xs text-white/60">Video review submitted</p>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-xs text-white/50">
                      Submitted on {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
