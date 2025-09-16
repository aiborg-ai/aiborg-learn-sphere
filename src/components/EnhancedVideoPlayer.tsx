import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Maximize, Minimize, Settings, FileText, BookmarkPlus,
  Clock, ChevronRight, CheckCircle, Edit, Save, X,
  MessageSquare, List
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
}

interface Note {
  id: string;
  timestamp: number;
  text: string;
  createdAt: string;
}

interface Quiz {
  id: string;
  timestamp: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface EnhancedVideoPlayerProps {
  videoUrl: string;
  contentId: string;
  courseId?: number;
  title?: string;
  chapters?: Chapter[];
  transcript?: string;
  quizzes?: Quiz[];
  onProgressUpdate?: (progress: number) => void;
}

export function EnhancedVideoPlayer({
  videoUrl,
  contentId,
  courseId,
  title,
  chapters = [],
  transcript,
  quizzes = [],
  onProgressUpdate
}: EnhancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [activeTab, setActiveTab] = useState<'chapters' | 'notes' | 'transcript'>('chapters');
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [watchedPercentage, setWatchedPercentage] = useState(0);
  const [lastSavedProgress, setLastSavedProgress] = useState(0);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizAnswered, setQuizAnswered] = useState<Set<string>>(new Set());

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadProgress();
    loadNotes();

    const interval = setInterval(() => {
      saveProgress();
    }, 30000); // Save progress every 30 seconds

    return () => {
      clearInterval(interval);
      saveProgress();
    };
  }, []);

  useEffect(() => {
    // Check for quiz at current time
    const quiz = quizzes.find(q =>
      Math.abs(q.timestamp - currentTime) < 1 &&
      !quizAnswered.has(q.id)
    );

    if (quiz && isPlaying) {
      setCurrentQuiz(quiz);
      handlePause();
    }
  }, [currentTime, quizzes, quizAnswered]);

  useEffect(() => {
    // Update current chapter
    const chapter = chapters.find(ch =>
      currentTime >= ch.startTime && currentTime <= ch.endTime
    );
    setCurrentChapter(chapter || null);
  }, [currentTime, chapters]);

  const loadProgress = async () => {
    if (!user || !contentId) return;

    try {
      const { data } = await supabase
        .from('content_views')
        .select('progress_percentage, metadata')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const savedTime = data.metadata?.currentTime || 0;
        if (videoRef.current) {
          videoRef.current.currentTime = savedTime;
        }
        setWatchedPercentage(data.progress_percentage || 0);
        setLastSavedProgress(data.progress_percentage || 0);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveProgress = async () => {
    if (!user || !contentId || !videoRef.current) return;

    const currentProgress = (currentTime / duration) * 100;

    // Only save if progress changed significantly (more than 1%)
    if (Math.abs(currentProgress - lastSavedProgress) < 1) return;

    try {
      await supabase
        .from('content_views')
        .upsert({
          user_id: user.id,
          content_id: contentId,
          content_type: 'video',
          course_id: courseId,
          progress_percentage: currentProgress,
          duration_seconds: Math.floor(currentTime),
          completion_status: currentProgress >= 95 ? 'completed' : 'in_progress',
          metadata: {
            currentTime,
            duration,
            playbackSpeed,
            lastChapter: currentChapter?.id
          }
        }, {
          onConflict: 'user_id,content_id,content_type'
        });

      setLastSavedProgress(currentProgress);

      // Update user progress if part of a course
      if (courseId) {
        await supabase
          .from('user_progress')
          .upsert({
            user_id: user.id,
            course_id: courseId,
            progress_percentage: currentProgress,
            time_spent_minutes: Math.floor(currentTime / 60),
            current_position: JSON.stringify({ videoId: contentId, timestamp: currentTime })
          }, {
            onConflict: 'user_id,course_id'
          });
      }

      // Trigger callback if provided
      if (onProgressUpdate) {
        onProgressUpdate(currentProgress);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const loadNotes = async () => {
    if (!user || !contentId) return;

    try {
      const { data } = await supabase
        .from('shared_content')
        .select('*')
        .eq('owner_id', user.id)
        .eq('content_type', 'note')
        .eq('content_data->>video_id', contentId)
        .order('content_data->>timestamp', { ascending: true });

      if (data) {
        setNotes(data.map(d => ({
          id: d.id,
          timestamp: d.content_data.timestamp,
          text: d.content_data.text,
          createdAt: d.created_at
        })));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const newTime = (value[0] / 100) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
    }
  };

  const jumpToChapter = (chapter: Chapter) => {
    if (videoRef.current) {
      videoRef.current.currentTime = chapter.startTime;
      setCurrentTime(chapter.startTime);
    }
  };

  const addNote = async () => {
    if (!user || !contentId || !newNoteText.trim()) return;

    try {
      const { data, error } = await supabase
        .from('shared_content')
        .insert({
          owner_id: user.id,
          content_type: 'note',
          title: `Note at ${formatTime(currentTime)}`,
          description: newNoteText,
          content_data: {
            video_id: contentId,
            timestamp: currentTime,
            text: newNoteText
          },
          visibility: 'private',
          course_id: courseId
        })
        .select()
        .single();

      if (error) throw error;

      const newNote: Note = {
        id: data.id,
        timestamp: currentTime,
        text: newNoteText,
        createdAt: data.created_at
      };

      setNotes(prev => [...prev, newNote].sort((a, b) => a.timestamp - b.timestamp));
      setNewNoteText('');

      toast({
        title: 'Note Added',
        description: 'Your note has been saved'
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to save note',
        variant: 'destructive'
      });
    }
  };

  const updateNote = async (noteId: string, newText: string) => {
    try {
      await supabase
        .from('shared_content')
        .update({
          description: newText,
          content_data: {
            video_id: contentId,
            timestamp: notes.find(n => n.id === noteId)?.timestamp,
            text: newText
          }
        })
        .eq('id', noteId);

      setNotes(prev => prev.map(n =>
        n.id === noteId ? { ...n, text: newText } : n
      ));

      setEditingNoteId(null);

      toast({
        title: 'Note Updated',
        description: 'Your note has been updated'
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note',
        variant: 'destructive'
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await supabase
        .from('shared_content')
        .delete()
        .eq('id', noteId);

      setNotes(prev => prev.filter(n => n.id !== noteId));

      toast({
        title: 'Note Deleted',
        description: 'Your note has been removed'
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive'
      });
    }
  };

  const jumpToNote = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
  };

  const handleQuizAnswer = (answerIndex: number) => {
    if (!currentQuiz) return;

    const isCorrect = answerIndex === currentQuiz.correctAnswer;

    toast({
      title: isCorrect ? 'Correct!' : 'Incorrect',
      description: isCorrect
        ? 'Great job! Continue watching.'
        : 'Try again next time. Keep learning!',
      variant: isCorrect ? 'default' : 'destructive'
    });

    setQuizAnswered(prev => new Set(prev).add(currentQuiz.id));
    setCurrentQuiz(null);

    // Resume playing after answering
    handlePlayPause();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setWatchedPercentage(Math.max(watchedPercentage, progress));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

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
                setIsPlaying(false);
                saveProgress();
              }}
            />

            {/* Quiz Overlay */}
            {currentQuiz && (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
                <Card className="bg-gray-900 border-gray-700 p-6 max-w-md">
                  <h3 className="text-white text-lg font-medium mb-4">
                    Quick Quiz
                  </h3>
                  <p className="text-white/80 mb-4">{currentQuiz.question}</p>
                  <div className="space-y-2">
                    {currentQuiz.options.map((option, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="w-full justify-start text-white hover:bg-white/10"
                        onClick={() => handleQuizAnswer(idx)}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Video Controls */}
            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
            >
              {/* Progress Bar */}
              <div
                ref={progressBarRef}
                className="relative h-1 bg-white/20 rounded-full mb-4 cursor-pointer"
                onClick={(e) => {
                  const rect = progressBarRef.current?.getBoundingClientRect();
                  if (rect) {
                    const x = e.clientX - rect.left;
                    const percentage = (x / rect.width) * 100;
                    handleSeek([percentage]);
                  }
                }}
              >
                <div
                  className="absolute h-full bg-primary rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                {/* Chapter Markers */}
                {chapters.map(chapter => (
                  <div
                    key={chapter.id}
                    className="absolute top-0 w-1 h-full bg-white/50"
                    style={{ left: `${(chapter.startTime / duration) * 100}%` }}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePlayPause}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={skipBackward}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={skipForward}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume * 100]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      className="w-24"
                    />
                  </div>

                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>

                  {currentChapter && (
                    <Badge variant="secondary" className="text-xs">
                      {currentChapter.title}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Speed Control */}
                  <select
                    value={playbackSpeed}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    className="bg-white/10 text-white text-sm px-2 py-1 rounded border border-white/20"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1">1x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                  </select>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 bg-gray-900 border-l border-gray-800">
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <Button
                  size="sm"
                  variant={activeTab === 'chapters' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('chapters')}
                  className="flex-1"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === 'notes' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('notes')}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === 'transcript' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('transcript')}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                {/* Chapters Tab */}
                {activeTab === 'chapters' && (
                  <div className="space-y-2">
                    <h3 className="text-white font-medium mb-3">Chapters</h3>
                    {chapters.length > 0 ? (
                      chapters.map((chapter) => (
                        <button
                          key={chapter.id}
                          onClick={() => jumpToChapter(chapter)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            currentChapter?.id === chapter.id
                              ? 'bg-primary/20 text-primary'
                              : 'hover:bg-white/10 text-white/80'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{chapter.title}</span>
                            <span className="text-xs opacity-60">
                              {formatTime(chapter.startTime)}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-white/60 text-sm">No chapters available</p>
                    )}
                  </div>
                )}

                {/* Notes Tab */}
                {activeTab === 'notes' && (
                  <div className="space-y-3">
                    <h3 className="text-white font-medium mb-3">Notes</h3>

                    {/* Add Note */}
                    <div className="space-y-2">
                      <Textarea
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Add a note at current time..."
                        className="bg-gray-800 border-gray-700 text-white text-sm"
                        rows={3}
                      />
                      <Button
                        size="sm"
                        onClick={addNote}
                        disabled={!newNoteText.trim()}
                        className="w-full"
                      >
                        <BookmarkPlus className="h-4 w-4 mr-2" />
                        Add Note at {formatTime(currentTime)}
                      </Button>
                    </div>

                    {/* Notes List */}
                    <div className="space-y-2">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-gray-800 p-3 rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => jumpToNote(note.timestamp)}
                              className="text-primary text-sm hover:underline"
                            >
                              {formatTime(note.timestamp)}
                            </button>
                            <div className="flex gap-1">
                              {editingNoteId === note.id ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const textarea = document.querySelector(`#note-${note.id}`) as HTMLTextAreaElement;
                                      updateNote(note.id, textarea.value);
                                    }}
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingNoteId(null)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingNoteId(note.id)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteNote(note.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          {editingNoteId === note.id ? (
                            <Textarea
                              id={`note-${note.id}`}
                              defaultValue={note.text}
                              className="bg-gray-700 border-gray-600 text-white text-sm"
                              rows={2}
                            />
                          ) : (
                            <p className="text-white/80 text-sm">{note.text}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transcript Tab */}
                {activeTab === 'transcript' && (
                  <div className="space-y-3">
                    <h3 className="text-white font-medium mb-3">Transcript</h3>
                    {transcript ? (
                      <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                        {transcript}
                      </p>
                    ) : (
                      <p className="text-white/60 text-sm">No transcript available</p>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}