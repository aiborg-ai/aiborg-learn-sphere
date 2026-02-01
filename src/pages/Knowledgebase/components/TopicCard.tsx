/**
 * Topic Card Component
 * Card displaying a knowledgebase topic category
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Users, Calendar, Building2, FileText } from '@/components/ui/icons';
import type { TopicConfig } from '@/types/knowledgebase';

interface TopicCardProps {
  config: TopicConfig;
  count?: number;
}

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users: Users,
  Calendar: Calendar,
  Building2: Building2,
  FileText: FileText,
};

export function TopicCard({ config, count = 0 }: TopicCardProps) {
  const Icon = IconMap[config.icon] || FileText;

  return (
    <Link to={config.route}>
      <Card className="h-full hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-lg ${config.bgColor}`}>
              <Icon className={`h-6 w-6 ${config.color}`} />
            </div>
            {count > 0 && (
              <Badge variant="secondary" className="text-sm">
                {count} entries
              </Badge>
            )}
          </div>
          <CardTitle className="text-xl mt-4 group-hover:text-primary transition-colors flex items-center gap-2">
            {config.label}
            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardTitle>
          <CardDescription className="text-base">{config.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Explore {config.label.toLowerCase()} →
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
