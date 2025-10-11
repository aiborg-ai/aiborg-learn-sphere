import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VoiceRecorder } from '@/components/media';
import { Mic, Type, Info } from 'lucide-react';

interface VoiceAnswerInputProps {
  onVoiceTranscription: (text: string) => void;
  disabled?: boolean;
  questionText: string;
}

export const VoiceAnswerInput: React.FC<VoiceAnswerInputProps> = ({
  onVoiceTranscription,
  disabled = false,
  questionText,
}) => {
  const [transcribedText, setTranscribedText] = useState<string>('');

  const handleTranscription = (text: string) => {
    setTranscribedText(text);
    onVoiceTranscription(text);
  };

  return (
    <Card className="border-primary/30 bg-primary/5" role="region" aria-label="Voice answer input">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle className="text-base">Voice Answer</CardTitle>
        </div>
        <CardDescription>
          Record your answer using your voice. It will be transcribed automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert role="status" aria-live="polite">
          <Info className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            Speak clearly and explain your answer to the question. Your response will be analyzed
            along with your selected options for a comprehensive assessment.
          </AlertDescription>
        </Alert>

        <VoiceRecorder onTranscription={handleTranscription} disabled={disabled} />

        {transcribedText && (
          <div
            className="space-y-2"
            role="region"
            aria-label="Transcribed answer"
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-medium">Transcribed Answer:</span>
            </div>
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm whitespace-pre-wrap">{transcribedText}</p>
              </CardContent>
            </Card>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Answer recorded successfully
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
