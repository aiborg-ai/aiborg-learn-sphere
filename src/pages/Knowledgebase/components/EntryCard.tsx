/**
 * Entry Card Component
 * Card displaying a single knowledgebase entry
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  Building2,
  FileText,
  TrendingUp,
  Clock,
  MapPin,
} from '@/components/ui/icons';
import type { KnowledgebaseEntry, KnowledgebaseTopicType } from '@/types/knowledgebase';
import { getTopicConfig } from '@/types/knowledgebase';
import { format } from 'date-fns';

interface EntryCardProps {
  entry: KnowledgebaseEntry;
  showTopic?: boolean;
}

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users: Users,
  Calendar: Calendar,
  Building2: Building2,
  FileText: FileText,
};

function getTopicIcon(topicType: KnowledgebaseTopicType) {
  const config = getTopicConfig(topicType);
  return config ? IconMap[config.icon] || FileText : FileText;
}

export function EntryCard({ entry, showTopic = false }: EntryCardProps) {
  const TopicIcon = getTopicIcon(entry.topic_type);
  const topicConfig = getTopicConfig(entry.topic_type);

  // Extract metadata for display
  const getMetadataDisplay = () => {
    const metadata = entry.metadata as Record<string, unknown>;

    switch (entry.topic_type) {
      case 'pioneers':
        return metadata?.specialty ? (
          <span className="text-xs text-muted-foreground">{String(metadata.specialty)}</span>
        ) : null;
      case 'events':
        return metadata?.location ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {String(metadata.location)}
          </div>
        ) : null;
      case 'companies':
        return metadata?.headquarters ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {String(metadata.headquarters)}
          </div>
        ) : null;
      case 'research':
        return metadata?.journal ? (
          <span className="text-xs text-muted-foreground italic">{String(metadata.journal)}</span>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <Link to={`/knowledgebase/${entry.topic_type}/${entry.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
        {entry.thumbnail_url && (
          <div className="aspect-video overflow-hidden rounded-t-lg">
            <img
              src={entry.thumbnail_url}
              alt={entry.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <CardHeader className={entry.thumbnail_url ? 'pt-4' : ''}>
          <div className="flex items-start justify-between gap-2 mb-2">
            {showTopic && topicConfig && (
              <div className={`p-2 rounded-lg ${topicConfig.bgColor}`}>
                <TopicIcon className={`h-4 w-4 ${topicConfig.color}`} />
              </div>
            )}
            {entry.is_featured && (
              <Badge variant="secondary" className="text-xs">
                Featured
              </Badge>
            )}
          </div>
          <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
            {entry.title}
          </CardTitle>
          {entry.excerpt && (
            <CardDescription className="line-clamp-3">{entry.excerpt}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {getMetadataDisplay()}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {entry.published_at && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{format(new Date(entry.published_at), 'MMM d, yyyy')}</span>
                </div>
              )}
              {entry.view_count > 0 && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>{entry.view_count} views</span>
                </div>
              )}
            </div>

            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {entry.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
