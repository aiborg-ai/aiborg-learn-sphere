import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { List, Edit, FileText } from '@/components/ui/icons';
import { VideoChapters } from './VideoChapters';
import { VideoNotes } from './VideoNotes';
import { VideoTranscript } from './VideoTranscript';
import type { Chapter, Note } from './types';

interface VideoSidebarProps {
  activeTab: 'chapters' | 'notes' | 'transcript';
  chapters: Chapter[];
  currentChapter: Chapter | null;
  notes: Note[];
  newNoteText: string;
  editingNoteId: string | null;
  currentTime: number;
  transcript?: string;
  onSetActiveTab: (tab: 'chapters' | 'notes' | 'transcript') => void;
  onJumpToChapter: (chapter: Chapter) => void;
  onNewNoteTextChange: (text: string) => void;
  onAddNote: () => void;
  onUpdateNote: (noteId: string, newText: string) => void;
  onDeleteNote: (noteId: string) => void;
  onJumpToNote: (timestamp: number) => void;
  onSetEditingNoteId: (id: string | null) => void;
  formatTime: (seconds: number) => string;
}

export function VideoSidebar({
  activeTab,
  chapters,
  currentChapter,
  notes,
  newNoteText,
  editingNoteId,
  currentTime,
  transcript,
  onSetActiveTab,
  onJumpToChapter,
  onNewNoteTextChange,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onJumpToNote,
  onSetEditingNoteId,
  formatTime,
}: VideoSidebarProps) {
  return (
    <div className="lg:col-span-1 bg-gray-900 border-l border-gray-800">
      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant={activeTab === 'chapters' ? 'default' : 'ghost'}
            onClick={() => onSetActiveTab('chapters')}
            className="flex-1"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'notes' ? 'default' : 'ghost'}
            onClick={() => onSetActiveTab('notes')}
            className="flex-1"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'transcript' ? 'default' : 'ghost'}
            onClick={() => onSetActiveTab('transcript')}
            className="flex-1"
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          {activeTab === 'chapters' && (
            <VideoChapters
              chapters={chapters}
              currentChapter={currentChapter}
              onJumpToChapter={onJumpToChapter}
              formatTime={formatTime}
            />
          )}

          {activeTab === 'notes' && (
            <VideoNotes
              notes={notes}
              newNoteText={newNoteText}
              editingNoteId={editingNoteId}
              currentTime={currentTime}
              onNewNoteTextChange={onNewNoteTextChange}
              onAddNote={onAddNote}
              onUpdateNote={onUpdateNote}
              onDeleteNote={onDeleteNote}
              onJumpToNote={onJumpToNote}
              onSetEditingNoteId={onSetEditingNoteId}
              formatTime={formatTime}
            />
          )}

          {activeTab === 'transcript' && <VideoTranscript transcript={transcript} />}
        </ScrollArea>
      </div>
    </div>
  );
}
