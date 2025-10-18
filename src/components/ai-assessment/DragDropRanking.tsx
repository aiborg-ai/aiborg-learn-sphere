import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GripVertical, ArrowUp, ArrowDown, RotateCcw, Info } from 'lucide-react';

export interface DragDropRankingProps {
  question: {
    id: string;
    question_text: string;
    question_type: 'drag_drop_ranking' | 'drag_drop_ordering';
    help_text?: string;
    metadata?: {
      instruction?: string;
      ranking_criteria?: string;
    };
    options: Array<{
      id: string;
      option_text: string;
      description?: string;
      option_image_url?: string;
      correct_position?: number;
      order_index: number;
    }>;
  };
  selectedOrdering: string[];
  onOrderingChange: (optionIds: string[]) => void;
}

export const DragDropRanking: React.FC<DragDropRankingProps> = ({
  question,
  selectedOrdering,
  onOrderingChange,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Initialize ordering if not set
  React.useEffect(() => {
    if (selectedOrdering.length === 0) {
      const initialOrder = question.options
        .sort((a, b) => a.order_index - b.order_index)
        .map(opt => opt.id);
      onOrderingChange(initialOrder);
    }
  }, [question.options, selectedOrdering.length, onOrderingChange]);

  const currentOrdering =
    selectedOrdering.length > 0 ? selectedOrdering : question.options.map(opt => opt.id);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setHoveredIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setHoveredIndex(null);
      return;
    }

    const newOrdering = [...currentOrdering];
    const draggedItem = newOrdering[draggedIndex];
    newOrdering.splice(draggedIndex, 1);
    newOrdering.splice(dropIndex, 0, draggedItem);

    onOrderingChange(newOrdering);
    setDraggedIndex(null);
    setHoveredIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setHoveredIndex(null);
  };

  const moveItem = (fromIndex: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && fromIndex === 0) ||
      (direction === 'down' && fromIndex === currentOrdering.length - 1)
    ) {
      return;
    }

    const newOrdering = [...currentOrdering];
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    [newOrdering[fromIndex], newOrdering[toIndex]] = [newOrdering[toIndex], newOrdering[fromIndex]];

    onOrderingChange(newOrdering);
  };

  const resetOrder = () => {
    const initialOrder = question.options
      .sort((a, b) => a.order_index - b.order_index)
      .map(opt => opt.id);
    onOrderingChange(initialOrder);
  };

  const getOptionData = (optionId: string) => {
    return question.options.find(opt => opt.id === optionId);
  };

  const getRankingLabel = (index: number) => {
    if (question.question_type === 'drag_drop_ranking') {
      return `Rank ${index + 1}`;
    }
    return `Step ${index + 1}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{question.question_text}</CardTitle>
          {question.help_text && (
            <CardDescription className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{question.help_text}</span>
            </CardDescription>
          )}
          {question.metadata?.instruction && (
            <div className="p-3 bg-primary/5 rounded-lg mt-2">
              <p className="text-sm font-medium">
                {question.question_type === 'drag_drop_ranking'
                  ? '📊 Rank from highest to lowest'
                  : '🔢 Arrange in correct order'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{question.metadata.instruction}</p>
            </div>
          )}
          {question.metadata?.ranking_criteria && (
            <Badge variant="outline" className="mt-2 w-fit">
              Criteria: {question.metadata.ranking_criteria}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Drag items to reorder, or use arrow buttons
            </p>
            <Button variant="ghost" size="sm" onClick={resetOrder}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          <div className="space-y-2">
            {currentOrdering.map((optionId, index) => {
              const option = getOptionData(optionId);
              if (!option) return null;

              const isDragging = draggedIndex === index;
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={optionId}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDrop={e => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' && index > 0) {
                      e.preventDefault();
                      moveItem(index, 'up');
                    } else if (e.key === 'ArrowDown' && index < currentOrdering.length - 1) {
                      e.preventDefault();
                      moveItem(index, 'down');
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Rank ${index + 1}: ${option?.option_text}`}
                  className={`
                    group flex items-center gap-3 p-4 rounded-lg border-2
                    transition-all duration-200 cursor-move
                    ${isDragging ? 'opacity-50 scale-95' : ''}
                    ${isHovered ? 'border-primary bg-primary/10' : 'border-muted'}
                    ${!isDragging && !isHovered ? 'hover:border-primary/50 hover:shadow-md' : ''}
                  `}
                >
                  {/* Drag Handle */}
                  <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  {/* Rank/Position Badge */}
                  <div className="flex-shrink-0">
                    <Badge
                      variant={isDragging ? 'secondary' : 'default'}
                      className="min-w-[4rem] justify-center text-center"
                    >
                      {getRankingLabel(index)}
                    </Badge>
                  </div>

                  {/* Option Content */}
                  <div className="flex-1 space-y-1">
                    {option.option_image_url && (
                      <div className="mb-2">
                        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                        <img
                          src={option.option_image_url}
                          alt={option.option_text}
                          className="h-16 w-16 object-cover rounded border"
                          onError={e => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <p className="font-medium">{option.option_text}</p>
                    {option.description && (
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    )}
                  </div>

                  {/* Arrow Controls */}
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === currentOrdering.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium mb-2">Your Current Order:</p>
            <ol className="text-sm space-y-1">
              {currentOrdering.map((optionId, index) => {
                const option = getOptionData(optionId);
                return (
                  <li key={optionId} className="flex items-center gap-2">
                    <Badge variant="outline" className="w-12 justify-center">
                      {index + 1}
                    </Badge>
                    <span className="truncate">{option?.option_text}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
