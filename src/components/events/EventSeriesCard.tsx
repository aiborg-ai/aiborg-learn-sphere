import { useState, memo } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Repeat,
  ChevronDown,
  ChevronUp,
  Ticket,
} from '@/components/ui/icons';
import { ShareButton } from '@/components/shared';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import {
  useEventSeriesDetails,
  useEventSeriesRegistration,
  useRegisterEventSeries,
  type EventSeries,
} from '@/hooks/useEventSeries';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/utils/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EventSeriesCardProps {
  series: EventSeries;
}

/**
 * EventSeriesCard - Displays recurring event series with upcoming sessions
 * Shows registration button and expandable session list
 */
export const EventSeriesCard = memo(function EventSeriesCard({ series }: EventSeriesCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch series details with upcoming sessions
  const { data: seriesData, isLoading: loadingDetails } = useEventSeriesDetails(series.id);
  const { data: registration, isLoading: loadingRegistration } = useEventSeriesRegistration(
    series.id
  );
  const registerMutation = useRegisterEventSeries();

  const isRegistered = !!registration;
  const isFree = parseFloat(series.price) === 0;
  const upcomingSessions = seriesData?.upcomingSessions || [];

  // Get recurrence display text
  const getRecurrenceText = () => {
    if (!series.recurrence_pattern) return 'Recurring Event';

    const { day_of_week, frequency } = series.recurrence_pattern;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[day_of_week || 0];

    if (frequency === 'weekly') return `Every ${dayName}`;
    if (frequency === 'biweekly') return `Every Other ${dayName}`;
    if (frequency === 'monthly') return `Monthly on ${dayName}s`;

    return 'Recurring Event';
  };

  const handleRegisterClick = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to register for this event series.',
        variant: 'destructive',
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmRegistration = async () => {
    try {
      await registerMutation.mutateAsync({
        eventId: series.id,
        paymentMethod: isFree ? 'free' : undefined,
      });

      setShowConfirmDialog(false);

      toast({
        title: 'Registration Successful!',
        description: `You've been registered for ${series.title}. Check your tickets page for session details.`,
      });
    } catch (_error) {
      // Error handled by mutation
      logger.error('Event series registration error:', error);
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white/95 backdrop-blur">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  <Repeat className="h-3 w-3 mr-1" />
                  Series
                </Badge>
                {series.category && (
                  <Badge variant="outline" className="text-gray-700">
                    {series.category}
                  </Badge>
                )}
                {isFree && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    FREE
                  </Badge>
                )}
                {isRegistered && (
                  <Badge variant="default" className="bg-blue-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Registered
                  </Badge>
                )}
              </div>

              <h3 className="text-xl font-semibold text-gray-900 leading-tight">{series.title}</h3>

              <p className="text-sm text-gray-600 line-clamp-2">{series.description}</p>
            </div>

            <ShareButton
              title={series.title}
              text={`Check out this event series: ${series.title}`}
              url={window.location.href}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Event Series Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Repeat className="h-4 w-4 text-purple-600" />
              <span className="font-medium">{getRecurrenceText()}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>
                {series.start_time} - {series.end_time}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="h-4 w-4 text-red-600" />
              <span>{series.location}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Users className="h-4 w-4 text-green-600" />
              <span>{series.max_capacity || 'Unlimited'} spots per session</span>
            </div>

            {upcomingSessions.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-700 col-span-2">
                <Ticket className="h-4 w-4 text-orange-600" />
                <span className="font-medium">{upcomingSessions.length} upcoming sessions</span>
              </div>
            )}
          </div>

          {/* Upcoming Sessions Preview */}
          {!loadingDetails && upcomingSessions.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Next Sessions</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="h-auto py-1"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      View All
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                {(showDetails ? upcomingSessions : upcomingSessions.slice(0, 3)).map(session => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between text-sm bg-white rounded p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-gray-500" />
                      <span className="font-medium">
                        {format(parseISO(session.session_date), 'EEE, MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>
                        {session.start_time} - {session.end_time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {!showDetails && upcomingSessions.length > 3 && (
                <p className="text-xs text-gray-500 text-center">
                  +{upcomingSessions.length - 3} more sessions
                </p>
              )}
            </div>
          )}

          {loadingDetails && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 bg-gray-50">
          {isRegistered ? (
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
                <CheckCircle className="h-5 w-5" />
                <span>You're registered for this series</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">View your tickets on the My Tickets page</p>
            </div>
          ) : (
            <Button
              onClick={handleRegisterClick}
              disabled={!user || registerMutation.isPending || loadingRegistration}
              className="flex-1"
              size="lg"
            >
              {registerMutation.isPending ? (
                'Registering...'
              ) : (
                <>
                  <Ticket className="h-4 w-4 mr-2" />
                  Register for Series {isFree && '(FREE)'}
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Registration Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register for {series.title}?</DialogTitle>
            <DialogDescription>
              You'll receive tickets for all upcoming sessions in this series.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">What you'll get:</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Tickets for all {upcomingSessions.length} upcoming sessions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>QR codes for easy check-in</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Meeting links after check-in</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Automatic tickets for future sessions</span>
                </li>
              </ul>
            </div>

            {!loadingDetails && upcomingSessions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Next 3 Sessions:</h4>
                <div className="space-y-2">
                  {upcomingSessions.slice(0, 3).map(session => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between text-sm bg-gray-50 rounded p-2"
                    >
                      <span className="font-medium">
                        {format(parseISO(session.session_date), 'EEE, MMM d')}
                      </span>
                      <span className="text-gray-600">
                        {session.start_time} - {session.end_time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {isFree ? 'FREE' : `₹${series.price}`}
              </p>
              <p className="text-sm text-gray-600">per series (all sessions included)</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRegistration}
              disabled={registerMutation.isPending}
              className="min-w-[120px]"
            >
              {registerMutation.isPending ? 'Registering...' : 'Confirm Registration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
