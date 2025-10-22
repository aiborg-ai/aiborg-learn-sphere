/* eslint-disable jsx-a11y/prefer-tag-over-role */
/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/utils/iconLoader';
import { cn } from '@/lib/utils';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[];
  defaultSnap?: number;
  className?: string;
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.9],
  defaultSnap = 0,
  className,
}: MobileBottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = currentY - startY;
    const threshold = 100; // pixels to trigger close

    if (deltaY > threshold) {
      onClose();
    }

    setStartY(0);
    setCurrentY(0);
  };

  const dragOffset = isDragging ? Math.max(0, currentY - startY) : 0;

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      {}
      <div
        ref={sheetRef}
        className={cn(
          'mobile-bottom-sheet open',
          'relative w-full bg-card border-t border-border',
          'animate-in slide-in-from-bottom duration-300',
          className
        )}
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: `${snapPoints[currentSnap] * 100}vh`,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      >
        {/* Drag Handle */}
        <div
          className="mobile-bottom-sheet-handle cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-label="Drag to resize or close"
        />

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
            <h2 id="bottom-sheet-title" className="text-lg font-semibold text-foreground">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted/50 active:bg-muted transition-colors"
              aria-label="Close"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-4 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

// Hook for managing bottom sheet state
export function useMobileBottomSheet() {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(prev => !prev);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
