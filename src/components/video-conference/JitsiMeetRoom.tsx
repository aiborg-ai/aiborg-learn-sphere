/**
 * JitsiMeetRoom Component
 *
 * Enhanced Jitsi Meet integration with:
 * - Recording support
 * - Attendance tracking
 * - Breakout rooms
 * - Screen sharing
 * - Whiteboard
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, Users, Circle, Square, Maximize, Minimize, Grid3X3 } from '@/components/ui/icons';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

// Jitsi External API types
declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: JitsiMeetOptions
    ) => JitsiMeetExternalAPIInstance;
  }
}

interface JitsiMeetOptions {
  roomName: string;
  parentNode: HTMLElement;
  width?: string | number;
  height?: string | number;
  configOverwrite?: Record<string, unknown>;
  interfaceConfigOverwrite?: Record<string, unknown>;
  userInfo?: {
    displayName?: string;
    email?: string;
  };
  jwt?: string;
  onload?: () => void;
}

interface JitsiMeetExternalAPIInstance {
  dispose: () => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  addEventListener: (event: string, listener: (data: unknown) => void) => void;
  removeEventListener: (event: string, listener: (data: unknown) => void) => void;
  getParticipantsInfo: () => Array<{ displayName: string; participantId: string }>;
  getNumberOfParticipants: () => number;
  isAudioMuted: () => Promise<boolean>;
  isVideoMuted: () => Promise<boolean>;
}

interface JitsiMeetRoomProps {
  roomName: string;
  displayName: string;
  email?: string;
  sessionId: string;
  isModerator?: boolean;
  onParticipantJoined?: (participant: { id: string; name: string }) => void;
  onParticipantLeft?: (participant: { id: string; name: string }) => void;
  onRecordingStarted?: () => void;
  onRecordingStopped?: (recordingUrl?: string) => void;
  onMeetingEnded?: () => void;
  domain?: string;
  jwt?: string;
  className?: string;
}

interface AttendanceRecord {
  participantId: string;
  displayName: string;
  joinedAt: Date;
  leftAt?: Date;
  duration?: number;
}

const JITSI_DOMAIN = 'meet.jit.si';

export function JitsiMeetRoom({
  roomName,
  displayName,
  email,
  sessionId,
  isModerator = false,
  onParticipantJoined,
  onParticipantLeft,
  onRecordingStarted,
  onRecordingStopped,
  onMeetingEnded,
  domain = JITSI_DOMAIN,
  jwt,
  className = '',
}: JitsiMeetRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiMeetExternalAPIInstance | null>(null);
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load Jitsi External API script
  useEffect(() => {
    const loadScript = async () => {
      if (window.JitsiMeetExternalAPI) {
        setIsLoading(false);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.onload = () => setIsLoading(false);
      script.onerror = () => {
        logger.error('Failed to load Jitsi External API');
        toast({
          title: 'Connection Error',
          description: 'Failed to load video conferencing. Please refresh.',
          variant: 'destructive',
        });
      };
      document.body.appendChild(script);
    };

    loadScript();
  }, [domain, toast]);

  // Initialize Jitsi Meet
  useEffect(() => {
    if (isLoading || !containerRef.current || !window.JitsiMeetExternalAPI) {
      return;
    }

    const options: JitsiMeetOptions = {
      roomName,
      parentNode: containerRef.current,
      width: '100%',
      height: '100%',
      userInfo: {
        displayName,
        email,
      },
      jwt,
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        enableClosePage: false,
        // Recording config
        fileRecordingsEnabled: isModerator,
        liveStreamingEnabled: false,
        // Breakout rooms
        breakoutRooms: {
          hideAddRoomButton: !isModerator,
          hideAutoAssignButton: !isModerator,
          hideJoinRoomButton: false,
        },
        // Whiteboard
        whiteboard: {
          enabled: true,
          collabServerBaseUrl: 'https://excalidraw-backend.jitsi.net',
        },
        // Other settings
        enableNoisyMicDetection: true,
        enableLobby: isModerator,
        requireDisplayName: true,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'desktop',
          'fullscreen',
          'hangup',
          'chat',
          'raisehand',
          'participants-pane',
          'tileview',
          'whiteboard',
          ...(isModerator ? ['recording', 'breakoutrooms', 'security'] : []),
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_BACKGROUND: '#1a1a1a',
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
        MOBILE_APP_PROMO: false,
      },
    };

    try {
      const api = new window.JitsiMeetExternalAPI(domain, options);
      apiRef.current = api;

      // Event listeners
      api.addEventListener('videoConferenceJoined', () => {
        setIsConnected(true);
        logger.info('Joined video conference');
      });

      api.addEventListener('videoConferenceLeft', () => {
        setIsConnected(false);
        onMeetingEnded?.();
        logger.info('Left video conference');
      });

      api.addEventListener('participantJoined', (data: unknown) => {
        const participant = data as { id: string; displayName: string };
        setParticipantCount(prev => prev + 1);

        // Track attendance
        setAttendance(prev => {
          const updated = new Map(prev);
          updated.set(participant.id, {
            participantId: participant.id,
            displayName: participant.displayName,
            joinedAt: new Date(),
          });
          return updated;
        });

        onParticipantJoined?.({
          id: participant.id,
          name: participant.displayName,
        });
      });

      api.addEventListener('participantLeft', (data: unknown) => {
        const participant = data as { id: string };
        setParticipantCount(prev => Math.max(0, prev - 1));

        // Update attendance with leave time
        setAttendance(prev => {
          const updated = new Map(prev);
          const record = updated.get(participant.id);
          if (record) {
            record.leftAt = new Date();
            record.duration = Math.round(
              (record.leftAt.getTime() - record.joinedAt.getTime()) / 1000
            );
          }
          return updated;
        });

        onParticipantLeft?.({
          id: participant.id,
          name: attendance.get(participant.id)?.displayName || 'Unknown',
        });
      });

      api.addEventListener('recordingStatusChanged', (data: unknown) => {
        const status = data as { on: boolean };
        setIsRecording(status.on);

        if (status.on) {
          onRecordingStarted?.();
          toast({
            title: 'Recording Started',
            description: 'This session is now being recorded.',
          });
        } else {
          onRecordingStopped?.();
          toast({
            title: 'Recording Stopped',
            description: 'Recording has been saved.',
          });
        }
      });

      api.addEventListener('audioMuteStatusChanged', (data: unknown) => {
        const status = data as { muted: boolean };
        setIsAudioMuted(status.muted);
      });

      api.addEventListener('videoMuteStatusChanged', (data: unknown) => {
        const status = data as { muted: boolean };
        setIsVideoMuted(status.muted);
      });

      api.addEventListener('raiseHandUpdated', (data: unknown) => {
        const participant = data as { id: string; handRaised: boolean };
        if (participant.handRaised) {
          toast({
            description: `${attendance.get(participant.id)?.displayName || 'Someone'} raised their hand`,
          });
        }
      });
    } catch (error) {
      logger.error('Failed to initialize Jitsi:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to start video conference.',
        variant: 'destructive',
      });
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [
    isLoading,
    roomName,
    displayName,
    email,
    domain,
    jwt,
    isModerator,
    toast,
    onParticipantJoined,
    onParticipantLeft,
    onRecordingStarted,
    onRecordingStopped,
    onMeetingEnded,
    attendance,
  ]);

  // Control functions
  const toggleAudio = useCallback(() => {
    apiRef.current?.executeCommand('toggleAudio');
  }, []);

  const toggleVideo = useCallback(() => {
    apiRef.current?.executeCommand('toggleVideo');
  }, []);

  const toggleScreenShare = useCallback(() => {
    apiRef.current?.executeCommand('toggleShareScreen');
  }, []);

  const toggleChat = useCallback(() => {
    apiRef.current?.executeCommand('toggleChat');
  }, []);

  const toggleRaiseHand = useCallback(() => {
    apiRef.current?.executeCommand('toggleRaiseHand');
  }, []);

  const toggleTileView = useCallback(() => {
    apiRef.current?.executeCommand('toggleTileView');
  }, []);

  const startRecording = useCallback(() => {
    apiRef.current?.executeCommand('startRecording', { mode: 'file' });
  }, []);

  const stopRecording = useCallback(() => {
    apiRef.current?.executeCommand('stopRecording', 'file');
  }, []);

  const openBreakoutRooms = useCallback(() => {
    apiRef.current?.executeCommand('toggleBreakoutRooms');
  }, []);

  const endMeeting = useCallback(() => {
    if (isModerator) {
      apiRef.current?.executeCommand('endConference');
    } else {
      apiRef.current?.executeCommand('hangup');
    }
  }, [isModerator]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Get attendance report
  const getAttendanceReport = useCallback(() => {
    return Array.from(attendance.values()).map(record => ({
      ...record,
      duration:
        record.duration || Math.round((new Date().getTime() - record.joinedAt.getTime()) / 1000),
    }));
  }, [attendance]);

  if (isLoading) {
    return (
      <div className={`relative aspect-video ${className}`}>
        <Skeleton className="absolute inset-0 rounded-lg" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Video className="h-8 w-8 animate-pulse mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading video conference...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Jitsi container */}
      <div
        ref={containerRef}
        className={`relative bg-black rounded-lg overflow-hidden ${
          isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'
        }`}
      />

      {/* Status bar */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {isConnected && (
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {participantCount}
            </Badge>
          )}
          {isRecording && (
            <Badge variant="destructive" className="gap-1 animate-pulse">
              <Circle className="h-2 w-2 fill-current" />
              Recording
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 pointer-events-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 w-8 p-0 bg-black/50 text-white hover:bg-black/70"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Quick controls (moderator) */}
      {isModerator && isConnected && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 rounded-full px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            className={`h-8 w-8 p-0 ${isRecording ? 'text-red-500' : 'text-white'}`}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {isRecording ? <Square className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={openBreakoutRooms}
            className="h-8 w-8 p-0 text-white"
            title="Breakout Rooms"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export { type AttendanceRecord };
