import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { Quiz } from './types';

export function useVideoQuiz(
  quizzes: Quiz[],
  currentTime: number,
  isPlaying: boolean,
  handlePause: () => void,
  handlePlayPause: () => void
) {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizAnswered, setQuizAnswered] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    // Check for quiz at current time
    const quiz = quizzes.find(
      q => Math.abs(q.timestamp - currentTime) < 1 && !quizAnswered.has(q.id)
    );

    if (quiz && isPlaying) {
      setCurrentQuiz(quiz);
      handlePause();
    }
  }, [currentTime, quizzes, quizAnswered, isPlaying, handlePause]);

  const handleQuizAnswer = (answerIndex: number) => {
    if (!currentQuiz) return;

    const isCorrect = answerIndex === currentQuiz.correctAnswer;

    toast({
      title: isCorrect ? 'Correct!' : 'Incorrect',
      description: isCorrect
        ? 'Great job! Continue watching.'
        : 'Try again next time. Keep learning!',
      variant: isCorrect ? 'default' : 'destructive',
    });

    setQuizAnswered(prev => new Set(prev).add(currentQuiz.id));
    setCurrentQuiz(null);

    // Resume playing after answering
    handlePlayPause();
  };

  return {
    currentQuiz,
    handleQuizAnswer,
  };
}
