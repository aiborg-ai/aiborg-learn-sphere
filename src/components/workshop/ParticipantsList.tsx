/**
 * ParticipantsList Component
 * Shows all participants in the workshop session
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/utils/iconLoader';
import type { WorkshopParticipant } from '@/services/workshop/types';

interface ParticipantsListProps {
  participants: (WorkshopParticipant & {
    profiles?: { display_name: string; avatar_url: string | null };
  })[];
}

export function ParticipantsList({ participants }: ParticipantsListProps) {
  if (participants.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Icon name="Users" size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No participants yet</p>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'facilitator':
        return <Badge variant="default">Facilitator</Badge>;
      case 'observer':
        return <Badge variant="secondary">Observer</Badge>;
      default:
        return null;
    }
  };

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'attended':
        return <Icon name="CheckCircle" size={16} className="text-green-500" />;
      case 'absent':
        return <Icon name="XCircle" size={16} className="text-red-500" />;
      case 'registered':
        return <Icon name="Clock" size={16} className="text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {participants.map(participant => {
        const displayName = participant.profiles?.display_name || 'Anonymous';
        const initials = displayName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <div
            key={participant.id}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={participant.profiles?.avatar_url || undefined}
                  alt={displayName}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getAttendanceIcon(participant.attendance_status)}
                  {participant.contribution_score !== undefined && participant.contribution_score > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Score: {participant.contribution_score}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {participant.role !== 'participant' && getRoleBadge(participant.role)}
          </div>
        );
      })}
    </div>
  );
}
