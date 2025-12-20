/**
 * SkillSection Component
 * Groups lessons by skill category
 */

import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LingoLesson, LessonProgress } from '@/types/lingo.types';
import { LessonCard } from './LessonCard';

interface SkillSectionProps {
  skill: string;
  lessons: LingoLesson[];
  progressMap: Record<string, LessonProgress | null>;
  onLessonClick: (lessonId: string) => void;
  className?: string;
}

export function SkillSection({
  skill,
  lessons,
  progressMap,
  onLessonClick,
  className,
}: SkillSectionProps) {
  const completedCount = lessons.filter(l => progressMap[l.id]?.completed).length;

  const getSkillIcon = (skillName: string) => {
    const icons: Record<string, string> = {
      Foundations: '🎯',
      LLMs: '🧠',
      Vision: '👁️',
      NLP: '💬',
      Safety: '🛡️',
      Advanced: '🚀',
    };
    return icons[skillName] || '📚';
  };

  const getSkillDescription = (skillName: string) => {
    const descriptions: Record<string, string> = {
      Foundations: 'Core AI concepts and terminology',
      LLMs: 'Large Language Models and how they work',
      Vision: 'Computer vision and image AI',
      NLP: 'Natural Language Processing',
      Safety: 'AI safety, ethics, and responsible use',
      Advanced: 'Advanced topics and cutting-edge AI',
    };
    return descriptions[skillName] || '';
  };

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getSkillIcon(skill)}</span>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              {skill}
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </h2>
            <p className="text-sm text-muted-foreground">{getSkillDescription(skill)}</p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{completedCount}</span>/{lessons.length}{' '}
          completed
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lessons.map(lesson => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            progress={progressMap[lesson.id]}
            onClick={() => onLessonClick(lesson.lesson_id)}
          />
        ))}
      </div>
    </section>
  );
}
