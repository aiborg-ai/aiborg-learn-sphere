/**
 * WorkshopSessionRoom Component
 * Main component for running a workshop session with 4-stage workflow
 * Stages: Setup → Problem Statement → Solving → Reporting
 */

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Icon } from '@/utils/iconLoader';
import { useWorkshopSessionDetail } from '@/hooks/useWorkshopSessions';
import { WorkshopService } from '@/services/workshop';
import { toast } from 'sonner';
import { SetupStage } from './stages/SetupStage';
import { ProblemStatementStage } from './stages/ProblemStatementStage';
import { SolvingStage } from './stages/SolvingStage';
import { ReportingStage } from './stages/ReportingStage';
import { ParticipantsList } from './ParticipantsList';
import { WorkshopActivitiesTimeline } from './WorkshopActivitiesTimeline';
import { RealtimeConnectionBadge } from './RealtimeConnectionStatus';
import type { WorkshopStage } from '@/services/workshop/types';

interface WorkshopSessionRoomProps {
  sessionId: string;
}

export function WorkshopSessionRoom({ sessionId }: WorkshopSessionRoomProps) {
  const {
    session,
    participants,
    activities,
    stageSubmissions,
    isFacilitator,
    isParticipant,
    sessionLoading,
    participantCount,
    realtimeStatus,
    reconnectRealtime,
  } = useWorkshopSessionDetail(sessionId);

  const [isChangingStage, setIsChangingStage] = useState(false);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Icon name="Loader2" size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <Icon name="AlertCircle" size={48} className="mx-auto text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">Workshop session not found</p>
      </div>
    );
  }

  const workshop = session.workshops;

  // Calculate progress
  const stageOrder: WorkshopStage[] = ['setup', 'problem_statement', 'solving', 'reporting', 'completed'];
  const currentStageIndex = stageOrder.indexOf(session.current_stage);
  const progress = (currentStageIndex / (stageOrder.length - 1)) * 100;

  // Handle stage change
  const handleNextStage = async () => {
    const nextIndex = currentStageIndex + 1;
    if (nextIndex >= stageOrder.length - 1) {
      // Complete the workshop
      setIsChangingStage(true);
      try {
        await WorkshopService.completeSession(sessionId);
        toast.success('🎉 Workshop completed successfully!');
      } catch (error) {
        toast.error('Failed to complete workshop');
      } finally {
        setIsChangingStage(false);
      }
    } else {
      const nextStage = stageOrder[nextIndex];
      setIsChangingStage(true);
      try {
        await WorkshopService.updateStage({
          session_id: sessionId,
          new_stage: nextStage,
        });
      } catch (error) {
        toast.error('Failed to move to next stage');
      } finally {
        setIsChangingStage(false);
      }
    }
  };

  const getStageTitle = (stage: WorkshopStage) => {
    switch (stage) {
      case 'setup':
        return 'Setup & Preparation';
      case 'problem_statement':
        return 'Problem Statement';
      case 'solving':
        return 'Problem Solving';
      case 'reporting':
        return 'Reporting & Presentation';
      case 'completed':
        return 'Completed';
      default:
        return stage;
    }
  };

  const getStageDuration = (stage: WorkshopStage) => {
    switch (stage) {
      case 'setup':
        return workshop.setup_duration_minutes;
      case 'problem_statement':
        return workshop.problem_duration_minutes;
      case 'solving':
        return workshop.solving_duration_minutes;
      case 'reporting':
        return workshop.reporting_duration_minutes;
      default:
        return 0;
    }
  };

  const renderStageContent = () => {
    const stageProps = {
      session,
      workshop,
      participants: participants || [],
      stageSubmissions: stageSubmissions || [],
      isFacilitator,
      isParticipant,
    };

    switch (session.current_stage) {
      case 'setup':
        return <SetupStage {...stageProps} />;
      case 'problem_statement':
        return <ProblemStatementStage {...stageProps} />;
      case 'solving':
        return <SolvingStage {...stageProps} />;
      case 'reporting':
        return <ReportingStage {...stageProps} />;
      case 'completed':
        return (
          <div className="text-center py-12">
            <Icon name="CheckCircle" size={64} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Workshop Completed!</h3>
            <p className="text-muted-foreground">
              Thank you for your participation. Points have been awarded to all participants.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content - 3 columns */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl">{workshop.title}</CardTitle>
                    {/* Real-time connection indicator */}
                    <RealtimeConnectionBadge
                      status={realtimeStatus}
                      onReconnect={reconnectRealtime}
                    />
                  </div>
                  <CardDescription className="mt-2">{workshop.description}</CardDescription>
                </div>
                <Badge
                  variant={session.status === 'in_progress' ? 'default' : 'secondary'}
                  className="ml-4"
                >
                  {session.status}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Workshop Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {getStageTitle(session.current_stage)}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />

                {/* Stage Indicators */}
                <div className="flex justify-between mt-4">
                  {stageOrder.slice(0, -1).map((stage, index) => (
                    <div
                      key={stage}
                      className={`flex flex-col items-center gap-1 ${
                        index <= currentStageIndex ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index < currentStageIndex
                            ? 'bg-primary text-primary-foreground'
                            : index === currentStageIndex
                            ? 'bg-primary/20 border-2 border-primary'
                            : 'bg-muted'
                        }`}
                      >
                        {index < currentStageIndex ? (
                          <Icon name="Check" size={16} />
                        ) : (
                          <span className="text-xs font-semibold">{index + 1}</span>
                        )}
                      </div>
                      <span className="text-xs text-center hidden md:block">{getStageTitle(stage)}</span>
                      <span className="text-xs text-muted-foreground hidden md:block">
                        {getStageDuration(stage)}min
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stage Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Activity" size={20} />
                {getStageTitle(session.current_stage)}
              </CardTitle>
              {session.current_stage !== 'completed' && (
                <CardDescription>
                  Duration: {getStageDuration(session.current_stage)} minutes
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>{renderStageContent()}</CardContent>
          </Card>

          {/* Facilitator Controls */}
          {isFacilitator && session.status === 'in_progress' && session.current_stage !== 'completed' && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon name="Settings" size={20} />
                  Facilitator Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleNextStage}
                  disabled={isChangingStage}
                  size="lg"
                  className="w-full"
                >
                  {isChangingStage ? (
                    <>
                      <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : currentStageIndex === stageOrder.length - 2 ? (
                    <>
                      <Icon name="CheckCircle" size={20} className="mr-2" />
                      Complete Workshop
                    </>
                  ) : (
                    <>
                      <Icon name="ArrowRight" size={20} className="mr-2" />
                      Move to {getStageTitle(stageOrder[currentStageIndex + 1])}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="Users" size={20} />
                Participants ({participantCount}/{workshop.max_participants})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ParticipantsList participants={participants || []} />
            </CardContent>
          </Card>

          {/* Meeting Link */}
          {session.meeting_link && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon name="Video" size={20} />
                  Video Conference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                    <Icon name="ExternalLink" size={16} className="mr-2" />
                    Join Meeting
                  </a>
                </Button>
                {session.meeting_password && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Password: <code className="bg-muted px-2 py-1 rounded">{session.meeting_password}</code>
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Activities Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="Clock" size={20} />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <WorkshopActivitiesTimeline activities={activities || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
