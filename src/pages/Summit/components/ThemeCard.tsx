/**
 * Theme Card Component
 * Displays a Summit theme (Chakra) card
 */

import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, FileText } from '@/components/ui/icons';
import type { SummitTheme } from '@/types/summit';
import { getThemeColors } from '@/types/summit';

interface ThemeCardProps {
  theme: SummitTheme;
}

export function ThemeCard({ theme }: ThemeCardProps) {
  const colors = getThemeColors(theme.slug);

  return (
    <Link to={`/summit/${theme.slug}`}>
      <Card
        className={`h-full transition-all hover:shadow-lg hover:scale-[1.02] border-2 ${colors.borderColor} hover:border-opacity-100`}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div
              className={`w-10 h-10 rounded-lg ${colors.bgColor} flex items-center justify-center`}
            >
              <FileText className={`h-5 w-5 ${colors.textColor}`} />
            </div>
            <Badge variant="outline" className={`${colors.textColor} ${colors.borderColor}`}>
              #{theme.sort_order}
            </Badge>
          </div>

          {/* Title */}
          <h3 className={`font-semibold text-lg mb-2 ${colors.textColor}`}>{theme.name}</h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{theme.description}</p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-sm font-medium">
              {theme.resource_count} {theme.resource_count === 1 ? 'resource' : 'resources'}
            </span>
            <ArrowRight className={`h-4 w-4 ${colors.textColor}`} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
