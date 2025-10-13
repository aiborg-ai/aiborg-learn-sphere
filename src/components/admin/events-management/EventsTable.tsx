import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Calendar, Edit, Trash2, MapPin, Clock, Users, Image, Archive } from 'lucide-react';
import { Event } from './types';

interface EventsTableProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onToggleStatus: (event: Event, field: 'is_active' | 'is_visible') => void;
  onMoveToPast: (event: Event) => void;
  onOpenPhotoUpload: (event: Event) => void;
}

const getEventTypeBadge = (type: string) => {
  const colors: Record<string, string> = {
    workshop: 'bg-blue-100 text-blue-800',
    seminar: 'bg-green-100 text-green-800',
    bootcamp: 'bg-purple-100 text-purple-800',
    webinar: 'bg-yellow-100 text-yellow-800',
    conference: 'bg-red-100 text-red-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

export function EventsTable({
  events,
  onEdit,
  onDelete,
  onToggleStatus,
  onMoveToPast,
  onOpenPhotoUpload,
}: EventsTableProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Registrations</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Past Event</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                No events found. Create your first event to get started.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Registrations</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Past Event</TableHead>
            <TableHead>Visible</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map(event => (
            <TableRow key={event.id}>
              <TableCell className="font-medium">{event.title}</TableCell>
              <TableCell>
                <Badge className={getEventTypeBadge(event.event_type)}>{event.event_type}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(event.event_date).toLocaleDateString()}
                  </span>
                  {event.event_time && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {event.event_time}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </span>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {event.registration_count || 0}/{event.max_capacity}
                </span>
              </TableCell>
              <TableCell>
                <Switch
                  checked={event.is_active}
                  onCheckedChange={() => onToggleStatus(event, 'is_active')}
                  disabled={event.is_past}
                />
              </TableCell>
              <TableCell>
                {event.is_past ? (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    Past Event
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onMoveToPast(event)}
                    className="text-xs"
                  >
                    <Archive className="h-3 w-3 mr-1" />
                    Move to Past
                  </Button>
                )}
              </TableCell>
              <TableCell>
                <Switch
                  checked={event.is_visible}
                  onCheckedChange={() => onToggleStatus(event, 'is_visible')}
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {event.is_past && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenPhotoUpload(event)}
                      className="text-blue-600"
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => onEdit(event)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(event)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
