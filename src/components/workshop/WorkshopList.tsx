/**
 * WorkshopList Component
 * Lists all workshops for a course
 */

import { WorkshopCard } from './WorkshopCard';
import { Icon } from '@/utils/iconLoader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Workshop, WorkshopSession } from '@/services/workshop/types';

interface WorkshopListProps {
  workshops: Workshop[];
  sessions?: WorkshopSession[];
  isEnrolled?: (workshopId: string) => boolean;
  onJoinSession?: (sessionId: string) => void;
  loading?: boolean;
}

export function WorkshopList({
  workshops,
  sessions = [],
  isEnrolled,
  onJoinSession,
  loading,
}: WorkshopListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!workshops || workshops.length === 0) {
    return (
      <Alert>
        <Icon name="Info" size={20} />
        <AlertDescription>
          No workshops available for this course yet. Check back soon!
        </AlertDescription>
      </Alert>
    );
  }

  // Get upcoming session for each workshop
  const getUpcomingSession = (workshopId: string) => {
    return sessions
      .filter(s => s.workshop_id === workshopId)
      .filter(s => s.status === 'scheduled' || s.status === 'in_progress')
      .sort(
        (a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
      )[0];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workshops.map(workshop => (
        <WorkshopCard
          key={workshop.id}
          workshop={workshop}
          upcomingSession={getUpcomingSession(workshop.id)}
          isEnrolled={isEnrolled?.(workshop.id)}
          onJoinSession={onJoinSession}
        />
      ))}
    </div>
  );
}
