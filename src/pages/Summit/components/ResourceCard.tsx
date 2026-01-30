/**
 * Resource Card Component
 * Displays a Summit resource card
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  Eye,
  Star,
  FileText,
  Video,
  Database,
  BarChart,
} from '@/components/ui/icons';
import type { SummitResource } from '@/types/summit';
import { getThemeColors, getResourceTypeConfig } from '@/types/summit';
import { SummitResourceService } from '@/services/summit';

interface ResourceCardProps {
  resource: SummitResource;
  showTheme?: boolean;
}

export function ResourceCard({ resource, showTheme = false }: ResourceCardProps) {
  const themeColors = resource.theme ? getThemeColors(resource.theme.slug) : {};
  const typeConfig = getResourceTypeConfig(resource.resource_type);

  const handleClick = () => {
    // Increment view count when clicking through
    SummitResourceService.incrementViewCount(resource.id);
  };

  // Get icon based on resource type
  const getTypeIcon = () => {
    switch (resource.resource_type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'dataset':
        return <Database className="h-4 w-4" />;
      case 'report':
        return <BarChart className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-2">
            {/* Resource Type Badge */}
            <Badge variant="outline" className={typeConfig?.color}>
              {getTypeIcon()}
              <span className="ml-1">{typeConfig?.label || resource.resource_type}</span>
            </Badge>

            {/* Featured Badge */}
            {resource.is_featured && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
        </div>

        {/* Theme Badge (optional) */}
        {showTheme && resource.theme && (
          <Badge
            variant="outline"
            className={`${themeColors.bgColor} ${themeColors.textColor} ${themeColors.borderColor} mb-2 w-fit`}
          >
            {resource.theme.name}
          </Badge>
        )}

        {/* Title */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{resource.title}</h3>

        {/* Description */}
        {resource.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-grow">
            {resource.description}
          </p>
        )}

        {/* Source */}
        {resource.source && (
          <p className="text-xs text-muted-foreground mb-3">Source: {resource.source}</p>
        )}

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {resource.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{resource.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            <span>{resource.view_count || 0} views</span>
          </div>
          <Button variant="outline" size="sm" className="gap-1" asChild onClick={handleClick}>
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              Open
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
