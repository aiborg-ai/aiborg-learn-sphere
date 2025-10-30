import { useState, memo } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Video, AlertCircle, CheckCircle, UserPlus } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { SessionWithCounts } from '@/types/session';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SessionCardProps {
  session: SessionWithCounts;
  onRegisterClick?: (session: SessionWithCounts) => void;
  showFullDetails?: boolean;
}

/**
 * SessionCard component - Displays session information with registration functionality
 *
 * Memoized to prevent unnecessary re-renders when session data hasn't changed
 *
 * @param session - Session details with counts
 * @param onRegisterClick - Callback when user clicks register button
 * @param showFullDetails - Whether to show all session details
 */
export const SessionCard = memo(function SessionCard({
  session,
  onRegisterClick,
  showFullDetails = false,
}: SessionCardProps) {
  const [showDetails, setShowDetails] = useState(showFullDetails);
  const { user } = useAuth();
  const { toast } = useToast();

  const sessionDate = new Date(session.session_date);
  const isUpcoming = sessionDate > new Date();
  const isPast = sessionDate < new Date();
  const spotsLeft = session.available_spots;
  const hasWaitlist = session.has_waitlist;

  // Status badge
  const getStatusBadge = () => {
    if (session.status === 'cancelled') {
      return (
        <Badge variant="destructive" className="ml-2">
          Cancelled
        </Badge>
      );
    }
    if (session.status === 'completed') {
      return (
        <Badge variant="secondary" className="ml-2">
          Completed
        </Badge>
      );
    }
    if (session.is_full) {
      return (
        <Badge variant="outline" className="ml-2 bg-orange-50 text-orange-700 border-orange-200">
          Full - Waitlist Available
        </Badge>
      );
    }
    if (spotsLeft <= 5 && spotsLeft > 0) {
      return (
        <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200">
          {spotsLeft} Spots Left
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
        Available
      </Badge>
    );
  };

  // Handle register button click
  const handleRegister = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to register for this session.',
        variant: 'destructive',
      });
      return;
    }

    if (onRegisterClick) {
      onRegisterClick(session);
    }
  };

  // Determine if registration is allowed
  const canRegister = session.status === 'scheduled' && isUpcoming && session.is_published;

  const isFree = session.price_amount === 0;

  return (
    <Card className={cn('hover:shadow-lg transition-shadow duration-200', isPast && 'opacity-75')}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center flex-wrap">
              {session.title}
              {getStatusBadge()}
            </CardTitle>
            {isFree && (
              <Badge variant="secondary" className="mt-2 bg-blue-50 text-blue-700 border-blue-200">
                Free Session
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className={cn('text-gray-600 text-sm line-clamp-3', showDetails && 'line-clamp-none')}>
          {session.description}
        </p>

        {/* Session Details */}
        <div className="space-y-2">
          {/* Date & Time */}
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">{format(sessionDate, 'EEEE, MMMM d, yyyy')}</span>
            <span className="ml-2 text-gray-400">
              ({formatDistanceToNow(sessionDate, { addSuffix: true })})
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span>
              {format(sessionDate, 'h:mm a')} ({session.duration_minutes} minutes)
            </span>
          </div>

          {/* Capacity */}
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2 text-gray-400" />
            <span>
              {session.registered_count} / {session.capacity} registered
            </span>
            {hasWaitlist && (
              <span className="ml-2 text-orange-600">({session.waitlist_count} on waitlist)</span>
            )}
          </div>

          {/* Meeting Provider */}
          {session.meeting_provider && (
            <div className="flex items-center text-sm text-gray-600">
              <Video className="w-4 h-4 mr-2 text-gray-400" />
              <span className="capitalize">{session.meeting_provider.replace('_', ' ')}</span>
            </div>
          )}

          {/* Target Age */}
          {showDetails && (
            <div className="flex items-center text-sm text-gray-600">
              <UserPlus className="w-4 h-4 mr-2 text-gray-400" />
              <span>
                Ages {session.target_age_min} - {session.target_age_max}
              </span>
            </div>
          )}

          {/* Price */}
          {!isFree && (
            <div className="text-sm font-semibold text-gray-900 mt-2">
              Price: {session.price_currency} {session.price_amount.toFixed(2)}
            </div>
          )}
        </div>

        {/* Full session warning */}
        {session.is_full && canRegister && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-900">Session Full</p>
              <p className="text-xs text-orange-700 mt-1">
                You can join the waitlist. We'll notify you if a spot opens up!
              </p>
            </div>
          </div>
        )}

        {/* Show/Hide Details Toggle */}
        {!showFullDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-700 px-0"
          >
            {showDetails ? 'Show Less' : 'Show More Details'}
          </Button>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {canRegister ? (
          <>
            <Button
              onClick={handleRegister}
              className="flex-1"
              variant={session.is_full ? 'outline' : 'default'}
            >
              {session.is_full ? (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join Waitlist
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Register Now
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="flex-1 text-center text-sm text-gray-500 py-2">
            {session.status === 'cancelled'
              ? 'This session has been cancelled'
              : session.status === 'completed'
                ? 'This session has ended'
                : isPast
                  ? 'This session has passed'
                  : 'Registration not available'}
          </div>
        )}
      </CardFooter>
    </Card>
  );
});
