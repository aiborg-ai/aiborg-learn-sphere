/**
 * Template Card
 *
 * Card displaying a dashboard template in the gallery
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star,
  Download,
  Eye,
  Heart,
  User,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TemplateGalleryService } from '@/services/dashboard/TemplateGalleryService';
import type { DashboardTemplate } from '@/types/dashboard';

interface TemplateCardProps {
  template: DashboardTemplate;
  onClone?: (templateId: string) => void;
  className?: string;
}

export function TemplateCard({ template, onClone, className }: TemplateCardProps) {
  const [isRating, setIsRating] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const queryClient = useQueryClient();

  // Clone template mutation
  const cloneMutation = useMutation({
    mutationFn: async () => {
      const result = await TemplateGalleryService.cloneTemplate(template.id);
      return result;
    },
    onSuccess: (result) => {
      toast.success('Template cloned successfully');
      queryClient.invalidateQueries({ queryKey: ['dashboard-templates'] });
      if (onClone) {
        onClone(result.viewId);
      }
    },
    onError: () => {
      toast.error('Failed to clone template');
    },
  });

  // Rate template mutation
  const rateMutation = useMutation({
    mutationFn: async (rating: number) => {
      await TemplateGalleryService.rateTemplate(template.id, rating);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-templates'] });
      toast.success('Rating submitted');
      setIsRating(false);
    },
    onError: () => {
      toast.error('Failed to submit rating');
      setIsRating(false);
    },
  });

  // Favorite template mutation
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      await TemplateGalleryService.favoriteTemplate(template.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-templates'] });
      toast.success(template.is_favorited ? 'Removed from favorites' : 'Added to favorites');
      setIsFavoriting(false);
    },
    onError: () => {
      toast.error('Failed to update favorite');
      setIsFavoriting(false);
    },
  });

  const handleClone = () => {
    cloneMutation.mutate();
  };

  const handleRate = (rating: number) => {
    setIsRating(true);
    rateMutation.mutate(rating);
  };

  const handleFavorite = () => {
    setIsFavoriting(true);
    favoriteMutation.mutate();
  };

  return (
    <Card className={cn('group hover:shadow-lg transition-all', className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-1">{template.name}</h3>
            {template.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {template.description}
              </p>
            )}
          </div>

          {template.is_featured && (
            <Badge variant="default" className="shrink-0">
              Featured
            </Badge>
          )}
        </div>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preview Grid - showing widget count */}
        <div className="p-4 border rounded-lg bg-muted/30 flex items-center justify-center">
          <div className="text-center">
            <LayoutGrid className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">
              {template.dashboard_config.widgets.length} Widgets
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1" title="Views">
            <Eye className="h-3 w-3" />
            <span>{template.view_count}</span>
          </div>
          <div className="flex items-center gap-1" title="Clones">
            <Download className="h-3 w-3" />
            <span>{template.clone_count}</span>
          </div>
          <div className="flex items-center gap-1" title="Rating">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{template.average_rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="space-y-2">
          <p className="text-xs font-medium">Rate this template:</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => handleRate(rating)}
                disabled={isRating}
                className={cn(
                  'transition-colors hover:scale-110',
                  isRating && 'opacity-50 cursor-not-allowed'
                )}
                title={`Rate ${rating} stars`}
              >
                <Star
                  className={cn(
                    'h-5 w-5',
                    template.user_rating && rating <= template.user_rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground hover:text-yellow-400'
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="line-clamp-1">{template.creator_name || 'Anonymous'}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleFavorite}
            disabled={isFavoriting}
            title={template.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={cn(
                'h-4 w-4',
                template.is_favorited && 'fill-red-500 text-red-500'
              )}
            />
          </Button>

          <Button
            size="sm"
            onClick={handleClone}
            disabled={cloneMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Clone
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default TemplateCard;
