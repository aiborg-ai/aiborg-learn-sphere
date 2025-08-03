import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Video, Square, Play, Pause, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VideoRecorderProps {
  onTranscription: (text: string) => void;
  onRecording?: (blob: Blob | null) => void;
  disabled?: boolean;
}

export function VideoRecorder({ onTranscription, onRecording, disabled = false }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        },
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.play();
      }

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        onRecording?.(blob);
        stream.getTracks().forEach(track => track.stop());
        if (previewRef.current) {
          previewRef.current.srcObject = null;
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Recording video review. Maximum 2 minutes.",
      });

      // Stop recording after 2 minutes
      setTimeout(() => {
        if (mediaRecorderRef.current && isRecording) {
          stopRecording();
        }
      }, 120000);

    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Could not access camera/microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playVideo = () => {
    if (videoBlob && videoRef.current) {
      const videoUrl = URL.createObjectURL(videoBlob);
      videoRef.current.src = videoUrl;
      
      videoRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(videoUrl);
      };
      
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    setVideoBlob(null);
    onRecording?.(null);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
  };

  const transcribeVideo = async () => {
    if (!videoBlob) return;

    try {
      setIsTranscribing(true);
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Video = reader.result?.toString().split(',')[1];
        
        if (base64Video) {
          const { data, error } = await supabase.functions.invoke('transcribe-video', {
            body: { video: base64Video }
          });

          if (error) {
            throw new Error(error.message);
          }

          if (data?.text) {
            onTranscription(data.text);
            toast({
              title: "Transcription Complete",
              description: "Your video audio has been converted to text.",
            });
          }
        }
      };
      
      reader.readAsDataURL(videoBlob);
      
    } catch (error) {
      toast({
        title: "Transcription Failed",
        description: error instanceof Error ? error.message : "Failed to transcribe video audio",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
      {/* Video Preview/Playback */}
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
        {isRecording && (
          <video
            ref={previewRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
        )}
        
        {videoBlob && !isRecording && (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            controls={false}
            playsInline
          />
        )}
        
        {!isRecording && !videoBlob && (
          <div className="w-full h-full flex items-center justify-center text-white">
            <Video className="h-12 w-12 opacity-50" />
          </div>
        )}

        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            REC
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!isRecording && !videoBlob && (
          <Button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            variant="outline"
            size="sm"
          >
            <Video className="h-4 w-4 mr-2" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <Button
            type="button"
            onClick={stopRecording}
            variant="destructive"
            size="sm"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Recording
          </Button>
        )}

        {videoBlob && !isRecording && (
          <>
            <Button
              type="button"
              onClick={isPlaying ? pauseVideo : playVideo}
              variant="outline"
              size="sm"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>

            <Button
              type="button"
              onClick={transcribeVideo}
              disabled={isTranscribing}
              size="sm"
            >
              {isTranscribing ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                  Transcribing...
                </>
              ) : (
                'Transcribe'
              )}
            </Button>

            <Button
              type="button"
              onClick={deleteRecording}
              variant="outline"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </>
        )}
      </div>

      {isRecording && (
        <p className="text-sm text-muted-foreground">
          Recording video review... (Max 2 minutes)
        </p>
      )}

      {videoBlob && !isRecording && (
        <p className="text-sm text-muted-foreground">
          Video ready. Click transcribe to convert audio to text.
        </p>
      )}
    </div>
  );
}