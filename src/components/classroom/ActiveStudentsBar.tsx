import { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Circle } from '@/components/ui/icons';
import { useClassroomPresence } from '@/hooks/useClassroomPresence';
import { logger } from '@/utils/logger';

interface ActiveStudentsBarProps {
  courseId: number;
  lessonId?: string;
  compact?: boolean;
  maxDisplay?: number;
}

/**
 * Shows active students in real-time classroom
 *
 * Features:
 * - Live student presence
 * - Green pulse indicator for active status
 * - Compact mode for sidebar
 * - Student avatars with tooltips
 */
export function ActiveStudentsBar({
  courseId,
  lessonId,
  compact = false,
  maxDisplay = 10,
}: ActiveStudentsBarProps) {
  const {
    students,
    activeCount,
    isJoined,
    joinSession: _joinSession,
    leaveSession,
  } = useClassroomPresence({
    courseId,
    lessonId,
    autoJoin: true,
  });

  useEffect(() => {
    logger.info('ActiveStudentsBar mounted', { courseId, lessonId, isJoined });
  }, [courseId, lessonId, isJoined]);

  // Handle leave on unmount
  useEffect(() => {
    return () => {
      if (isJoined) {
        leaveSession();
      }
    };
  }, [isJoined, leaveSession]);

  const displayedStudents = students.slice(0, maxDisplay);
  const remainingCount = Math.max(0, activeCount - maxDisplay);

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
        <Circle className="h-3 w-3 text-green-500 fill-current animate-pulse" />
        <span className="text-sm font-medium text-green-700 dark:text-green-400">
          {activeCount} active
        </span>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Active Students</h3>
          </div>
          <Badge variant="secondary" className="bg-green-500 text-white">
            <Circle className="h-2 w-2 mr-1 fill-current animate-pulse" />
            {activeCount} online
          </Badge>
        </div>

        {activeCount === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No students currently active
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              {displayedStudents.map(student => {
                const profile = student.user_profile;
                const displayName = profile?.display_name || profile?.email || 'Student';
                const initials = displayName
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2);

                return (
                  <Tooltip key={student.id}>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-800 shadow-md">
                          <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        {student.is_active && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <p className="font-medium">{displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(student.joined_at).toLocaleTimeString()}
                        </p>
                        {student.current_position && (
                          <p className="text-xs text-muted-foreground mt-1">
                            At: {student.current_position}
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              {remainingCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-800 shadow-md bg-gray-200 dark:bg-gray-700">
                      <AvatarFallback className="text-sm font-medium">
                        +{remainingCount}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">{remainingCount} more students</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
          <p className="text-xs text-muted-foreground">
            Students see each other in real-time. Stay engaged!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
