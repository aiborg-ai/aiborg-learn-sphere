/**
 * WorkshopActivitiesTimeline Component
 * Shows a timeline of workshop activities
 */

import { Icon } from '@/utils/iconLoader';
import { formatDistanceToNow } from 'date-fns';
import type { WorkshopActivity } from '@/services/workshop/types';

interface WorkshopActivitiesTimelineProps {
  activities: (WorkshopActivity & {
    profiles?: { display_name: string };
  })[];
}

export function WorkshopActivitiesTimeline({ activities }: WorkshopActivitiesTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Icon name="Clock" size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activities yet</p>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'join':
        return <Icon name="UserPlus" size={16} className="text-green-500" />;
      case 'leave':
        return <Icon name="UserMinus" size={16} className="text-red-500" />;
      case 'stage_change':
        return <Icon name="ArrowRight" size={16} className="text-blue-500" />;
      case 'message':
        return <Icon name="MessageSquare" size={16} className="text-purple-500" />;
      case 'file_upload':
        return <Icon name="Upload" size={16} className="text-orange-500" />;
      case 'contribution':
        return <Icon name="Award" size={16} className="text-yellow-500" />;
      default:
        return <Icon name="Activity" size={16} className="text-gray-500" />;
    }
  };

  const getActivityDescription = (activity: WorkshopActivity & { profiles?: { display_name: string } }) => {
    const userName = activity.profiles?.display_name || 'Someone';

    switch (activity.activity_type) {
      case 'join':
        return `${userName} joined the workshop`;
      case 'leave':
        return `${userName} left the workshop`;
      case 'stage_change':
        return `Stage changed to ${activity.activity_data?.stage || 'next stage'}`;
      case 'message':
        return `${userName} sent a message`;
      case 'file_upload':
        return `${userName} uploaded a file`;
      case 'contribution':
        return `${userName} made a contribution`;
      default:
        return `Activity: ${activity.activity_type}`;
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-3">
          <div className="relative flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
              {getActivityIcon(activity.activity_type)}
            </div>
            {index < activities.length - 1 && (
              <div className="w-0.5 h-full bg-muted mt-1" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <p className="text-sm font-medium">{getActivityDescription(activity)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
