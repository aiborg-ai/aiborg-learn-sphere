/**
 * KB Source Citations Component
 * Displays Knowledge Base articles cited by the chatbot
 */

import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ExternalLink, TrendingUp } from '@/components/ui/icons';

export interface KBSource {
  type: string;
  title: string;
  similarity: number;
  content_id?: string;
  slug?: string;
  metadata?: {
    category?: string;
    difficulty?: string;
  };
}

interface KBSourceCitationsProps {
  sources: KBSource[];
  compact?: boolean;
}

export function KBSourceCitations({ sources, compact = false }: KBSourceCitationsProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  // Filter to only show KB articles
  const kbSources = sources.filter(s => s.type === 'knowledge_base');

  if (kbSources.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <BookOpen className="h-3 w-3" />
          <span className="font-medium">Sources from Knowledge Base:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {kbSources.slice(0, 3).map((source, index) => (
            <Link
              key={index}
              to={`/kb/${source.slug || source.content_id}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <span>{source.title}</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          ))}
          {kbSources.length > 3 && (
            <span className="text-xs text-muted-foreground">+{kbSources.length - 3} more</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Knowledge Base Sources</h4>
        <Badge variant="secondary" className="text-xs">
          {kbSources.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {kbSources.map((source, index) => (
          <Link key={index} to={`/kb/${source.slug || source.content_id}`} className="block group">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-2 border-l-primary">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                        {source.title}
                      </h5>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {source.metadata?.category && (
                        <Badge variant="outline" className="text-xs">
                          {source.metadata.category.replace(/_/g, ' ')}
                        </Badge>
                      )}
                      {source.metadata?.difficulty && (
                        <Badge variant="secondary" className="text-xs">
                          {source.metadata.difficulty}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <TrendingUp className="h-3 w-3" />
                    <span>{Math.round(source.similarity * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        💡 These articles from our Knowledge Base were used to answer your question
      </p>
    </div>
  );
}
