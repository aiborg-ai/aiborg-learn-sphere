import { useState, memo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, ExternalLink, CheckCircle, Ticket } from 'lucide-react';
import { ShareButton } from '@/components/shared';
import type { Event } from '@/hooks/useEvents';
import { useEventRegistrations } from '@/hooks/useEventRegistrations';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { MembershipService } from '@/services/membership';

interface EventCardProps {
  event: Event;
  onRegister?: (event: Event) => void;
}

/**
 * EventCard component - Displays event information with registration functionality
 *
 * Memoized to prevent unnecessary re-renders when event data hasn't changed
 *
 * @param event - Event details
 * @param onRegister - Optional callback when user registers
 */
export const EventCard = memo(function EventCard({ event, onRegister }: EventCardProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeringWithFamilyPass, setRegisteringWithFamilyPass] = useState(false);
  const [hasActiveMembership, setHasActiveMembership] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(true);
  const { user } = useAuth();
  const { isRegisteredForEvent, registerForEvent, registerWithFamilyPass } =
    useEventRegistrations();
  const { toast } = useToast();

  const isRegistered = isRegisteredForEvent(event.id);
  const isEventFull = event.max_capacity && event.current_registrations >= event.max_capacity;
  const spotsLeft = event.max_capacity ? event.max_capacity - event.current_registrations : null;

  // Check for active family pass membership
  useEffect(() => {
    const checkMembership = async () => {
      if (!user) {
        setHasActiveMembership(false);
        setCheckingMembership(false);
        return;
      }

      try {
        const isActive = await MembershipService.hasActiveMembership();
        setHasActiveMembership(isActive);
      } catch (error) {
        setHasActiveMembership(false);
      } finally {
        setCheckingMembership(false);
      }
    };

    checkMembership();
  }, [user]);

  const handleRegister = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to register for events.',
        variant: 'destructive',
      });
      return;
    }

    if (onRegister) {
      onRegister(event);
      return;
    }

    try {
      setIsRegistering(true);

      // Create payment session for event registration
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          courseName: `Event: ${event.title}`,
          coursePrice: `£${event.price}`,
          studentInfo: {
            email: user.email || user.user_metadata?.email,
            studentName: user.user_metadata?.display_name || user.email || 'Student',
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create payment session');
      }

      if (data?.url) {
        // Open payment session in new tab
        window.open(data.url, '_blank');

        toast({
          title: 'Payment Session Created',
          description: 'Complete your payment to register for the event.',
        });
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description:
          error instanceof Error ? error.message : 'Failed to start registration process',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const formatEventDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'EEEE, MMMM do, yyyy');
    } catch {
      return dateStr;
    }
  };

  const handleFamilyPassRegister = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to register for events.',
        variant: 'destructive',
      });
      return;
    }

    if (!hasActiveMembership) {
      toast({
        title: '❌ Active Family Pass Required',
        description: 'You need an active Family Pass to register for events for free.',
        variant: 'destructive',
        action: (
          <Link to="/family-membership" className="underline">
            View Family Pass
          </Link>
        ),
      });
      return;
    }

    try {
      setRegisteringWithFamilyPass(true);
      await registerWithFamilyPass(event.id);

      toast({
        title: '✅ Registration Successful!',
        description: `You've registered for ${event.title} with your Family Pass.`,
      });
    } catch (error) {
      if (error.name === 'NoActiveMembershipError') {
        toast({
          title: '❌ Active Family Pass Required',
          description: error.message,
          variant: 'destructive',
          action: (
            <Link to="/family-membership" className="underline">
              View Family Pass
            </Link>
          ),
        });
      } else if (error.name === 'DuplicateRegistrationError') {
        toast({
          title: 'Already Registered',
          description: error.message,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Registration Failed',
          description: error instanceof Error ? error.message : 'Failed to register for event',
          variant: 'destructive',
        });
      }
    } finally {
      setRegisteringWithFamilyPass(false);
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, 'h:mm a');
    } catch {
      return timeStr;
    }
  };

  return (
    <article aria-label={`Event: ${event.title}`}>
      <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-300 group">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between mb-3">
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary font-medium"
              aria-label={`Event category: ${event.category}`}
            >
              {event.category}
            </Badge>
            {isRegistered && (
              <Badge
                className="bg-green-100 text-green-800 border-green-200"
                aria-label="You are registered for this event"
              >
                <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                Registered
              </Badge>
            )}
          </div>

          <h3 className="font-display text-xl font-bold group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          <p className="text-muted-foreground text-sm italic">Information on Request</p>
        </CardHeader>

        <CardContent className="flex-1 space-y-4">
          {/* Date & Time */}
          <div className="flex items-center gap-3 text-sm" aria-label="Event date and time">
            <div
              className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"
              aria-hidden="true"
            >
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div
                className="font-medium"
                aria-label={`Event date: ${formatEventDate(event.event_date)}`}
              >
                {formatEventDate(event.event_date)}
              </div>
              <div
                className="text-muted-foreground flex items-center gap-1"
                aria-label={`Event time: ${formatTime(event.start_time)} to ${formatTime(event.end_time)}`}
              >
                <Clock className="h-3 w-3" aria-hidden="true" />
                {formatTime(event.start_time)} - {formatTime(event.end_time)}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3 text-sm" aria-label="Event location">
            <div
              className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center mt-0.5"
              aria-hidden="true"
            >
              <MapPin className="h-4 w-4 text-secondary-foreground" />
            </div>
            <div className="flex-1">
              <div
                className="font-medium text-secondary-foreground"
                aria-label={`Location: ${event.location}`}
              >
                {event.location}
              </div>
            </div>
          </div>

          {/* Capacity */}
          {event.max_capacity && (
            <div className="flex items-center gap-3 text-sm" aria-label="Event capacity">
              <div
                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
                aria-hidden="true"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div
                  className="font-medium"
                  aria-label={`${event.current_registrations} out of ${event.max_capacity} registered`}
                >
                  {event.current_registrations} / {event.max_capacity} registered
                </div>
                {spotsLeft !== null && spotsLeft > 0 && (
                  <div
                    className="text-muted-foreground"
                    aria-label={`${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} remaining`}
                  >
                    {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activities */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">Activities</div>
            <ul className="flex flex-wrap gap-1" aria-label="Event activities">
              {event.activities.map((activity, index) => (
                <li key={index} className="list-none">
                  <Badge
                    variant="outline"
                    className="text-xs bg-accent/50 hover:bg-accent transition-colors"
                  >
                    {activity}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>

        <CardFooter className="pt-4">
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2" aria-label={`Event price: £${event.price}`}>
                <span className="text-lg" aria-hidden="true">
                  £
                </span>
                <span className="text-2xl font-bold text-primary">{event.price}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShareButton title={event.title} description={event.description} />
                {isEventFull && (
                  <Badge variant="destructive" aria-label="This event is full">
                    Event Full
                  </Badge>
                )}
              </div>
            </div>

            {/* Show Family Pass button if user has active membership */}
            {user && hasActiveMembership && !isRegistered && !isEventFull ? (
              <div className="flex flex-col gap-2">
                {/* Family Pass Register Button */}
                <Button
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold group"
                  onClick={handleFamilyPassRegister}
                  disabled={registeringWithFamilyPass || checkingMembership}
                  aria-label={`Register for ${event.title} with Family Pass`}
                >
                  {registeringWithFamilyPass ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Ticket className="h-4 w-4 mr-2" />
                      Register with Family Pass (Free)
                    </>
                  )}
                </Button>

                {/* Or divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Regular Register Button */}
                <Button
                  variant="outline"
                  className="w-full group"
                  onClick={handleRegister}
                  disabled={isRegistering}
                  aria-label={`Register for ${event.title} with payment`}
                >
                  {isRegistering ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay & Register
                      <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                className="w-full btn-hero group"
                onClick={handleRegister}
                disabled={isRegistering || isRegistered || isEventFull}
                aria-label={
                  isRegistering
                    ? 'Registering for event...'
                    : isRegistered
                      ? 'You are already registered for this event'
                      : isEventFull
                        ? 'Event is full, registration unavailable'
                        : `Register for ${event.title} event`
                }
                aria-busy={isRegistering}
              >
                {isRegistering ? (
                  <>
                    <div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
                      aria-hidden="true"
                    ></div>
                    Registering...
                  </>
                ) : isRegistered ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                    Registered
                  </>
                ) : isEventFull ? (
                  'Event Full'
                ) : (
                  <>
                    Register Now
                    <ExternalLink
                      className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"
                      aria-hidden="true"
                    />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </article>
  );
});
