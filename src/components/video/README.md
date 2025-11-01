# Video Components

This directory contains the refactored EnhancedVideoPlayer component and its sub-components.

## Structure

### Main Component

- **EnhancedVideoPlayer.tsx** - Main orchestrator component that combines all sub-components

### Sub-Components

- **VideoControls.tsx** - Video playback controls (play, pause, volume, speed, fullscreen)
- **VideoChapters.tsx** - Chapter navigation interface
- **VideoNotes.tsx** - Note-taking functionality with timestamps
- **VideoTranscript.tsx** - Video transcript display
- **VideoQuiz.tsx** - Interactive quiz overlay
- **VideoSidebar.tsx** - Sidebar that contains chapters, notes, and transcript tabs

### Custom Hooks

- **useVideoPlayer.ts** - Video player state and controls (play, pause, seek, volume, etc.)
- **useVideoProgress.ts** - Progress tracking and persistence to Supabase
- **useVideoNotes.ts** - Note management (create, update, delete notes)
- **useVideoQuiz.ts** - Quiz logic and state management
- **useVideoChapters.ts** - Chapter navigation and tracking

### Utilities

- **types.ts** - TypeScript type definitions
- **utils.ts** - Utility functions (e.g., formatTime)
- **index.ts** - Barrel export for clean imports

## Usage

```tsx
import { EnhancedVideoPlayer } from '@/components/video';

<EnhancedVideoPlayer
  videoUrl="https://example.com/video.mp4"
  contentId="video-123"
  courseId={1}
  title="My Video"
  chapters={[
    { id: '1', title: 'Intro', startTime: 0, endTime: 60 },
    { id: '2', title: 'Main Content', startTime: 60, endTime: 300 },
  ]}
  transcript="Video transcript text..."
  quizzes={[
    {
      id: 'q1',
      timestamp: 120,
      question: 'What is 2+2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1,
    },
  ]}
  onProgressUpdate={progress => console.log('Progress:', progress)}
/>;
```

## Features

- **Video Playback Controls**: Play, pause, seek, volume control, playback speed
- **Chapter Navigation**: Jump to specific chapters with visual markers
- **Notes**: Add timestamped notes while watching
- **Transcript**: View full video transcript
- **Interactive Quizzes**: Pause video at specific timestamps for quizzes
- **Progress Tracking**: Automatically saves progress to Supabase
- **Fullscreen Support**: Native fullscreen functionality
- **Responsive Design**: Works on desktop and mobile

## Backward Compatibility

The original `/components/EnhancedVideoPlayer.tsx` re-exports from this directory, maintaining
backward compatibility with existing imports.
