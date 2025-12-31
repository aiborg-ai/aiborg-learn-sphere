import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompetencyService } from '@/services/analytics/CompetencyService';
import type { CompetencySnapshot } from '@/services/analytics/types';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import {
  Activity,
  Award,
  Loader2,
  TrendingUp,
  TrendingDown,
  Target,
  Star,
} from '@/components/ui/icons';
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface DayCell {
  date: Date;
  score: number;
  level: string;
}

export const CompetencyHeatMap: React.FC = () => {
  const { user } = useAuth();
  interface TimeSeriesData {
    snapshot_date: string;
    overall_competency: number;
  }

  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<CompetencySnapshot | null>(null);
  const [_timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [heatMapData, setHeatMapData] = useState<DayCell[]>([]);

  const loadCompetencyData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [currentSnapshot, timeSeriesData] = await Promise.all([
        CompetencyService.getCompetencyMatrix(user.id),
        CompetencyService.getPerformanceTimeSeries(user.id, 90),
      ]);

      setSnapshot(currentSnapshot);
      setTimeSeries(timeSeriesData);

      // Generate heat map data for the last 90 days
      const endDate = new Date();
      const startDate = subDays(endDate, 89);
      const dayInterval = eachDayOfInterval({ start: startDate, end: endDate });

      const heatMap = dayInterval.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayData = timeSeriesData.find(
          (d: TimeSeriesData) => format(new Date(d.snapshot_date), 'yyyy-MM-dd') === dateStr
        );

        return {
          date,
          score: dayData?.overall_competency || 0,
          level: getCompetencyLevel(dayData?.overall_competency || 0),
        };
      });

      setHeatMapData(heatMap);
    } catch (_error) {
      logger._error('Error loading competency data:', _error);
      setSnapshot(null);
      setTimeSeries([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadCompetencyData();
    }
  }, [user, loadCompetencyData]);

  const getCompetencyLevel = (score: number): string => {
    if (score >= 90) return 'Master';
    if (score >= 75) return 'Advanced';
    if (score >= 60) return 'Intermediate';
    if (score >= 40) return 'Beginner';
    return 'Novice';
  };

  const getCellColor = (score: number): string => {
    if (score === 0) return '#ebedf0'; // No data
    if (score >= 90) return '#10b981'; // Green - Master
    if (score >= 75) return '#3b82f6'; // Blue - Advanced
    if (score >= 60) return '#f59e0b'; // Orange - Intermediate
    if (score >= 40) return '#f97316'; // Dark orange - Beginner
    return '#ef4444'; // Red - Novice
  };

  const getPercentileColor = (percentile: number): string => {
    if (percentile >= 90) return 'bg-green-100 text-green-800';
    if (percentile >= 75) return 'bg-blue-100 text-blue-800';
    if (percentile >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!snapshot) {
    return (
      <Card>
        <CardContent className="p-8">
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              Complete assessments to build your competency heat map!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Group heat map data by weeks
  const weeks: DayCell[][] = [];
  for (let i = 0; i < heatMapData.length; i += 7) {
    weeks.push(heatMapData.slice(i, i + 7));
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Competency</p>
                <p className="text-3xl font-bold">{Math.round(snapshot.overallCompetency)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getCompetencyLevel(snapshot.overallCompetency)} Level
                </p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Percentile Rank</p>
                <p className="text-3xl font-bold">{Math.round(snapshot.overallPercentile)}th</p>
                <Badge className={getPercentileColor(snapshot.overallPercentile)}>
                  {snapshot.overallPercentile >= 75
                    ? 'Top performer'
                    : snapshot.overallPercentile >= 50
                      ? 'Above average'
                      : 'Room to grow'}
                </Badge>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Top Strengths</p>
              <div className="space-y-1">
                {snapshot.topStrengths.slice(0, 2).map((strength, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs font-medium">{strength}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Competency Heat Map
          </CardTitle>
          <CardDescription>90-day skill development visualization</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="heatmap">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="heatmap">Heat Map</TabsTrigger>
              <TabsTrigger value="categories">By Category</TabsTrigger>
            </TabsList>

            {/* Heat Map View */}
            <TabsContent value="heatmap" className="mt-6">
              {/* Legend */}
              <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-1">
                  {[0, 40, 60, 75, 90].map(score => (
                    <div
                      key={score}
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: getCellColor(score) }}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>

              {/* GitHub-style Heat Map */}
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  <div className="flex gap-1">
                    {weeks.map((week, weekIdx) => (
                      <div key={weekIdx} className="flex flex-col gap-1">
                        {week.map((day, dayIdx) => (
                          <div
                            key={dayIdx}
                            className="w-3 h-3 rounded-sm cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                            style={{ backgroundColor: getCellColor(day.score) }}
                            title={`${format(day.date, 'MMM dd, yyyy')}: ${day.score > 0 ? `${Math.round(day.score)}% (${day.level})` : 'No data'}`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Month Labels */}
              <div className="mt-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>{format(subDays(new Date(), 89), 'MMM yyyy')}</span>
                  <span>{format(new Date(), 'MMM yyyy')}</span>
                </div>
              </div>

              {/* Insights */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Activity Insights</p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Most Active Day:</span>
                    <span className="ml-2 font-semibold">
                      {heatMapData.reduce((max, day) => (day.score > max.score ? day : max)).score >
                      0
                        ? format(
                            heatMapData.reduce((max, day) => (day.score > max.score ? day : max))
                              .date,
                            'MMM dd'
                          )
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Active Days:</span>
                    <span className="ml-2 font-semibold">
                      {heatMapData.filter(d => d.score > 0).length} / 90
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Categories View */}
            <TabsContent value="categories" className="space-y-4 mt-6">
              {Object.entries(snapshot.competencyMatrix || {})
                .sort(([, a], [, b]) => b.score - a.score)
                .map(([category, data]) => (
                  <Card key={category}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{category}</h4>
                          <Badge className="mt-1 text-xs">{getCompetencyLevel(data.score)}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{Math.round(data.score)}%</p>
                          <p className="text-xs text-muted-foreground">
                            {data.percentile}th percentile
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${data.score}%`,
                              backgroundColor: getCellColor(data.score),
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          {data.score >= 75 ? (
                            <>
                              <TrendingUp className="h-3 w-3 text-green-600" />
                              <span className="text-green-600">Strong competency</span>
                            </>
                          ) : data.score < 50 ? (
                            <>
                              <TrendingDown className="h-3 w-3 text-orange-600" />
                              <span className="text-orange-600">Needs improvement</span>
                            </>
                          ) : (
                            <>
                              <Activity className="h-3 w-3 text-blue-600" />
                              <span className="text-blue-600">Developing</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
