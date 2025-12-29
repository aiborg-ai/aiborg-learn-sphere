/**
 * WorkshopsWidget Component
 * Displays upcoming and enrolled workshop sessions in the dashboard
 */

import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/utils/iconLoader';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { WorkshopSession } from '@/services/workshop/types';

export function WorkshopsWidget() {
  const { user } = useAuth();

  // Fetch user's enrolled workshop sessions
  const { data: enrolledSessions, isLoading: enrolledLoading } = useQuery({
    queryKey: ['user-workshop-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('workshop_participants')
        .select('workshop_sessions(*, workshops(*))')
        .eq('user_id', user.id)
        .in('workshop_sessions.status', ['scheduled', 'in_progress']);

      if (error) throw error;

      // Extract sessions from nested structure
      return (data || []).map(p => p.workshop_sessions).filter(Boolean) as (WorkshopSession & {
        workshops: { title: string };
      })[];
    },
    enabled: !!user,
  });

  // Fetch upcoming public workshop sessions
  const { data: upcomingSessions, isLoading: upcomingLoading } = useQuery({
    queryKey: ['upcoming-workshop-sessions'],
    queryFn: async () => {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('workshop_sessions')
        .select('*, workshops(*)')
        .eq('status', 'scheduled')
        .eq('is_open_enrollment', true)
        .gte('scheduled_start', now)
        .order('scheduled_start', { ascending: true })
        .limit(3);

      if (error) throw error;
      return data as (WorkshopSession & { workshops: { title: string } })[];
    },
  });

  const isLoading = enrolledLoading || upcomingLoading;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <Skeleton className="h-6 w-40 bg-white/10" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full bg-white/10" />
            <Skeleton className="h-16 w-full bg-white/10" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasEnrolledSessions = enrolledSessions && enrolledSessions.length > 0;
  const hasUpcomingSessions = upcomingSessions && upcomingSessions.length > 0;

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Users" size={20} className="text-purple-400" />
            <CardTitle className="text-white">Workshops</CardTitle>
          </div>
          <Link to="/workshops">
            <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
              View All
              <Icon name="ArrowRight" size={16} className="ml-1" />
            </Button>
          </Link>
        </div>
        <CardDescription className="text-white/60">
          {hasEnrolledSessions
            ? 'Your enrolled sessions'
            : 'Upcoming collaborative learning sessions'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasEnrolledSessions ? (
          <div className="space-y-3">
            {enrolledSessions.slice(0, 2).map(session => (
              <Link key={session.id} to={`/workshop/session/${session.id}`} className="block group">
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                      {session.workshops.title}
                    </h4>
                    <Badge
                      variant={session.status === 'in_progress' ? 'default' : 'secondary'}
                      className="ml-2 shrink-0"
                    >
                      {session.status === 'in_progress' ? 'Live' : 'Upcoming'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-1">
                      <Icon name="Calendar" size={14} />
                      <span>{formatDate(session.scheduled_start)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="Users" size={14} />
                      <span>
                        {session.current_participants || 0}/{session.max_participants}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : hasUpcomingSessions ? (
          <div className="space-y-3">
            {upcomingSessions.slice(0, 2).map(session => (
              <Link key={session.id} to={`/workshops`} className="block group">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/40 transition-colors">
                  <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-1 mb-2">
                    {session.workshops.title}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-1">
                      <Icon name="Calendar" size={14} />
                      <span>{formatDate(session.scheduled_start)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="Users" size={14} />
                      <span>
                        {session.current_participants || 0}/{session.max_participants} spots
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon name="Users" size={48} className="mx-auto text-white/20 mb-3" />
            <p className="text-white/60 text-sm mb-4">No upcoming workshops</p>
            <Link to="/workshops">
              <Button variant="outline" size="sm" className="text-purple-400 border-purple-500/30">
                Explore Workshops
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
