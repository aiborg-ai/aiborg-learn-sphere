import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UsersRound, Calendar, Clock, Users, Trophy, Loader2 } from '@/components/ui/icons';

interface Workshop {
  id: string;
  title: string;
  description: string;
  scheduled_date: string;
  duration_minutes: number;
  max_participants: number;
  points_reward: number;
  [key: string]: unknown;
}

interface CourseWorkshopsTabProps {
  workshops: Workshop[] | null;
  loading: boolean;
  onNavigate: (path: string) => void;
}

export function CourseWorkshopsTab({ workshops, loading, onNavigate }: CourseWorkshopsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersRound className="h-5 w-5 text-blue-500" />
          Collaborative Workshops
        </CardTitle>
        <CardDescription>Work in groups through structured learning activities</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : workshops && workshops.length > 0 ? (
          <div className="space-y-3">
            {workshops.map(workshop => {
              const isUpcoming = new Date(workshop.scheduled_date) > new Date();
              const isPast = new Date(workshop.scheduled_date) < new Date();

              return (
                <div
                  key={workshop.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{workshop.title}</h4>
                        {isUpcoming && <Badge variant="default">Upcoming</Badge>}
                        {isPast && <Badge variant="secondary">Past</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{workshop.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(workshop.scheduled_date).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {workshop.duration_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Max {workshop.max_participants}
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {workshop.points_reward} pts
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onNavigate(`/workshop/${workshop.id}`)}
                    disabled={isPast}
                  >
                    <UsersRound className="h-3 w-3 mr-1" />
                    {isUpcoming ? 'Register' : 'View Details'}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <UsersRound className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No workshops scheduled yet. Check back later.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
