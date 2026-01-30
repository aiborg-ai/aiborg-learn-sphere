/**
 * Summit Dashboard Component
 * Statistics and overview for the Summit Resource Hub
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Star, Layers, TrendingUp, Clock, BarChart3 } from '@/components/ui/icons';
import { useSummitStats, useSummitThemes } from '@/hooks/summit/useSummitResources';
import { RESOURCE_TYPE_CONFIGS, getThemeColors } from '@/types/summit';

function SummitDashboard() {
  const { data: stats, isLoading: loadingStats } = useSummitStats();
  const { data: themes = [], isLoading: loadingThemes } = useSummitThemes();

  if (loadingStats || loadingThemes) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summit Info */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-200">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">India AI Impact Summit 2026</h2>
              <p className="text-muted-foreground">February 19-20, 2026 | New Delhi, India</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600">{themes.length}</div>
              <div className="text-sm text-muted-foreground">Chakras (Themes)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.total_resources || 0}</div>
                <div className="text-sm text-muted-foreground">Total Resources</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.published_count || 0}</div>
                <div className="text-sm text-muted-foreground">Published</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.featured_count || 0}</div>
                <div className="text-sm text-muted-foreground">Featured</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.total_views || 0}</div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resources by Theme (The 7 Chakras) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Resources by Theme (Seven Chakras)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {themes.map(theme => {
              const themeStat = stats?.by_theme.find(t => t.theme_id === theme.id);
              const colors = getThemeColors(theme.slug);
              return (
                <div
                  key={theme.id}
                  className={`p-4 rounded-lg border ${colors.borderColor} ${colors.bgColor}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-semibold ${colors.textColor}`}>{theme.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      #{theme.sort_order}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Published</span>
                      <span className="font-medium">{themeStat?.published_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Drafts</span>
                      <span className="font-medium">{themeStat?.draft_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Views</span>
                      <span className="font-medium">{themeStat?.total_views || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Resources by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resources by Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {RESOURCE_TYPE_CONFIGS.map(config => {
              const count = stats?.by_type.find(t => t.type === config.type)?.count || 0;
              return (
                <div
                  key={config.type}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-lg ${config.color}`}>
                      {/* Icon would be rendered here */}
                    </div>
                    <div>
                      <div className="font-semibold">{count}</div>
                      <div className="text-sm text-muted-foreground">{config.label}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Draft Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-amber-600">{stats?.draft_count || 0}</div>
              <p className="text-muted-foreground mt-1">
                Resources awaiting review and publication
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Featured Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-purple-600">{stats?.featured_count || 0}</div>
              <p className="text-muted-foreground mt-1">Highlighted on the Summit landing page</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SummitDashboard;
