/**
 * Notifications Widget
 *
 * Recent notifications and updates
 */

import { useQuery } from '@tanstack/react-query';
import { Bell, Check } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WidgetComponentProps, ActivityWidgetConfig } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

export function NotificationsWidget({ widget, isEditing }: WidgetComponentProps) {
  const config = widget.config as ActivityWidgetConfig;
  const limit = config.limit || 10;
  const showTimestamps = config.showTimestamps !== false;

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', widget.id, limit],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !isEditing,
    refetchInterval: config.refreshInterval ? config.refreshInterval * 1000 : 30000, // Default 30s
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No notifications</p>
        <p className="text-xs mt-1">You're all caught up!</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{unreadCount} unread</Badge>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {notifications.map(notification => {
          const isUnread = !notification.is_read;
          const createdAt = new Date(notification.created_at);
          const timeAgo = getTimeAgo(createdAt);

          return (
            <div
              key={notification.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg transition-colors',
                isUnread ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
              )}
            >
              <div className={cn('p-2 rounded-lg', isUnread ? 'bg-primary/10' : 'bg-background')}>
                <Bell className={cn('h-4 w-4', isUnread && 'text-primary')} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', isUnread && 'font-semibold')}>
                  {notification.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                {showTimestamps && <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>}
              </div>
              {isUnread && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  aria-label="Mark as read"
                  onClick={() => {
                    // Mark as read
                    supabase
                      .from('notifications')
                      .update({ is_read: true })
                      .eq('id', notification.id)
                      .then(() => {
                        // Invalidate query to refresh
                      });
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default NotificationsWidget;
