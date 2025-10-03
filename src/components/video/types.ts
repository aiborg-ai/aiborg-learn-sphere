export interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
}

export interface Note {
  id: string;
  timestamp: number;
  text: string;
  createdAt: string;
}

export interface Quiz {
  id: string;
  timestamp: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackSpeed: number;
  showControls: boolean;
  watchedPercentage: number;
  lastSavedProgress: number;
}

export interface EnhancedVideoPlayerProps {
  videoUrl: string;
  contentId: string;
  courseId?: number;
  title?: string;
  chapters?: Chapter[];
  transcript?: string;
  quizzes?: Quiz[];
  onProgressUpdate?: (progress: number) => void;
}
