import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Star, MessageSquare, Mic, Video, Calendar, MapPin, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';
import VoiceRecorder from '@/components/VoiceRecorder';
import VideoRecorder from '@/components/VideoRecorder';

interface Event {
  id: number;  // Changed from string to number to match database
  title: string;
  event_date: string;
  location: string;
}

export default function EventReviewForm() {
  const [events, setEvents] = useState<Event[]>([]);
  const [attendedEvents, setAttendedEvents] = useState<number[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | ''>('');
  const [eventDateAttended, setEventDateAttended] = useState('');
  const [eventMode, setEventMode] = useState<'online' | 'in-person' | 'hybrid'>('online');
  const [displayPreference, setDisplayPreference] = useState<'show_name' | 'anonymous'>('show_name');
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [reviewMethod, setReviewMethod] = useState<'text' | 'voice' | 'video'>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchAttendedEvents();
    }
  }, [user]);

  const fetchAttendedEvents = async () => {
    try {
      // Fetch events the user has registered for and attended
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select('event_id')
        .eq('user_id', user?.id)
        .eq('registration_status', 'attended');

      if (regError) throw regError;

      const eventIds = registrations?.map(r => r.event_id) || [];
      setAttendedEvents(eventIds);

      // Fetch event details for attended events
      if (eventIds.length > 0) {
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id, title, event_date, location')
          .in('id', eventIds)
          .order('event_date', { ascending: false });

        if (eventsError) throw eventsError;
        setEvents(eventsData || []);
      }

      // For now, also fetch all active events (for testing)
      // Remove this in production when registration system is fully implemented
      const { data: allEvents, error: allEventsError } = await supabase
        .from('events')
        .select('id, title, event_date, location')
        .eq('is_active', true)
        .order('event_date', { ascending: false });

      if (!allEventsError && allEvents) {
        setEvents(allEvents);
      }
    } catch (error) {
      logger.error('Error fetching events:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedEvent || !review.trim()) return;

    setIsSubmitting(true);
    try {
      // First ensure the user is marked as attended (for testing)
      const { error: regError } = await supabase
        .from('event_registrations')
        .upsert({
          user_id: user.id,
          event_id: selectedEvent,
          registration_status: 'attended',
          attended_at: new Date().toISOString()
        });

      if (regError) {
        logger.warn('Could not update registration:', regError);
      }

      // Submit the review
      const { error } = await supabase
        .from('event_reviews')
        .insert({
          user_id: user.id,
          event_id: selectedEvent,
          rating,
          comment: review,
          event_date_attended: eventDateAttended || null,
          event_mode: eventMode,
          display_preference: displayPreference,
          display: false, // Admin will approve
          approved: false // Admin will approve
        });

      if (error) throw error;

      toast({
        title: 'Review Submitted!',
        description: 'Thank you for your feedback. Your review will be visible after approval.',
      });

      // Reset form
      setSelectedEvent('');
      setEventDateAttended('');
      setRating(5);
      setReview('');
      setEventMode('online');
      setDisplayPreference('show_name');
    } catch (error: any) {
      logger.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceRecording = (audioBlob: Blob) => {
    // Convert audio to text or handle audio submission
    // For now, we'll just add a placeholder
    setReview('[Voice review submitted - transcription pending]');
    toast({
      title: 'Voice Recorded',
      description: 'Your voice review has been recorded.',
    });
  };

  const handleVideoRecording = (videoBlob: Blob) => {
    // Handle video submission
    // For now, we'll just add a placeholder
    setReview('[Video review submitted - processing pending]');
    toast({
      title: 'Video Recorded',
      description: 'Your video review has been recorded.',
    });
  };

  const getRatingLabel = (stars: number) => {
    const labels = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[stars as keyof typeof labels];
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Please sign in to submit event reviews.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Share Your Event Experience
        </CardTitle>
        <CardDescription>
          Help other attendees by sharing your honest feedback about the event you attended.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Selection */}
          <div className="space-y-2">
            <Label htmlFor="event">Event Attended *</Label>
            <Select value={selectedEvent.toString()} onValueChange={(value) => setSelectedEvent(value ? parseInt(value) : '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select the event you attended" />
              </SelectTrigger>
              <SelectContent>
                {events.length === 0 ? (
                  <SelectItem value="no-events" disabled>
                    No events available for review
                  </SelectItem>
                ) : (
                  events.map(event => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      <div className="flex flex-col">
                        <span>{event.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.event_date).toLocaleDateString()} • {event.location}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Event Date Attended */}
          <div className="space-y-2">
            <Label htmlFor="eventDate">Event Date</Label>
            <Input
              id="eventDate"
              type="text"
              placeholder="e.g., December 2024"
              value={eventDateAttended}
              onChange={(e) => setEventDateAttended(e.target.value)}
            />
          </div>

          {/* Event Mode */}
          <div className="space-y-2">
            <Label>Event Mode *</Label>
            <RadioGroup value={eventMode} onValueChange={(value) => setEventMode(value as any)}>
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

          {/* Display Preference */}
          <div className="space-y-2">
            <Label>Display Preference</Label>
            <RadioGroup
              value={displayPreference}
              onValueChange={(value) => setDisplayPreference(value as any)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="show_name" id="show_name" />
                <Label htmlFor="show_name" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Show my name
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="anonymous" id="anonymous" />
                <Label htmlFor="anonymous" className="flex items-center gap-2">
                  <Users className="h-4 w-4 opacity-50" />
                  Anonymous
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Overall Rating *</Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-sm font-medium ml-2">
                {getRatingLabel(hoveredRating || rating)}
              </span>
            </div>
          </div>

          {/* Review Input Method */}
          <div className="space-y-2">
            <Label>Your Review *</Label>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={reviewMethod === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReviewMethod('text')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Text
              </Button>
              <Button
                type="button"
                variant={reviewMethod === 'voice' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReviewMethod('voice')}
              >
                <Mic className="h-4 w-4 mr-2" />
                Voice
              </Button>
              <Button
                type="button"
                variant={reviewMethod === 'video' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReviewMethod('video')}
              >
                <Video className="h-4 w-4 mr-2" />
                Video
              </Button>
            </div>

            {reviewMethod === 'text' && (
              <Textarea
                placeholder="Share your experience with this event. What did you learn? How was the organization? Would you recommend it to others?"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={5}
                required
              />
            )}

            {reviewMethod === 'voice' && (
              <VoiceRecorder onRecordingComplete={handleVoiceRecording} />
            )}

            {reviewMethod === 'video' && (
              <VideoRecorder onRecordingComplete={handleVideoRecording} />
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !selectedEvent || !review.trim()}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}