import { useState } from 'react';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star, MessageSquare, Send, CheckCircle, AlertCircle } from '@/components/ui/icons';
import { useCourses } from '@/hooks/useCourses';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface PublicReviewForm {
  guestName: string;
  guestEmail: string;
  courseId: string;
  coursePeriod: string;
  courseMode: 'online' | 'in-person' | 'hybrid';
  rating: number;
  writtenReview: string;
}

export default function PublicReviewPage() {
  const { courses } = useCourses();
  const { toast } = useToast();

  const [formData, setFormData] = useState<PublicReviewForm>({
    guestName: '',
    guestEmail: '',
    courseId: '',
    coursePeriod: '',
    courseMode: 'online',
    rating: 5,
    writtenReview: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isFormValid =
    formData.guestName.trim() &&
    formData.guestEmail.trim() &&
    formData.courseId &&
    formData.coursePeriod.trim() &&
    formData.writtenReview.trim().length >= 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast({
        title: 'Required Fields',
        description: 'Please fill in all fields. Review must be at least 20 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('submit_public_review', {
        p_guest_name: formData.guestName.trim(),
        p_guest_email: formData.guestEmail.trim(),
        p_course_id: parseInt(formData.courseId),
        p_written_review: formData.writtenReview.trim(),
        p_rating: formData.rating,
        p_course_period: formData.coursePeriod.trim(),
        p_course_mode: formData.courseMode,
      });

      if (error) {
        logger.error('Public review submission error:', error);
        throw error;
      }

      logger.log('Public review submitted:', data);

      // Get the review ID from the response
      const reviewId = (data as { id: string })?.id;
      const selectedCourse = courses.find(c => c.id.toString() === formData.courseId);

      // Send admin notification (don't fail submission if this fails)
      try {
        await supabase.functions.invoke('send-review-notification', {
          body: {
            reviewId,
            reviewContent: formData.writtenReview.trim(),
            rating: formData.rating,
            courseName: selectedCourse?.title || 'Unknown Course',
            userName: formData.guestName.trim(),
            guestEmail: formData.guestEmail.trim(),
          },
        });
        logger.log('Review notification sent to admin');
      } catch (notificationError) {
        logger.error('Failed to send review notification:', notificationError);
      }

      setIsSubmitted(true);
    } catch (err) {
      logger.error('Public review error:', err);
      toast({
        title: 'Submission Failed',
        description: err instanceof Error ? err.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <MessageSquare className="h-4 w-4" />
              <span>Share Your Experience</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
              <span className="gradient-text">Leave a Course Review</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Help other learners by sharing your honest feedback. No account needed.
            </p>
          </div>

          {isSubmitted ? (
            <Card className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="font-semibold text-xl mb-2">Thank You!</h2>
              <p className="text-muted-foreground mb-6">
                Your review has been submitted successfully. It will appear on the website once
                approved by our team.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    guestName: '',
                    guestEmail: '',
                    courseId: '',
                    coursePeriod: '',
                    courseMode: 'online',
                    rating: 5,
                    writtenReview: '',
                  });
                }}
              >
                Submit Another Review
              </Button>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Course Review
                </CardTitle>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guest-name">Full Name *</Label>
                      <Input
                        id="guest-name"
                        value={formData.guestName}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, guestName: e.target.value }))
                        }
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guest-email">Email Address *</Label>
                      <Input
                        id="guest-email"
                        type="email"
                        value={formData.guestEmail}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, guestEmail: e.target.value }))
                        }
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Course Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="course">Course *</Label>
                    <Select
                      value={formData.courseId}
                      onValueChange={value => setFormData(prev => ({ ...prev, courseId: value }))}
                    >
                      <SelectTrigger id="course">
                        <SelectValue placeholder="Select the course you attended" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(course => (
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
                      onChange={e =>
                        setFormData(prev => ({ ...prev, coursePeriod: e.target.value }))
                      }
                      placeholder="e.g., January 2026, Q1 2026, etc."
                    />
                  </div>

                  {/* Course Mode */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Course Mode *</div>
                    <RadioGroup
                      value={formData.courseMode}
                      onValueChange={(value: 'online' | 'in-person' | 'hybrid') =>
                        setFormData(prev => ({ ...prev, courseMode: value }))
                      }
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="online" id="mode-online" />
                        <Label htmlFor="mode-online">Online</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="in-person" id="mode-in-person" />
                        <Label htmlFor="mode-in-person">In-Person</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hybrid" id="mode-hybrid" />
                        <Label htmlFor="mode-hybrid">Hybrid</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Star Rating */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Overall Rating *</div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
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
                  </div>

                  {/* Written Review */}
                  <div className="space-y-2">
                    <Label htmlFor="review">Your Review *</Label>
                    <Textarea
                      id="review"
                      value={formData.writtenReview}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, writtenReview: e.target.value }))
                      }
                      placeholder="Share your experience with this course. What did you learn? How was the quality? Would you recommend it to others?"
                      rows={5}
                      className="resize-none"
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.writtenReview.length}/2000 characters (minimum 20)
                    </p>
                  </div>

                  {/* Disclaimer */}
                  <div className="p-4 bg-muted/50 rounded-lg border border-muted">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium mb-1">Review Guidelines:</p>
                        <ul className="space-y-1">
                          <li>All reviews are subject to approval before being published</li>
                          <li>Please keep your review honest, constructive, and respectful</li>
                          <li>
                            Your email is used for verification only and will not be displayed
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full btn-hero"
                    disabled={!isFormValid || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
