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
import { Calendar, Clock, QrCode, X, CheckCircle } from '@/components/ui/icons';
import { useSessionTickets } from '@/hooks/useSessionTickets';
import { useToast } from '@/hooks/use-toast';

interface SessionTicketCardProps {
  ticket: {
    id: string;
    ticket_number: string;
    session_id: string;
    session_title: string;
    session_date: string;
    start_time: string;
    status: 'active' | 'cancelled' | 'attended' | 'missed';
    qr_code: string;
    checked_in_at?: string;
  };
  courseId: number;
}

export function SessionTicketCard({ ticket, courseId }: SessionTicketCardProps) {
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const { checkInToSession, cancelTicket, reactivateTicket, getTicketQRCode } =
    useSessionTickets(courseId);
  const { toast } = useToast();

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
    try {
      const dataUrl = await getTicketQRCode(ticket.id);
      setQrCodeDataUrl(dataUrl);
      setShowQRCode(true);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to generate QR code',
        variant: 'destructive',
      });
    }
  };

  const handleCheckIn = async () => {
    try {
      await checkInToSession.mutateAsync({
        sessionId: ticket.session_id,
        method: 'manual',
      });
      toast({
        title: 'Success',
        description: 'Checked in successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Check-in Failed',
        description: error.message || 'Unable to check in at this time',
        variant: 'destructive',
      });
    }
  };

  const handleCancelTicket = async () => {
    try {
      await cancelTicket.mutateAsync(ticket.id);
      toast({
        title: 'Ticket Cancelled',
        description: 'Your ticket has been cancelled',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel ticket',
        variant: 'destructive',
      });
    }
  };

  const handleReactivateTicket = async () => {
    try {
      await reactivateTicket.mutateAsync(ticket.id);
      toast({
        title: 'Ticket Reactivated',
        description: 'Your ticket has been reactivated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reactivate ticket',
        variant: 'destructive',
      });
    }
  };

  const sessionDate = new Date(ticket.session_date);
  const isPastSession = sessionDate < new Date();
  const canCheckIn = ticket.status === 'active' && !isPastSession;
  const canCancel = ticket.status === 'active' && !ticket.checked_in_at;
  const canReactivate = ticket.status === 'cancelled' && !isPastSession;

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{ticket.session_title}</CardTitle>
              <CardDescription className="mt-1 font-mono text-xs">
                {ticket.ticket_number}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{sessionDate.toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{ticket.start_time}</span>
          </div>

          {ticket.checked_in_at && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Checked in at {new Date(ticket.checked_in_at).toLocaleTimeString()}</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2 border-t bg-muted/50 pt-3">
          {canCheckIn && (
            <>
              <Button
                size="sm"
                onClick={handleCheckIn}
                disabled={checkInToSession.isPending}
                className="flex-1"
              >
                Check In
              </Button>
              <Button size="sm" variant="outline" onClick={handleShowQRCode}>
                <QrCode className="h-4 w-4" />
              </Button>
            </>
          )}

          {canCancel && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleCancelTicket}
              disabled={cancelTicket.isPending}
              className="flex-1"
            >
              <X className="mr-1 h-4 w-4" />
              Cancel
            </Button>
          )}

          {canReactivate && (
            <Button
              size="sm"
              onClick={handleReactivateTicket}
              disabled={reactivateTicket.isPending}
              className="flex-1"
            >
              Reactivate
            </Button>
          )}

          {ticket.status === 'active' && !canCheckIn && !canCancel && (
            <Button size="sm" variant="outline" onClick={handleShowQRCode} className="flex-1">
              <QrCode className="mr-1 h-4 w-4" />
              View QR Code
            </Button>
          )}
        </CardFooter>
      </Card>

      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ticket.session_title}</DialogTitle>
            <DialogDescription>Scan this QR code to check in to the session</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {qrCodeDataUrl && (
              <img
                src={qrCodeDataUrl}
                alt="Session QR Code"
                className="h-64 w-64 rounded-lg border"
              />
            )}
            <p className="font-mono text-sm text-muted-foreground">{ticket.ticket_number}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
