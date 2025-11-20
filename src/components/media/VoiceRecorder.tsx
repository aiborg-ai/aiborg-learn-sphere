import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Trash2 } from '@/components/ui/icons';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onRecording?: (blob: Blob | null) => void;
  disabled?: boolean;
}

export function VoiceRecorder({
  onTranscription,
  onRecording,
  disabled = false,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = event => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        onRecording?.(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      toast({
        title: 'Recording Started',
        description: 'Speak clearly into your microphone. Maximum 2 minutes.',
      });

      // Stop recording after 2 minutes
      setTimeout(() => {
        if (mediaRecorderRef.current && isRecording) {
          stopRecording();
        }
      }, 120000);
    } catch {
      toast({
        title: 'Recording Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);

      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    onRecording?.(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    try {
      setIsTranscribing(true);

      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];

        if (base64Audio) {
          const { data, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { audio: base64Audio },
          });

          if (error) {
            throw new Error(error.message);
          }

          if (data?.text) {
            onTranscription(data.text);
            toast({
              title: 'Transcription Complete',
              description: 'Your voice has been converted to text.',
            });
          }
        }
      };

      reader.readAsDataURL(audioBlob);
    } catch {
      toast({
        title: 'Transcription Failed',
        description: error instanceof Error ? error.message : 'Failed to transcribe audio',
        variant: 'destructive',
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center gap-2">
        {!isRecording && !audioBlob && (
          <Button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            variant="outline"
            size="sm"
          >
            <Mic className="h-4 w-4 mr-2" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <Button type="button" onClick={stopRecording} variant="destructive" size="sm">
            <Square className="h-4 w-4 mr-2" />
            Stop Recording
          </Button>
        )}

        {audioBlob && !isRecording && (
          <>
            <Button
              type="button"
              onClick={isPlaying ? pauseAudio : playAudio}
              variant="outline"
              size="sm"
            >
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>

            <Button type="button" onClick={transcribeAudio} disabled={isTranscribing} size="sm">
              {isTranscribing ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                  Transcribing...
                </>
              ) : (
                'Transcribe'
              )}
            </Button>

            <Button type="button" onClick={deleteRecording} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </>
        )}
      </div>

      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          Recording... (Max 2 minutes)
        </div>
      )}

      {audioBlob && !isRecording && (
        <p className="text-sm text-muted-foreground">
          Recording ready. Click transcribe to convert to text.
        </p>
      )}
    </div>
  );
}
