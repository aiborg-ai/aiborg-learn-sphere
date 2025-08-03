import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCourses } from "@/hooks/useCourses";
import { useReviews } from "@/hooks/useReviews";
import { useToast } from "@/hooks/use-toast";
import { 
  Star, 
  StarIcon,
  MessageSquare, 
  Mic, 
  Video, 
  Send,
  User,
  UserX,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface ReviewFormData {
  courseId: string;
  displayNameOption: 'show_name' | 'anonymous';
  reviewType: 'written' | 'voice' | 'video';
  writtenReview: string;
  coursePeriod: string;
  courseMode: 'online' | 'in-person' | 'hybrid';
  rating: number;
}

export function ReviewForm() {
  const { user } = useAuth();
  const { courses } = useCourses();
  const { submitReview } = useReviews();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<ReviewFormData>({
    courseId: '',
    displayNameOption: 'show_name',
    reviewType: 'written',
    writtenReview: '',
    coursePeriod: '',
    courseMode: 'online',
    rating: 5
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a review.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.courseId || !formData.coursePeriod) {
      toast({
        title: "Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.reviewType === 'written' && !formData.writtenReview.trim()) {
      toast({
        title: "Review Content Required",
        description: "Please write your review.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      await submitReview({
        user_id: user.id,
        course_id: parseInt(formData.courseId),
        display_name_option: formData.displayNameOption,
        review_type: formData.reviewType,
        written_review: formData.reviewType === 'written' ? formData.writtenReview : null,
        voice_review_url: null, // Will be implemented later
        video_review_url: null, // Will be implemented later
        course_period: formData.coursePeriod,
        course_mode: formData.courseMode,
        rating: formData.rating
      });

      toast({
        title: "Review Submitted Successfully!",
        description: "Your review has been sent to our admin team for approval. You'll see it published on the website once approved. Thank you for your feedback!",
      });

      // Reset form
      setFormData({
        courseId: '',
        displayNameOption: 'show_name',
        reviewType: 'written',
        writtenReview: '',
        coursePeriod: '',
        courseMode: 'online',
        rating: 5
      });

    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-6 w-6 ${
                star <= formData.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {formData.rating} star{formData.rating !== 1 ? 's' : ''}
        </span>
      </div>
    );
  };

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Share Your Experience</h3>
        <p className="text-muted-foreground mb-4">
          Sign in to write a review and help other learners make informed decisions.
        </p>
        <Button className="btn-hero">
          Sign In to Review
        </Button>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Share Your Course Experience
        </CardTitle>
        <p className="text-muted-foreground">
          Help other learners by sharing your honest feedback about the course you completed.
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Selection */}
          <div className="space-y-2">
            <Label htmlFor="course">Course Completed *</Label>
            <Select 
              value={formData.courseId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, courseId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select the course you completed" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course Period */}
          <div className="space-y-2">
            <Label htmlFor="period">Course Period *</Label>
            <Input
              id="period"
              value={formData.coursePeriod}
              onChange={(e) => setFormData(prev => ({ ...prev, coursePeriod: e.target.value }))}
              placeholder="e.g., January 2024, Q1 2024, etc."
            />
          </div>

          {/* Course Mode */}
          <div className="space-y-2">
            <Label>Course Mode *</Label>
            <RadioGroup
              value={formData.courseMode}
              onValueChange={(value: 'online' | 'in-person' | 'hybrid') => 
                setFormData(prev => ({ ...prev, courseMode: value }))
              }
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="online" id="online" />
                <Label htmlFor="online">Online</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in-person" id="in-person" />
                <Label htmlFor="in-person">In-Person</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hybrid" id="hybrid" />
                <Label htmlFor="hybrid">Hybrid</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Display Name Option */}
          <div className="space-y-2">
            <Label>Display Preference</Label>
            <RadioGroup
              value={formData.displayNameOption}
              onValueChange={(value: 'show_name' | 'anonymous') => 
                setFormData(prev => ({ ...prev, displayNameOption: value }))
              }
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="show_name" id="show_name" />
                <Label htmlFor="show_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Show my name
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="anonymous" id="anonymous" />
                <Label htmlFor="anonymous" className="flex items-center gap-2">
                  <UserX className="h-4 w-4" />
                  Anonymous
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Overall Rating *</Label>
            {renderStarRating()}
          </div>

          {/* Review Type */}
          <div className="space-y-2">
            <Label>Review Format</Label>
            <RadioGroup
              value={formData.reviewType}
              onValueChange={(value: 'written' | 'voice' | 'video') => 
                setFormData(prev => ({ ...prev, reviewType: value }))
              }
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="written" id="written" />
                <Label htmlFor="written" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Written
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="voice" id="voice" />
                <Label htmlFor="voice" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Voice
                  <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video" id="video" />
                <Label htmlFor="video" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Video
                  <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Review Content */}
          {formData.reviewType === 'written' && (
            <div className="space-y-2">
              <Label htmlFor="review">Your Review *</Label>
              <Textarea
                id="review"
                value={formData.writtenReview}
                onChange={(e) => setFormData(prev => ({ ...prev, writtenReview: e.target.value }))}
                placeholder="Share your experience with this course. What did you learn? How was the quality? Would you recommend it to others?"
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 50 characters recommended for a helpful review.
              </p>
            </div>
          )}

          {/* Voice/Video Review Placeholders */}
          {formData.reviewType === 'voice' && (
            <div className="p-6 border border-dashed border-muted-foreground/30 rounded-lg text-center">
              <Mic className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Voice reviews will be available soon. For now, please use the written review option.
              </p>
            </div>
          )}

          {formData.reviewType === 'video' && (
            <div className="p-6 border border-dashed border-muted-foreground/30 rounded-lg text-center">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Video reviews will be available soon. For now, please use the written review option.
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-4 bg-muted/50 rounded-lg border border-muted">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Review Guidelines:</p>
                <ul className="space-y-1">
                  <li>• All reviews are subject to approval before being published</li>
                  <li>• Please keep your review honest, constructive, and respectful</li>
                  <li>• Focus on your learning experience and course quality</li>
                  <li>• Avoid personal attacks or inappropriate language</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full btn-hero"
            disabled={isSubmitting || (formData.reviewType !== 'written' && formData.reviewType !== 'voice' && formData.reviewType !== 'video')}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Submitting Review...
              </>
            ) : (
              <>
                Submit Review
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}