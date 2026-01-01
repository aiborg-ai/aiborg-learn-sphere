import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Bell,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
} from '@/components/ui/icons';
import { format, formatDistanceToNow, isAfter, isBefore, addHours } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useSessionRegistration } from '@/hooks/useSessionRegistration';
import { useWaitlistActions } from '@/hooks/useWaitlist';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';
import type { SessionRegistration, SessionWaitlist } from '@/types/session';

interface SessionNotificationsProps {
  className?: string;
  maxDisplay?: number;
}

interface RegistrationWithDetails extends SessionRegistration {
  free_sessions?: {
    title: string;
    session_date: string;
    status: string;
  };
  session_waitlist?: SessionWaitlist[];
}

/**
 * SessionNotifications component - Displays user's session registrations and notifications
 *
 * Shows:
 * - Upcoming sessions
 * - Waitlist status
 * - Pending confirmations
 * - Promotion notifications
 */
export const SessionNotifications: React.FC<SessionNotificationsProps> = ({
  className,
  maxDisplay = 5,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getUserRegistrations } = useSessionRegistration();
  const { acceptPromotion, declinePromotion, loading: waitlistLoading } = useWaitlistActions();

  const [registrations, setRegistrations] = useState<RegistrationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUserRegistrations(user.email);
        setRegistrations(data as RegistrationWithDetails[]);
      } catch (_error) {
        logger.error('Error fetching registrations:', _error);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [user, getUserRegistrations]);

  const handleAcceptPromotion = async (waitlistId: string) => {
    try {
      await acceptPromotion(waitlistId);
      toast({
        title: 'Promotion Accepted',
        description: 'You have confirmed your registration for this session!',
      });
      // Refresh registrations
      if (user?.email) {
        const data = await getUserRegistrations(user.email);
        setRegistrations(data as RegistrationWithDetails[]);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to accept promotion. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeclinePromotion = async (waitlistId: string) => {
    try {
      await declinePromotion(waitlistId);
      toast({
        title: 'Promotion Declined',
        description: 'You have been returned to the waitlist.',
      });
      // Refresh registrations
      if (user?.email) {
        const data = await getUserRegistrations(user.email);
        setRegistrations(data as RegistrationWithDetails[]);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to decline promotion. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filter and sort registrations
  const activeRegistrations = registrations
    .filter(reg => {
      // Only show active registrations (not cancelled or expired)
      return reg.status !== 'cancelled' && reg.status !== 'expired';
    })
    .sort((a, b) => {
      // Sort by session date
      const dateA = a.free_sessions?.session_date
        ? new Date(a.free_sessions.session_date).getTime()
        : 0;
      const dateB = b.free_sessions?.session_date
        ? new Date(b.free_sessions.session_date).getTime()
        : 0;
      return dateA - dateB;
    });

  const displayedRegistrations = showAll
    ? activeRegistrations
    : activeRegistrations.slice(0, maxDisplay);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Session Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return null;
  }

  if (activeRegistrations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Session Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No active session registrations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Session Notifications
          <Badge variant="secondary" className="ml-auto">
            {activeRegistrations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedRegistrations.map(registration => {
          const session = registration.free_sessions;
          const waitlist = registration.session_waitlist?.[0];
          const sessionDate = session?.session_date ? new Date(session.session_date) : null;
          const isUpcoming = sessionDate ? isAfter(sessionDate, new Date()) : false;
          const isSoon =
            sessionDate && isUpcoming ? isBefore(sessionDate, addHours(new Date(), 24)) : false;

          return (
            <div
              key={registration.id}
              className={cn(
                'p-4 border rounded-lg space-y-3',
                registration.status === 'confirmed' && 'bg-green-50 border-green-200',
                registration.status === 'waitlisted' && 'bg-orange-50 border-orange-200',
                registration.status === 'pending' && 'bg-blue-50 border-blue-200'
              )}
            >
              {/* Header with status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-gray-900">{session?.title}</h4>
                  {sessionDate && (
                    <p className="text-xs text-gray-600 mt-1">
                      {format(sessionDate, 'MMM d, yyyy')} at {format(sessionDate, 'h:mm a')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {registration.status === 'confirmed' && (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-700 border-green-300"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Confirmed
                    </Badge>
                  )}
                  {registration.status === 'waitlisted' && (
                    <Badge
                      variant="outline"
                      className="bg-orange-100 text-orange-700 border-orange-300"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Waitlist #{waitlist?.position}
                    </Badge>
                  )}
                  {registration.status === 'pending' && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
              </div>

              {/* Status-specific messages */}
              {registration.status === 'confirmed' && isSoon && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-900 text-xs">
                    <strong>Reminder:</strong> This session starts in{' '}
                    {sessionDate && formatDistanceToNow(sessionDate)}!
                  </AlertDescription>
                </Alert>
              )}

              {registration.status === 'pending' && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900 text-xs">
                    Please check your email to confirm your registration.
                  </AlertDescription>
                </Alert>
              )}

              {registration.status === 'waitlisted' && waitlist?.status === 'promoted' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-sm font-semibold text-green-900 mb-1">
                    Great News! A Spot Opened Up!
                  </AlertTitle>
                  <AlertDescription className="text-green-900 text-xs space-y-2">
                    <p>
                      You've been promoted from the waitlist. Please respond within 24 hours to
                      secure your spot.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptPromotion(waitlist.id)}
                        disabled={waitlistLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclinePromotion(waitlist.id)}
                        disabled={waitlistLoading}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {registration.status === 'waitlisted' && waitlist?.status === 'waiting' && (
                <Alert className="bg-orange-50 border-orange-200">
                  <Users className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-900 text-xs">
                    You're #{waitlist.position} on the waitlist. We'll notify you if a spot opens
                    up.
                  </AlertDescription>
                </Alert>
              )}

              {/* Additional info */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                <span>
                  Registered{' '}
                  {formatDistanceToNow(new Date(registration.registered_at), { addSuffix: true })}
                </span>
                {sessionDate && (
                  <span className={cn(isUpcoming ? 'text-green-600' : 'text-gray-400')}>
                    {isUpcoming ? 'Upcoming' : 'Past'}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Show More/Less Button */}
        {activeRegistrations.length > maxDisplay && (
          <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)} className="w-full">
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show All ({activeRegistrations.length - maxDisplay} more)
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
