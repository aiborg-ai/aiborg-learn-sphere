/**
 * ReviewSubmissionPage
 *
 * Dedicated page for submitting reviews from review request notifications
 * Parses URL params and provides context for the review form
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ReviewForm } from '@/components/forms/ReviewForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Tag } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/utils/logger';
import type { SessionType } from '@/types/reviewRequest';

interface SessionDetails {
  id: string;
  title: string;
  date: string;
  type: SessionType;
  description?: string;
  duration?: number;
}

export function ReviewSubmissionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const sessionId = searchParams.get('sessionId');
  const sessionType = searchParams.get('sessionType') as SessionType | null;
  const requestId = searchParams.get('requestId');

  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch session details
  useEffect(() => {
    if (!sessionId || !sessionType) {
      setError('Missing session information');
      setIsLoading(false);
      return;
    }

    const fetchSessionDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let query;
        let titleField = 'title';
        let dateField = 'session_date';

        // Query appropriate table based on session type
        switch (sessionType) {
          case 'free_session':
            query = supabase
              .from('free_sessions')
              .select('id, title, session_date, description, duration_minutes')
              .eq('id', sessionId)
              .single();
            break;

          case 'classroom':
            query = supabase
              .from('classroom_sessions')
              .select('id, lesson_title, started_at')
              .eq('id', sessionId)
              .single();
            titleField = 'lesson_title';
            dateField = 'started_at';
            break;

          case 'workshop':
            query = supabase
              .from('workshop_sessions')
              .select('id, session_name, scheduled_start')
              .eq('id', sessionId)
              .single();
            titleField = 'session_name';
            dateField = 'scheduled_start';
            break;

          default:
            throw new Error(`Unsupported session type: ${sessionType}`);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (data) {
          setSessionDetails({
            id: data.id,
            title: data[titleField] || 'Session',
            date: data[dateField],
            type: sessionType,
            description: data.description,
            duration: data.duration_minutes,
          });
        } else {
          setError('Session not found');
        }
      } catch (err) {
        logger.error('Error fetching session details:', err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId, sessionType]);

  // Handle successful review submission
  const handleReviewSuccess = () => {
    // Show success message and redirect after a short delay
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Please log in to submit a review.</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/auth')} className="mt-4">
          Go to Login
        </Button>
      </div>
    );
  }

  if (!sessionId || !sessionType) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>Invalid review request. Missing session information.</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/notifications')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Notifications
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/notifications')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Notifications
      </Button>

      {/* Session Details Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Submit Your Review</CardTitle>
          <CardDescription>
            Share your experience and help others make informed decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : sessionDetails ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-semibold">{sessionDetails.title}</h3>
                {sessionDetails.description && (
                  <p className="text-sm text-muted-foreground mt-1">{sessionDetails.description}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(sessionDetails.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {sessionDetails.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{sessionDetails.duration} minutes</span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  <span className="capitalize">{sessionDetails.type.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Review Form */}
      {!isLoading && !error && sessionDetails && (
        <Card>
          <CardContent className="pt-6">
            <ReviewForm
              sessionId={sessionId}
              sessionType={sessionType}
              requestId={requestId || undefined}
              onSuccess={handleReviewSuccess}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
