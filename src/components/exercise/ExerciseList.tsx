/**
 * ExerciseList Component
 * Displays list of exercises with filtering and sorting
 */

import { useState, useMemo } from 'react';
import { ExerciseCard } from './ExerciseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import type {
  ExerciseWithSubmission,
  ExerciseType,
  DifficultyLevel,
} from '@/services/exercise/types';

interface ExerciseListProps {
  exercises: ExerciseWithSubmission[];
  onExerciseClick: (exercise: ExerciseWithSubmission) => void;
  isLoading?: boolean;
}

type FilterStatus = 'all' | 'not_started' | 'in_progress' | 'completed' | 'needs_revision';

export const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises,
  onExerciseClick,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState<ExerciseType | 'all'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'difficulty' | 'points' | 'date'>('date');

  // Filter and sort exercises
  const filteredExercises = useMemo(() => {
    let filtered = [...exercises];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        ex => ex.title.toLowerCase().includes(query) || ex.description.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(ex => {
        if (filterStatus === 'not_started') return !ex.user_submission;
        if (filterStatus === 'in_progress') return ex.user_submission?.status === 'draft';
        if (filterStatus === 'completed')
          return (
            ex.user_submission?.status === 'passed' || ex.user_submission?.status === 'completed'
          );
        if (filterStatus === 'needs_revision')
          return ex.user_submission?.status === 'needs_revision';
        return true;
      });
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(ex => ex.exercise_type === filterType);
    }

    // Difficulty filter
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(ex => ex.difficulty_level === filterDifficulty);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'difficulty': {
          const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
          return difficultyOrder[a.difficulty_level] - difficultyOrder[b.difficulty_level];
        }
        case 'points':
          return b.points_reward - a.points_reward;
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [exercises, searchQuery, filterStatus, filterType, filterDifficulty, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = exercises.length;
    const completed = exercises.filter(
      ex => ex.user_submission?.status === 'passed' || ex.user_submission?.status === 'completed'
    ).length;
    const inProgress = exercises.filter(ex => ex.user_submission?.status === 'draft').length;
    const needsRevision = exercises.filter(
      ex => ex.user_submission?.status === 'needs_revision'
    ).length;

    return { total, completed, inProgress, needsRevision };
  }, [exercises]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No exercises available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Needs Revision</p>
          <p className="text-2xl font-bold text-orange-600">{stats.needsRevision}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="space-y-4">
        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Newest First</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="difficulty">Difficulty</SelectItem>
              <SelectItem value="points">Points</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Tabs */}
        <Tabs value={filterStatus} onValueChange={v => setFilterStatus(v as FilterStatus)}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="not_started">Not Started</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="needs_revision">Needs Revision</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Advanced Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={filterType} onValueChange={v => setFilterType(v as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="coding">Coding</SelectItem>
              <SelectItem value="writing">Writing</SelectItem>
              <SelectItem value="analysis">Analysis</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="research">Research</SelectItem>
              <SelectItem value="project">Project</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterDifficulty} onValueChange={v => setFilterDifficulty(v as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>

          {(filterType !== 'all' || filterDifficulty !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterType('all');
                setFilterDifficulty('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Exercise Grid */}
      {filteredExercises.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No exercises match your filters.</p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('all');
              setFilterType('all');
              setFilterDifficulty('all');
            }}
          >
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map(exercise => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onClick={() => onExerciseClick(exercise)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
