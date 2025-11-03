/**
 * Calendar Event Modal Component
 *
 * Beautiful modal for displaying full event details with:
 * - Complete event information
 * - Action buttons
 * - Status indicators
 * - Navigation to full page
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  PlayCircle,
  ExternalLink,
  Star,
} from 'lucide-react';
import type { CalendarEvent } from '@/types/calendar';
import { EVENT_TYPE_COLORS, getEventTypeLabel } from '@/services/calendar/CalendarEventService';
import { format, formatDistanceToNow, isFuture } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface CalendarEventModalProps {
  /** Event to display */
  event: CalendarEvent | null;

  /** Whether modal is open */
  open: boolean;

  /** Callback when modal should close */
  onClose: () => void;
}

export function CalendarEventModal({ event, open, onClose }: CalendarEventModalProps) {
  const navigate = useNavigate();

  if (!event) return null;

  const typeConfig = EVENT_TYPE_COLORS[event.type];

  const getStatusIcon = () => {
    switch (event.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case 'ongoing':
        return <PlayCircle className="h-5 w-5 text-green-500 animate-pulse" />;
      default:
        return <Calendar className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      upcoming: { label: 'Upcoming', className: 'bg-blue-500' },
      ongoing: { label: 'Live Now', className: 'bg-green-500 animate-pulse' },
      completed: { label: 'Completed', className: 'bg-gray-500' },
      overdue: { label: 'Overdue', className: 'bg-red-500' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-400' },
    };

    const config = statusConfig[event.status];
    return <Badge className={cn('text-white', config.className)}>{config.label}</Badge>;
  };

  const handleViewDetails = () => {
    navigate(event.detailUrl);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {getStatusIcon()}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl pr-8">{event.title}</DialogTitle>
              <DialogDescription className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className={cn('text-xs', typeConfig.bg)}>
                  {getEventTypeLabel(event.type)}
                </Badge>
                {getStatusBadge()}
                {event.priority === 'high' && (
                  <Badge variant="destructive" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    High Priority
                  </Badge>
                )}
                {event.userRelationship !== 'none' && (
                  <Badge variant="outline" className="text-xs">
                    {event.userRelationship === 'assigned' && 'Assigned to you'}
                    {event.userRelationship === 'enrolled' && "You're enrolled"}
                    {event.userRelationship === 'registered' && 'Registered'}
                    {event.userRelationship === 'instructor' && "You're teaching"}
                    {event.userRelationship === 'facilitator' && "You're facilitating"}
                    {event.userRelationship === 'participant' && "You're participating"}
                  </Badge>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Description */}
          {event.description && (
            <div>
              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Description</h4>
              <p className="text-sm leading-relaxed">{event.description}</p>
            </div>
          )}

          <Separator />

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date & Time */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date & Time
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="font-medium">{format(event.startDate, 'EEEE, MMMM d, yyyy')}</div>
                  <div className="text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    {event.isAllDay ? (
                      'All Day'
                    ) : (
                      <>
                        {format(event.startDate, 'h:mm a')}
                        {event.endDate && ` - ${format(event.endDate, 'h:mm a')}`}
                      </>
                    )}
                  </div>
                </div>
                {isFuture(event.startDate) && (
                  <div className="text-xs text-muted-foreground">
                    Starts {formatDistanceToNow(event.startDate, { addSuffix: true })}
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </h4>
                <div className="text-sm font-medium">{event.location}</div>
              </div>
            )}

            {/* Course */}
            {event.courseTitle && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Course
                </h4>
                <div className="text-sm font-medium">{event.courseTitle}</div>
              </div>
            )}

            {/* Instructor/Facilitator */}
            {event.instructorName && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {event.type === 'workshop_session' ? 'Facilitator' : 'Instructor'}
                </h4>
                <div className="text-sm font-medium">{event.instructorName}</div>
              </div>
            )}

            {/* Participants/Capacity */}
            {event.participantCount !== null && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Participants
                </h4>
                <div className="text-sm">
                  <span className="font-medium">{event.participantCount}</span>
                  {event.maxCapacity && (
                    <>
                      <span className="text-muted-foreground"> / {event.maxCapacity}</span>
                      {event.isFull && (
                        <Badge variant="secondary" className="text-xs ml-2">
                          Full
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Additional Metadata */}
          {(event.metadata.price !== undefined ||
            event.metadata.category ||
            event.metadata.workshopStage) && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.metadata.price !== undefined && event.metadata.price !== null && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Price</h4>
                    <div className="text-sm font-medium">
                      {event.metadata.price === 0 ? 'Free' : `$${event.metadata.price}`}
                    </div>
                  </div>
                )}

                {event.metadata.category && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Category</h4>
                    <Badge variant="outline" className="text-xs">
                      {event.metadata.category}
                    </Badge>
                  </div>
                )}

                {event.metadata.workshopStage && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                      Workshop Stage
                    </h4>
                    <Badge variant="outline" className="text-xs capitalize">
                      {event.metadata.workshopStage}
                    </Badge>
                  </div>
                )}

                {event.metadata.submissionStatus && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                      Submission Status
                    </h4>
                    <Badge
                      variant={
                        event.metadata.submissionStatus === 'submitted'
                          ? 'default'
                          : event.metadata.submissionStatus === 'graded'
                            ? 'secondary'
                            : 'outline'
                      }
                      className="text-xs capitalize"
                    >
                      {event.metadata.submissionStatus.replace('_', ' ')}
                    </Badge>
                    {event.metadata.grade !== undefined && event.metadata.grade !== null && (
                      <span className="text-sm font-medium ml-2">
                        Grade: {event.metadata.grade}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Activities/Tags */}
          {event.metadata.activities && event.metadata.activities.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Activities</h4>
                <div className="flex flex-wrap gap-2">
                  {event.metadata.activities.map((activity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {activity}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleViewDetails} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Details
            </Button>
            {event.canJoin && (
              <Button variant="default" onClick={handleViewDetails}>
                Join Event
              </Button>
            )}
            {event.isCompleted && event.type === 'assignment' && (
              <Badge variant="secondary" className="px-3 py-2">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Submitted
              </Badge>
            )}
          </div>

          {/* Footer Info */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Event ID: {event.metadata.sourceId} • Type: {event.type}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
