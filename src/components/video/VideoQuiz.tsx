import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Quiz } from './types';

interface VideoQuizProps {
  quiz: Quiz | null;
  onAnswerQuiz: (answerIndex: number) => void;
}

export function VideoQuiz({ quiz, onAnswerQuiz }: VideoQuizProps) {
  if (!quiz) return null;

  return (
    <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
      <Card className="bg-gray-900 border-gray-700 p-6 max-w-md">
        <h3 className="text-white text-lg font-medium mb-4">Quick Quiz</h3>
        <p className="text-white/80 mb-4">{quiz.question}</p>
        <div className="space-y-2">
          {quiz.options.map((option, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="w-full justify-start text-white hover:bg-white/10"
              onClick={() => onAnswerQuiz(idx)}
            >
              {option}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
