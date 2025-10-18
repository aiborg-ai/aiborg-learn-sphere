import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Image as ImageIcon,
  Video,
  FileText,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Info,
  Lightbulb
} from 'lucide-react';

export interface ScenarioQuestionProps {
  question: {
    id: string;
    question_text: string;
    question_type: 'scenario_multimedia' | 'single_choice' | 'multiple_choice';
    scenario_context?: string;
    media_type?: 'image' | 'video' | 'audio' | 'document';
    media_url?: string;
    media_caption?: string;
    metadata?: {
      time_limit_seconds?: number;
      hints?: string[];
      explanation?: string;
      show_context_initially?: boolean;
    };
    options: Array<{
      id: string;
      option_text: string;
      option_value: string;
      description?: string;
      order_index: number;
    }>;
  };
  selectedOptions: string[];
  onSelectionChange: (optionIds: string[]) => void;
  showHints?: boolean;
}

export const ScenarioQuestion: React.FC<ScenarioQuestionProps> = ({
  question,
  selectedOptions,
  onSelectionChange,
  showHints = false,
}) => {
  const [showContext, setShowContext] = useState(
    question.metadata?.show_context_initially !== false
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHintIndex, setShowHintIndex] = useState(-1);

  const handleSingleChoice = (optionId: string) => {
    onSelectionChange([optionId]);
  };

  const handleMultipleChoice = (optionId: string) => {
    const newSelection = selectedOptions.includes(optionId)
      ? selectedOptions.filter(id => id !== optionId)
      : [...selectedOptions, optionId];
    onSelectionChange(newSelection);
  };

  const renderMedia = () => {
    if (!question.media_type || !question.media_url) return null;

    switch (question.media_type) {
      case 'image':
        return (
          <div className="space-y-2">
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
              {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
              <img
                src={question.media_url}
                alt={question.media_caption || 'Scenario image'}
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.png';
                }}
              />
            </AspectRatio>
            {question.media_caption && (
              <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                <ImageIcon className="h-3 w-3" />
                {question.media_caption}
              </p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-2">
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
              <video
                src={question.media_url}
                controls
                className="w-full h-full"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                muted={isMuted}
              >
                <track
                  kind="captions"
                  srcLang="en"
                  label="English"
                  src=""
                />
                Your browser does not support the video tag.
              </video>
            </AspectRatio>
            {question.media_caption && (
              <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <Video className="h-3 w-3" />
                {question.media_caption}
              </p>
            )}
          </div>
        );

      case 'audio':
        return (
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const audio = document.getElementById(
                      `audio-${question.id}`
                    ) as HTMLAudioElement;
                    if (isPlaying) {
                      audio?.pause();
                    } else {
                      audio?.play();
                    }
                  }}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <audio
                  id={`audio-${question.id}`}
                  src={question.media_url}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  muted={isMuted}
                  className="flex-1"
                >
                  <track
                    kind="captions"
                    srcLang="en"
                    label="English"
                    src=""
                  />
                  Your browser does not support the audio tag.
                </audio>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
              {question.media_caption && (
                <p className="text-sm text-muted-foreground mt-2">{question.media_caption}</p>
              )}
            </CardContent>
          </Card>
        );

      case 'document':
        return (
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">Reference Document</p>
                  {question.media_caption && (
                    <p className="text-sm text-muted-foreground">{question.media_caption}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={question.media_url} target="_blank" rel="noopener noreferrer">
                    Open
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const hints = question.metadata?.hints || [];

  return (
    <div className="space-y-6">
      {/* Scenario Context */}
      {question.scenario_context && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                Scenario
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContext(!showContext)}
              >
                {showContext ? 'Hide' : 'Show'} Context
              </Button>
            </div>
          </CardHeader>
          {showContext && (
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{question.scenario_context}</p>
            </CardContent>
          )}
        </Card>
      )}

      {/* Media Content */}
      {renderMedia()}

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{question.question_text}</CardTitle>
          {question.metadata?.time_limit_seconds && (
            <CardDescription className="flex items-center gap-2">
              <Badge variant="outline">
                Time Limit: {Math.floor(question.metadata.time_limit_seconds / 60)} min
              </Badge>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Answer Options */}
          {question.question_type === 'single_choice' ||
          question.question_type === 'scenario_multimedia' ? (
            <RadioGroup
              value={selectedOptions[0] || ''}
              onValueChange={handleSingleChoice}
              className="space-y-3"
            >
              {question.options
                .sort((a, b) => a.order_index - b.order_index)
                .map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors ${
                      selectedOptions.includes(option.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={option.id} id={option.id} className="mt-0.5" />
                    <Label
                      htmlFor={option.id}
                      className="flex-1 cursor-pointer space-y-1 leading-relaxed"
                    >
                      <span className="font-medium">{option.option_text}</span>
                      {option.description && (
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      )}
                    </Label>
                  </div>
                ))}
            </RadioGroup>
          ) : (
            <div className="space-y-3">
              {question.options
                .sort((a, b) => a.order_index - b.order_index)
                .map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors ${
                      selectedOptions.includes(option.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <Checkbox
                      id={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={() => handleMultipleChoice(option.id)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor={option.id}
                      className="flex-1 cursor-pointer space-y-1 leading-relaxed"
                    >
                      <span className="font-medium">{option.option_text}</span>
                      {option.description && (
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      )}
                    </Label>
                  </div>
                ))}
            </div>
          )}

          {/* Hints */}
          {showHints && hints.length > 0 && (
            <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Hints Available</p>
                  {hints.map((hint, index) => (
                    <div key={index}>
                      {showHintIndex >= index ? (
                        <p className="text-sm">{hint}</p>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowHintIndex(index)}
                          className="h-auto p-0 text-yellow-700 hover:text-yellow-800"
                        >
                          Show Hint {index + 1}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
