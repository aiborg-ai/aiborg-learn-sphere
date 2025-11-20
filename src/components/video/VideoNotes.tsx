import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookmarkPlus, Edit, Save, X } from '@/components/ui/icons';
import type { Note } from './types';

interface VideoNotesProps {
  notes: Note[];
  newNoteText: string;
  editingNoteId: string | null;
  currentTime: number;
  onNewNoteTextChange: (text: string) => void;
  onAddNote: () => void;
  onUpdateNote: (noteId: string, newText: string) => void;
  onDeleteNote: (noteId: string) => void;
  onJumpToNote: (timestamp: number) => void;
  onSetEditingNoteId: (id: string | null) => void;
  formatTime: (seconds: number) => string;
}

export function VideoNotes({
  notes,
  newNoteText,
  editingNoteId,
  currentTime,
  onNewNoteTextChange,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onJumpToNote,
  onSetEditingNoteId,
  formatTime,
}: VideoNotesProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-white font-medium mb-3">Notes</h3>

      {/* Add Note */}
      <div className="space-y-2">
        <Textarea
          value={newNoteText}
          onChange={e => onNewNoteTextChange(e.target.value)}
          placeholder="Add a note at current time..."
          className="bg-gray-800 border-gray-700 text-white text-sm"
          rows={3}
        />
        <Button size="sm" onClick={onAddNote} disabled={!newNoteText.trim()} className="w-full">
          <BookmarkPlus className="h-4 w-4 mr-2" />
          Add Note at {formatTime(currentTime)}
        </Button>
      </div>

      {/* Notes List */}
      <div className="space-y-2">
        {notes.map(note => (
          <div key={note.id} className="bg-gray-800 p-3 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => onJumpToNote(note.timestamp)}
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
                        const textarea = document.querySelector(
                          `#note-${note.id}`
                        ) as HTMLTextAreaElement;
                        onUpdateNote(note.id, textarea.value);
                      }}
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onSetEditingNoteId(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => onSetEditingNoteId(note.id)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDeleteNote(note.id)}>
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
  );
}
