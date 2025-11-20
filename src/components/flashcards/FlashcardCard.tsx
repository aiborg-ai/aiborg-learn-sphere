/**
 * FlashcardCard Component
 * Animated flip card showing front/back of flashcard
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCw } from '@/components/ui/icons';
import type { Flashcard } from '@/services/spaced-repetition/FlashcardService';

interface FlashcardCardProps {
  flashcard: Flashcard;
  showBack?: boolean;
  onFlip?: () => void;
  className?: string;
}

export function FlashcardCard({
  flashcard,
  showBack = false,
  onFlip,
  className = '',
}: FlashcardCardProps) {
  const [isFlipped, setIsFlipped] = useState(showBack);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    onFlip?.();
  };

  return (
    <div className={`perspective-1000 ${className}`}>
      <Card
        className={`relative min-h-[400px] cursor-pointer transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={handleFlip}
      >
        {/* Front Side */}
        <div
          className={`absolute inset-0 p-8 flex flex-col items-center justify-center backface-hidden ${
            isFlipped ? 'invisible' : 'visible'
          }`}
        >
          <div className="text-center space-y-4 w-full">
            {flashcard.front_image_url && (
              <img
                src={flashcard.front_image_url}
                alt="Flashcard front"
                className="max-w-full max-h-48 mx-auto rounded-lg object-contain"
              />
            )}
            <div className="text-xl md:text-2xl font-medium text-foreground">
              {flashcard.front_content}
            </div>
          </div>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <RotateCw className="h-4 w-4 mr-2" />
              Click to reveal answer
            </Button>
          </div>
        </div>

        {/* Back Side */}
        <div
          className={`absolute inset-0 p-8 flex flex-col items-center justify-center backface-hidden rotate-y-180 ${
            isFlipped ? 'visible' : 'invisible'
          }`}
        >
          <div className="text-center space-y-4 w-full">
            {flashcard.back_image_url && (
              <img
                src={flashcard.back_image_url}
                alt="Flashcard back"
                className="max-w-full max-h-48 mx-auto rounded-lg object-contain"
              />
            )}
            <div className="text-xl md:text-2xl font-medium text-foreground">
              {flashcard.back_content}
            </div>
          </div>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <RotateCw className="h-4 w-4 mr-2" />
              Click to see question
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Add CSS for 3D transforms (add to global CSS or use inline)
// .perspective-1000 { perspective: 1000px; }
// .transform-style-3d { transform-style: preserve-3d; }
// .backface-hidden { backface-visibility: hidden; }
// .rotate-y-180 { transform: rotateY(180deg); }
