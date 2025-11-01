import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { EventPhoto } from '@/hooks/useEvents';

interface EventPhotoGalleryProps {
  photos: EventPhoto[];
  eventTitle: string;
}

export function EventPhotoGallery({ photos, eventTitle }: EventPhotoGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  if (!photos || photos.length === 0) {
    return null;
  }

  const displayedPhotos = showAllPhotos ? photos : photos.slice(0, 6);

  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const closeLightbox = () => {
    setSelectedPhotoIndex(null);
  };

  const goToPrevious = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    } else if (e.key === 'Escape') {
      closeLightbox();
    }
  };

  return (
    <>
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Event Photos</h3>
            <Badge variant="secondary">{photos.length}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {displayedPhotos.map((photo, index) => (
            <Card
              key={photo.id}
              className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300"
              onClick={() => openLightbox(index)}
            >
              <CardContent className="p-0 relative">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={photo.photo_url}
                    alt={photo.photo_caption || `${eventTitle} photo ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
                {photo.photo_caption && (
                  <div className="p-2 bg-muted/50">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {photo.photo_caption}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {photos.length > 6 && (
          <div className="text-center mt-6">
            <Button variant="outline" onClick={() => setShowAllPhotos(!showAllPhotos)}>
              {showAllPhotos ? 'Show Less' : `View All ${photos.length} Photos`}
            </Button>
          </div>
        )}
      </div>

      {/* Lightbox Dialog */}
      {selectedPhotoIndex !== null && (
        <Dialog open={true} onOpenChange={closeLightbox}>
          <DialogContent className="max-w-5xl max-h-[90vh] p-0" onKeyDown={handleKeyDown}>
            <DialogHeader className="p-4 pb-2">
              <DialogTitle className="flex items-center justify-between">
                <span>
                  {eventTitle} - Photo {selectedPhotoIndex + 1} of {photos.length}
                </span>
                <Button variant="ghost" size="icon" onClick={closeLightbox} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>

            <div className="relative">
              <img
                src={photos[selectedPhotoIndex].photo_url}
                alt={
                  photos[selectedPhotoIndex].photo_caption ||
                  `${eventTitle} photo ${selectedPhotoIndex + 1}`
                }
                className="w-full max-h-[70vh] object-contain"
              />

              {/* Navigation Buttons */}
              {selectedPhotoIndex > 0 && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}

              {selectedPhotoIndex < photos.length - 1 && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}
            </div>

            {photos[selectedPhotoIndex].photo_caption && (
              <div className="p-4 pt-2 bg-muted/50">
                <p className="text-sm text-center text-muted-foreground">
                  {photos[selectedPhotoIndex].photo_caption}
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
