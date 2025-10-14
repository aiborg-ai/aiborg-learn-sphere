import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/utils/iconLoader';

interface SwipeAction {
  icon: string;
  label: string;
  color: 'destructive' | 'primary' | 'secondary' | 'success';
  onAction: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  className?: string;
  disabled?: boolean;
}

const colorClasses = {
  destructive: 'bg-destructive text-destructive-foreground',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-green-500 text-white',
};

export function SwipeableCard({
  children,
  leftAction,
  rightAction,
  className,
  disabled = false,
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const swipeThreshold = 80; // pixels to show action
  const actionThreshold = 120; // pixels to trigger action

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;

    // Limit swipe distance
    const maxSwipe = 150;
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));

    // Only allow swipe if action exists for that direction
    if (limitedDiff > 0 && !rightAction) return;
    if (limitedDiff < 0 && !leftAction) return;

    setTranslateX(limitedDiff);
  };

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return;
    setIsDragging(false);

    // Trigger action if threshold exceeded
    if (Math.abs(translateX) > actionThreshold) {
      if (translateX > 0 && rightAction) {
        rightAction.onAction();
      } else if (translateX < 0 && leftAction) {
        leftAction.onAction();
      }
    }

    // Reset position
    setTranslateX(0);
    setStartX(0);
  };

  const showLeftAction = translateX < -swipeThreshold && leftAction;
  const showRightAction = translateX > swipeThreshold && rightAction;

  return (
    <div className={cn('swipeable relative overflow-hidden', className)}>
      {/* Left Action */}
      {leftAction && (
        <div
          className={cn(
            'swipe-indicator left',
            'flex items-center gap-2 px-4',
            colorClasses[leftAction.color],
            showLeftAction && 'visible'
          )}
        >
          <Icon name={leftAction.icon} size={20} />
          <span className="font-medium text-sm">{leftAction.label}</span>
        </div>
      )}

      {/* Right Action */}
      {rightAction && (
        <div
          className={cn(
            'swipe-indicator right',
            'flex items-center gap-2 px-4',
            colorClasses[rightAction.color],
            showRightAction && 'visible'
          )}
        >
          <span className="font-medium text-sm">{rightAction.label}</span>
          <Icon name={rightAction.icon} size={20} />
        </div>
      )}

      {/* Card Content */}
      <div
        ref={cardRef}
        className={cn('relative bg-card', isDragging && 'cursor-grabbing')}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

// Example usage component
export function SwipeableCardExample() {
  const handleDelete = () => {
    // Delete action handler
  };

  const handleArchive = () => {
    // Archive action handler
  };

  return (
    <SwipeableCard
      leftAction={{
        icon: 'Trash2',
        label: 'Delete',
        color: 'destructive',
        onAction: handleDelete,
      }}
      rightAction={{
        icon: 'Archive',
        label: 'Archive',
        color: 'secondary',
        onAction: handleArchive,
      }}
    >
      <div className="p-4 border border-border rounded-lg">
        <h3 className="font-semibold">Swipe me!</h3>
        <p className="text-sm text-muted-foreground mt-1">Swipe left or right to reveal actions</p>
      </div>
    </SwipeableCard>
  );
}
