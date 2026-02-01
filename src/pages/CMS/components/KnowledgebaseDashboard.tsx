/**
 * Knowledgebase Dashboard Component
 * Overview statistics and quick actions for knowledgebase management
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar,
  Building2,
  FileText,
  TrendingUp,
  Eye,
  Clock,
  Star,
  Plus,
} from '@/components/ui/icons';
import { useKnowledgebaseStats } from '@/hooks/knowledgebase/useKnowledgebaseEntries';
import { TOPIC_CONFIGS } from '@/types/knowledgebase';

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users: Users,
  Calendar: Calendar,
  Building2: Building2,
  FileText: FileText,
};

function KnowledgebaseDashboard() {
  const { data: stats, isLoading } = useKnowledgebaseStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats?.total_entries || 0}</p>
                <p className="text-sm text-muted-foreground">Total Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats?.total_views || 0}</p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats?.published_count || 0}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats?.featured_count || 0}</p>
                <p className="text-sm text-muted-foreground">Featured</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Topic Breakdown */}
      <div>
        <h2 className="text-xl font-semibold mb-4">By Topic</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOPIC_CONFIGS.map(config => {
            const topicStat = stats?.by_topic?.find(ts => ts.topic_type === config.type);
            const Icon = IconMap[config.icon] || FileText;

            return (
              <Card key={config.type} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{config.label}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Published</span>
                      <span className="font-medium">{topicStat?.published_count || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Drafts</span>
                      <span className="font-medium">{topicStat?.draft_count || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Views</span>
                      <span className="font-medium">{topicStat?.total_views || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOPIC_CONFIGS.map(config => {
            const Icon = IconMap[config.icon] || FileText;
            return (
              <Card
                key={config.type}
                className="group cursor-pointer hover:shadow-md transition-all"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg ${config.bgColor} group-hover:scale-110 transition-transform`}
                    >
                      <Plus className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        Add {config.label.replace('AI ', '')}
                      </p>
                      <p className="text-sm text-muted-foreground">Create new entry</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Drafts Alert */}
      {stats && stats.draft_count > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">You have {stats.draft_count} draft entries</p>
                <p className="text-sm text-muted-foreground">
                  Review and publish them to make them visible to users
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Public Pages */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">View Public Knowledgebase</p>
              <p className="text-sm text-muted-foreground">
                See how your entries appear to visitors
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/knowledgebase" target="_blank">
                View Knowledgebase
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default KnowledgebaseDashboard;
