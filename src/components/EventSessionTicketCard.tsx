import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  QrCode,
  X,
  CheckCircle,
  MapPin,
  ExternalLink,
  Loader2,
} from '@/components/ui/icons';
import { useCheckInEventSession, useManageEventTicket } from '@/hooks/useEventSessionTickets';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isBefore, isAfter, addMinutes, subMinutes } from 'date-fns';
import QRCode from 'qrcode';
import type { EventSessionTicket } from '@/hooks/useEventSessionTickets';

interface EventSessionTicketCardProps {
  ticket: EventSessionTicket;
}

export function EventSessionTicketCard({ ticket }: EventSessionTicketCardProps) {
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);

  const checkInMutation = useCheckInEventSession();
  const manageMutation = useManageEventTicket();
  const { toast } = useToast();

  const sessionData = ticket.event_sessions;
  const eventData = ticket.events;

  // Parse session date and time
  const sessionDateTime = sessionData
    ? parseISO(`${sessionData.session_date}T${sessionData.start_time}`)
    : new Date();

  const checkInWindowStart = sessionData?.check_in_window_start
    ? parseISO(sessionData.check_in_window_start)
    : subMinutes(sessionDateTime, 30);

  const checkInWindowEnd = sessionData?.check_in_window_end
    ? parseISO(sessionData.check_in_window_end)
    : addMinutes(sessionDateTime, 15);

  const now = new Date();
  const isPastSession = isBefore(sessionDateTime, now);
  const isCheckInWindowOpen = isAfter(now, checkInWindowStart) && isBefore(now, checkInWindowEnd);
  const canCheckIn = ticket.status === 'active' && !isPastSession;
  const canShowMeetingLink =
    ticket.status === 'attended' || (isCheckInWindowOpen && ticket.status === 'active');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500';
      case 'attended':
        return 'bg-green-500';
      case 'missed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleShowQRCode = async () => {
    setGeneratingQR(true);
    try {
      // Generate QR code from ticket QR data
      const dataUrl = await QRCode.toDataURL(ticket.qr_code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeDataUrl(dataUrl);
      setShowQRCode(true);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to generate QR code',
        variant: 'destructive',
      });
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const result = await checkInMutation.mutateAsync({
        ticketId: ticket.id,
        method: 'manual',
      });

      toast({
        title: 'Checked In Successfully!',
        description: result.meetingUrl
          ? 'Meeting link is now available below'
          : 'You are checked in for this session',
      });
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancelTicket = async () => {
    try {
      await manageMutation.mutateAsync({
        action: 'cancel',
        ticketId: ticket.id,
      });
    } catch {
      // Error handled by mutation
    }
  };

  const handleReactivateTicket = async () => {
    try {
      await manageMutation.mutateAsync({
        action: 'reactivate',
        ticketId: ticket.id,
      });
    } catch {
      // Error handled by mutation
    }
  };

  const handleJoinMeeting = () => {
    if (sessionData?.meeting_url) {
      window.open(sessionData.meeting_url, '_blank', 'noopener,noreferrer');
    }
  };

  const canCancel = ticket.status === 'active' && !ticket.checked_in_at && !isPastSession;
  const canReactivate = ticket.status === 'cancelled' && !isPastSession;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {eventData?.series_name || 'Event'}
                </Badge>
              </div>
              <CardTitle className="text-lg">{sessionData?.title || 'Event Session'}</CardTitle>
              <CardDescription className="mt-1 font-mono text-xs">
                {ticket.ticket_number}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(ticket.status)}>
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-3">
          {/* Session Date & Time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="font-medium">
              {sessionData && format(parseISO(sessionData.session_date), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>
              {sessionData?.start_time} - {sessionData?.end_time}
            </span>
          </div>

          {sessionData?.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-red-600" />
              <span>{sessionData.location}</span>
            </div>
          )}

          {/* Check-in timestamp */}
          {ticket.checked_in_at && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded p-2">
              <CheckCircle className="h-4 w-4" />
              <span>Checked in at {format(parseISO(ticket.checked_in_at), 'h:mm a, MMM d')}</span>
            </div>
          )}

          {/* Check-in window info */}
          {!ticket.checked_in_at && ticket.status === 'active' && !isPastSession && (
            <div className="text-xs text-gray-600 bg-blue-50 rounded p-2">
              {isCheckInWindowOpen ? (
                <span className="text-green-700 font-medium">✓ Check-in window is open</span>
              ) : (
                <span>Check-in opens: {format(checkInWindowStart, 'h:mm a, MMM d')}</span>
              )}
            </div>
          )}

          {/* Meeting Link */}
          {canShowMeetingLink && sessionData?.meeting_url && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-gray-700 mb-2 font-medium">Online Meeting</p>
              <Button
                onClick={handleJoinMeeting}
                variant="default"
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Join Meeting
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-wrap gap-2 bg-gray-50">
          {/* QR Code Button */}
          {canCheckIn && (
            <Button
              onClick={handleShowQRCode}
              disabled={generatingQR}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {generatingQR ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Show QR Code
                </>
              )}
            </Button>
          )}

          {/* Check-in Button */}
          {canCheckIn && (
            <Button
              onClick={handleCheckIn}
              disabled={checkInMutation.isPending || !isCheckInWindowOpen}
              size="sm"
              className="flex-1"
            >
              {checkInMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking in...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Check In
                </>
              )}
            </Button>
          )}

          {/* Cancel Button */}
          {canCancel && (
            <Button
              onClick={handleCancelTicket}
              disabled={manageMutation.isPending}
              variant="destructive"
              size="sm"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Ticket
            </Button>
          )}

          {/* Reactivate Button */}
          {canReactivate && (
            <Button
              onClick={handleReactivateTicket}
              disabled={manageMutation.isPending}
              variant="default"
              size="sm"
              className="flex-1"
            >
              Reactivate Ticket
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* QR Code Modal */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Session Check-In QR Code</DialogTitle>
            <DialogDescription>Scan this QR code to check in to the session</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {qrCodeDataUrl && (
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <img src={qrCodeDataUrl} alt="QR Code" className="w-64 h-64" />
              </div>
            )}

            <div className="text-center space-y-2">
              <p className="font-mono text-xs text-gray-600">{ticket.ticket_number}</p>
              {sessionData && (
                <>
                  <p className="font-semibold text-sm">{sessionData.title}</p>
                  <p className="text-sm text-gray-600">
                    {format(parseISO(sessionData.session_date), 'MMMM d, yyyy')} •{' '}
                    {sessionData.start_time}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowQRCode(false)} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
