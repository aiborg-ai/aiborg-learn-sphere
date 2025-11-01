/**
 * WorkshopCard Component
 * Displays a single workshop with sessions information
 */

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/utils/iconLoader';
import type { Workshop, WorkshopSession } from '@/services/workshop/types';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface WorkshopCardProps {
  workshop: Workshop;
  upcomingSession?: WorkshopSession;
  isEnrolled?: boolean;
  onJoinSession?: (sessionId: string) => void;
}

export function WorkshopCard({
  workshop,
  upcomingSession,
  isEnrolled,
  onJoinSession,
}: WorkshopCardProps) {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'advanced':
        return 'bg-orange-100 text-orange-800';
      case 'expert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{workshop.title}</CardTitle>
            <CardDescription className="mt-2">{workshop.description}</CardDescription>
          </div>
          <Badge className={getDifficultyColor(workshop.difficulty_level)}>
            {workshop.difficulty_level}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Objectives */}
        {workshop.objectives && workshop.objectives.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Icon name="Target" size={16} />
              Objectives
            </h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {workshop.objectives.map((obj, idx) => (
                <li key={idx}>{obj}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Workshop Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Icon name="Clock" size={16} className="text-muted-foreground" />
            <span>{workshop.duration_minutes} minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Users" size={16} className="text-muted-foreground" />
            <span>
              {workshop.min_participants}-{workshop.max_participants} participants
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Award" size={16} className="text-muted-foreground" />
            <span>{workshop.points_reward} AIBORG points</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Workflow" size={16} className="text-muted-foreground" />
            <span>4-stage workflow</span>
          </div>
        </div>

        {/* Upcoming Session */}
        {upcomingSession && (
          <div className="bg-primary/5 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Upcoming Session</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(upcomingSession.scheduled_start), 'PPP p')}
                </p>
              </div>
              <Badge variant={upcomingSession.status === 'in_progress' ? 'default' : 'secondary'}>
                {upcomingSession.status}
              </Badge>
            </div>
          </div>
        )}

        {/* Prerequisites */}
        {workshop.prerequisites && workshop.prerequisites.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Icon name="CheckCircle" size={16} />
              Prerequisites
            </h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {workshop.prerequisites.map((prereq, idx) => (
                <li key={idx}>{prereq}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button asChild variant="outline" className="flex-1">
          <Link to={`/workshop/${workshop.id}`}>
            <Icon name="Eye" size={16} className="mr-2" />
            View Details
          </Link>
        </Button>

        {upcomingSession && onJoinSession && (
          <Button
            onClick={() => onJoinSession(upcomingSession.id)}
            disabled={isEnrolled}
            className="flex-1"
          >
            {isEnrolled ? (
              <>
                <Icon name="CheckCircle" size={16} className="mr-2" />
                Enrolled
              </>
            ) : (
              <>
                <Icon name="UserPlus" size={16} className="mr-2" />
                Join Session
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
