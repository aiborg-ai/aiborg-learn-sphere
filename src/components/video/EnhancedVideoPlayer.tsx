import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { VideoControls } from './VideoControls';
import { VideoSidebar } from './VideoSidebar';
import { VideoQuiz } from './VideoQuiz';
import { useVideoPlayer } from './useVideoPlayer';
import { useVideoProgress } from './useVideoProgress';
import { useVideoNotes } from './useVideoNotes';
import { useVideoQuiz } from './useVideoQuiz';
import { useVideoChapters } from './useVideoChapters';
import { formatTime } from './utils';
import type { EnhancedVideoPlayerProps } from './types';

export function EnhancedVideoPlayer({
  videoUrl,
  contentId,
  courseId,
  _title,
  chapters = [],
  transcript,
  quizzes = [],
  onProgressUpdate,
}: EnhancedVideoPlayerProps) {
  const [activeTab, setActiveTab] = useState<'chapters' | 'notes' | 'transcript'>('chapters');

  const { user } = useAuth();

  const {
    videoRef,
    containerRef,
    progressBarRef,
    state,
    handlePlayPause,
    handlePause,
    handleSeek,
    handleVolumeChange,
    handleMute,
    handleSpeedChange,
    handleFullscreen,
    skipForward,
    skipBackward,
    handleTimeUpdate,
    handleLoadedMetadata,
    setShowControls,
    setWatchedPercentage,
    setLastSavedProgress,
    setCurrentTime,
  } = useVideoPlayer();

  const {
    notes,
    newNoteText,
    editingNoteId,
    setNewNoteText,
    setEditingNoteId,
    addNote,
    updateNote,
    deleteNote,
  } = useVideoNotes(user, contentId, courseId);

  const { currentChapter, jumpToChapter, jumpToNote } = useVideoChapters(
    chapters,
    state.currentTime,
    videoRef,
    setCurrentTime
  );

  const { currentQuiz, handleQuizAnswer } = useVideoQuiz(
    quizzes,
    state.currentTime,
    state.isPlaying,
    handlePause,
    handlePlayPause
  );

  const { saveProgress } = useVideoProgress({
    user,
    contentId,
    courseId,
    currentTime: state.currentTime,
    duration: state.duration,
    playbackSpeed: state.playbackSpeed,
    currentChapter,
    lastSavedProgress: state.lastSavedProgress,
    videoRef,
    onProgressUpdate,
    setWatchedPercentage,
    setLastSavedProgress,
  });

  return (
    <Card ref={containerRef} className="bg-black relative overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
          {/* Video Container */}
          <div className="lg:col-span-3 relative bg-black">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => {
                handlePause();
                saveProgress();
              }}
            >
              <track kind="captions" srcLang="en" label="English" src="" />
            </video>

            {/* Quiz Overlay */}
            <VideoQuiz quiz={currentQuiz} onAnswerQuiz={handleQuizAnswer} />

            {/* Video Controls */}
            <VideoControls
              isPlaying={state.isPlaying}
              currentTime={state.currentTime}
              duration={state.duration}
              volume={state.volume}
              isMuted={state.isMuted}
              isFullscreen={state.isFullscreen}
              playbackSpeed={state.playbackSpeed}
              showControls={state.showControls}
              currentChapter={currentChapter}
              chapters={chapters}
              progressBarRef={progressBarRef}
              onPlayPause={handlePlayPause}
              onSkipForward={skipForward}
              onSkipBackward={skipBackward}
              onVolumeChange={handleVolumeChange}
              onMute={handleMute}
              onSpeedChange={handleSpeedChange}
              onFullscreen={handleFullscreen}
              onSeek={handleSeek}
              onSetShowControls={setShowControls}
              formatTime={formatTime}
            />
          </div>

          {/* Sidebar */}
          <VideoSidebar
            activeTab={activeTab}
            chapters={chapters}
            currentChapter={currentChapter}
            notes={notes}
            newNoteText={newNoteText}
            editingNoteId={editingNoteId}
            currentTime={state.currentTime}
            transcript={transcript}
            onSetActiveTab={setActiveTab}
            onJumpToChapter={jumpToChapter}
            onNewNoteTextChange={setNewNoteText}
            onAddNote={() => addNote(state.currentTime)}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            onJumpToNote={jumpToNote}
            onSetEditingNoteId={setEditingNoteId}
            formatTime={formatTime}
          />
        </div>
      </CardContent>
    </Card>
  );
}
