/**
 * Chatbot Analytics Dashboard
 * Comprehensive monitoring and cost tracking for the AI chatbot
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CostOverviewCards } from '@/components/admin/chatbot/CostOverviewCards';
import {
  useDailyStats,
  useRecentMessages,
  useAudienceBreakdown,
  useErrorStats,
} from '@/hooks/admin/useChatbotAnalytics';
import {
  useSessionAnalytics,
  useTopicAnalytics,
  useSentimentAnalytics,
  useFeedbackSummary,
  useChatbotSummaryStats,
  getDateRange,
} from '@/hooks/admin/useEnhancedChatbotAnalytics';
import {
  RefreshCw,
  Download,
  TrendingUp,
  Users,
  AlertCircle,
  Clock,
  MessageSquare,
  Hash,
  Smile,
  Frown,
  Meh,
  Star,
  ThumbsUp,
  Laptop,
  Smartphone,
  Tablet,
} from '@/components/ui/icons';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import ExportModal from '@/components/analytics/ExportModal';
import RefreshIndicator from '@/components/analytics/RefreshIndicator';
import AnalyticsSettingsDialog from '@/components/analytics/AnalyticsSettingsDialog';
import type { ChartSection } from '@/services/analytics/EnhancedPDFExportService';
import { useAuth } from '@/hooks/useAuth';
import { useAnalyticsPreferences, useShouldRefreshPage } from '@/hooks/useAnalyticsPreferences';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { Settings } from '@/components/ui/icons';

export default function ChatbotAnalytics() {
  const { user } = useAuth();
  const [dateRange] = useState(() => getDateRange('30d'));
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Get user preferences
  const { data: preferences } = useAnalyticsPreferences(user?.id || '');
  const shouldRefresh = useShouldRefreshPage(preferences, 'chatbot');

  // Existing hooks
  const { data: dailyStats, isLoading: loadingDaily, refetch: refetchDaily } = useDailyStats(30);
  const {
    data: recentMessages,
    isLoading: loadingMessages,
    refetch: refetchMessages,
  } = useRecentMessages(50);
  const { data: audienceBreakdown, refetch: refetchAudience } = useAudienceBreakdown(30);
  const { data: errorStats, refetch: refetchErrors } = useErrorStats(7);

  // Enhanced analytics hooks
  const {
    data: sessionAnalytics,
    isLoading: loadingSessions,
    refetch: refetchSessions,
  } = useSessionAnalytics(dateRange);
  const {
    data: topicAnalytics,
    isLoading: loadingTopics,
    refetch: refetchTopics,
  } = useTopicAnalytics(dateRange);
  const {
    data: sentimentAnalytics,
    isLoading: loadingSentiment,
    refetch: refetchSentiment,
  } = useSentimentAnalytics(dateRange);
  const {
    data: feedbackSummary,
    isLoading: loadingFeedback,
    refetch: refetchFeedback,
  } = useFeedbackSummary(dateRange);
  const { data: summaryStats, refetch: refetchSummary } = useChatbotSummaryStats(dateRange);

  // Auto-refresh setup
  const { state: refreshState, refresh: manualRefresh } = useAutoRefresh({
    interval: preferences?.auto_refresh_interval || 180000,
    enabled: shouldRefresh,
    onRefresh: async () => {
      // Refetch all data
      await Promise.all([
        refetchDaily(),
        refetchMessages(),
        refetchAudience(),
        refetchErrors(),
        refetchSessions(),
        refetchTopics(),
        refetchSentiment(),
        refetchFeedback(),
        refetchSummary(),
      ]);
    },
  });

  const handleExport = () => {
    setExportModalOpen(true);
  };

  // Define sections for PDF export
  const exportSections: ChartSection[] = [
    { elementId: 'chatbot-overview', title: 'Overview', includeInExport: true },
    { elementId: 'chatbot-sessions', title: 'Session Analytics', includeInExport: true },
    { elementId: 'chatbot-topics', title: 'Topic Analysis', includeInExport: true },
    { elementId: 'chatbot-sentiment', title: 'Sentiment Analysis', includeInExport: true },
    { elementId: 'chatbot-feedback', title: 'User Feedback', includeInExport: true },
    { elementId: 'chatbot-cost', title: 'Cost Tracking', includeInExport: true },
  ];

  // Prepare CSV data
  const csvData =
    sessionAnalytics?.map(session => ({
      session_id: session.id,
      user_id: session.user_id,
      session_start: session.session_start,
      session_end: session.session_end,
      duration_seconds: session.duration_seconds,
      message_count: session.message_count,
      total_tokens: session.total_tokens,
      total_cost: session.total_cost,
      device_type: session.device_type,
    })) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chatbot Analytics</h1>
          <p className="text-muted-foreground">
            Monitor usage, costs, and performance of your AI chatbot
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Refresh Indicator */}
          {preferences?.show_refresh_indicator && (
            <RefreshIndicator
              isRefreshing={refreshState.isRefreshing}
              lastRefreshed={refreshState.lastRefresh}
              autoRefreshEnabled={refreshState.isEnabled}
              refreshInterval={preferences?.auto_refresh_interval}
              onManualRefresh={manualRefresh}
              compact
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Cost Overview Cards */}
      <CostOverviewCards key={refreshKey} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Daily Costs Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Costs (Last 30 Days)</CardTitle>
              <CardDescription>Track daily spending and usage trends</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDaily ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : dailyStats && dailyStats.length > 0 ? (
                <div className="space-y-4">
                  {/* Simple bar chart using CSS */}
                  <div className="space-y-2">
                    {dailyStats.slice(0, 7).map(stat => {
                      const maxCost = Math.max(...dailyStats.map(s => s.total_cost_usd));
                      const barWidth = (stat.total_cost_usd / maxCost) * 100;

                      return (
                        <div key={stat.date} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{stat.date}</span>
                            <span className="font-medium">${stat.total_cost_usd.toFixed(4)}</span>
                          </div>
                          <div className="h-8 bg-muted rounded-md overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stat.total_messages} messages • {stat.total_tokens.toLocaleString()}{' '}
                            tokens
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Total (30 days)</p>
                      <p className="text-2xl font-bold">
                        ${dailyStats.reduce((sum, s) => sum + s.total_cost_usd, 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Messages</p>
                      <p className="text-2xl font-bold">
                        {dailyStats.reduce((sum, s) => sum + s.total_messages, 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Daily Cost</p>
                      <p className="text-2xl font-bold">
                        $
                        {(
                          dailyStats.reduce((sum, s) => sum + s.total_cost_usd, 0) /
                          dailyStats.length
                        ).toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No data available yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Data will appear once the chatbot is used
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Latest 50 chatbot interactions</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMessages ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentMessages && recentMessages.length > 0 ? (
                <div className="space-y-2">
                  {recentMessages.map(msg => (
                    <div
                      key={msg.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={msg.role === 'user' ? 'default' : 'secondary'}>
                            {msg.role}
                          </Badge>
                          <Badge variant="outline">{msg.audience}</Badge>
                          {msg.is_error && <Badge variant="destructive">Error</Badge>}
                          {msg.is_fallback && <Badge variant="outline">Fallback</Badge>}
                        </div>
                        <p className="text-sm line-clamp-2">{msg.content}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{formatDistanceToNow(new Date(msg.created_at))} ago</span>
                          {msg.total_tokens > 0 && <span>{msg.total_tokens} tokens</span>}
                          {msg.cost_usd > 0 && <span>${msg.cost_usd.toFixed(4)}</span>}
                          {msg.response_time_ms > 0 && <span>{msg.response_time_ms}ms</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No messages yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Audience</CardTitle>
              <CardDescription>Breakdown of chatbot usage by audience type</CardDescription>
            </CardHeader>
            <CardContent>
              {audienceBreakdown && audienceBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {audienceBreakdown.map((aud: Record<string, number | string>) => (
                    <div key={aud.audience} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium capitalize">{aud.audience}</span>
                        </div>
                        <span className="text-sm font-medium">${aud.total_cost.toFixed(4)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <span>{aud.total_messages} messages</span>
                        <span>{aud.total_tokens.toLocaleString()} tokens</span>
                        <span>{aud.avg_response_time}ms avg</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${(aud.total_cost / Math.max(...audienceBreakdown.map((a: Record<string, number>) => a.total_cost as number))) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No audience data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Statistics</CardTitle>
              <CardDescription>Track errors and fallbacks over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {errorStats && errorStats.length > 0 ? (
                <div className="space-y-4">
                  {errorStats.map((stat: Record<string, string | number>) => (
                    <div key={stat.date} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{stat.date}</span>
                        <div className="flex gap-4 text-sm">
                          <span className="text-red-500">{stat.errors} errors</span>
                          <span className="text-yellow-500">{stat.fallbacks} fallbacks</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                          <div
                            className="h-full bg-red-500"
                            style={{ width: `${(stat.errors / stat.total) * 100}%` }}
                          />
                        </div>
                        <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                          <div
                            className="h-full bg-yellow-500"
                            style={{ width: `${(stat.fallbacks / stat.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No error data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summaryStats?.totalSessions.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Messages/Session</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summaryStats?.avgMessagesPerSession.toFixed(1) || 0}
                </div>
                <p className="text-xs text-muted-foreground">Per conversation</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summaryStats?.totalMessages.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">All sessions</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Session Analytics</CardTitle>
              <CardDescription>Daily session metrics and device breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSessions ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sessionAnalytics && sessionAnalytics.length > 0 ? (
                <div className="space-y-4">
                  {sessionAnalytics.slice(0, 7).map(session => (
                    <div key={session.date} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{session.date}</span>
                        <div className="flex gap-4">
                          <span className="font-medium">{session.total_sessions} sessions</span>
                          <span className="text-muted-foreground">
                            {Math.round(session.avg_duration_seconds / 60)}m avg
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Laptop className="h-3 w-3" />
                          {session.desktop_sessions}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Smartphone className="h-3 w-3" />
                          {session.mobile_sessions}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Tablet className="h-3 w-3" />
                          {session.tablet_sessions}
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                        <div
                          className="bg-blue-500"
                          style={{
                            width: `${(session.desktop_sessions / session.total_sessions) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-green-500"
                          style={{
                            width: `${(session.mobile_sessions / session.total_sessions) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-purple-500"
                          style={{
                            width: `${(session.tablet_sessions / session.total_sessions) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No session data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Topic Distribution</CardTitle>
              <CardDescription>Conversation topics based on keyword analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTopics ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : topicAnalytics && topicAnalytics.length > 0 ? (
                <div className="space-y-4">
                  {topicAnalytics.map(topic => (
                    <div key={topic.topic_id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: topic.color }}
                          />
                          <span className="font-medium">{topic.topic_name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {topic.message_count} messages
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <span>{topic.unique_users} users</span>
                        <span>
                          {topic.avg_response_time_ms > 0
                            ? `${topic.avg_response_time_ms}ms avg`
                            : 'N/A'}
                        </span>
                        <span>
                          {topic.avg_rating > 0 ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {topic.avg_rating.toFixed(1)}
                            </div>
                          ) : (
                            'No ratings'
                          )}
                        </span>
                      </div>
                      <Progress
                        value={
                          (topic.message_count /
                            Math.max(...topicAnalytics.map(t => t.message_count))) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <Hash className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No topic data available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Topics are auto-categorized based on message content
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sentiment Tab */}
        <TabsContent value="sentiment" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Positive</CardTitle>
                <Smile className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {sentimentAnalytics
                    ?.reduce((sum, s) => sum + s.positive_messages, 0)
                    .toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">Messages with positive sentiment</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Neutral</CardTitle>
                <Meh className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {sentimentAnalytics
                    ?.reduce((sum, s) => sum + s.neutral_messages, 0)
                    .toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">Messages with neutral sentiment</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Negative</CardTitle>
                <Frown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {sentimentAnalytics
                    ?.reduce((sum, s) => sum + s.negative_messages, 0)
                    .toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">Messages with negative sentiment</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sentiment Trends</CardTitle>
              <CardDescription>Track conversation sentiment over time</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSentiment ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sentimentAnalytics && sentimentAnalytics.length > 0 ? (
                <div className="space-y-4">
                  {sentimentAnalytics.slice(0, 7).map(sentiment => (
                    <div key={sentiment.date} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{sentiment.date}</span>
                        <span className="font-medium">
                          Avg: {sentiment.avg_sentiment.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-6 bg-muted rounded-full overflow-hidden flex">
                        <div
                          className="bg-green-500"
                          style={{
                            width: `${(sentiment.positive_messages / sentiment.total_messages) * 100}%`,
                          }}
                          title={`${sentiment.positive_messages} positive`}
                        />
                        <div
                          className="bg-gray-400"
                          style={{
                            width: `${(sentiment.neutral_messages / sentiment.total_messages) * 100}%`,
                          }}
                          title={`${sentiment.neutral_messages} neutral`}
                        />
                        <div
                          className="bg-red-500"
                          style={{
                            width: `${(sentiment.negative_messages / sentiment.total_messages) * 100}%`,
                          }}
                          title={`${sentiment.negative_messages} negative`}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="text-green-600">
                          {sentiment.positive_messages} positive
                        </span>
                        <span className="text-gray-600">{sentiment.neutral_messages} neutral</span>
                        <span className="text-red-600">{sentiment.negative_messages} negative</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <Smile className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No sentiment data available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sentiment is analyzed from message content
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summaryStats?.avgRating.toFixed(2) || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Out of 5 stars</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {feedbackSummary?.reduce((sum, f) => sum + f.total_feedback, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">User ratings collected</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Feedback</CardTitle>
              <CardDescription>Track user satisfaction and feedback trends</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFeedback ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : feedbackSummary && feedbackSummary.length > 0 ? (
                <div className="space-y-4">
                  {feedbackSummary.slice(0, 7).map(feedback => (
                    <div key={feedback.date} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{feedback.date}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{feedback.avg_rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-1 text-xs">
                        <div className="text-center">
                          <div className="font-medium text-green-600">{feedback.helpful_count}</div>
                          <div className="text-muted-foreground">Helpful</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{feedback.perfect_count}</div>
                          <div className="text-muted-foreground">Perfect</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-yellow-600">
                            {feedback.incomplete_count}
                          </div>
                          <div className="text-muted-foreground">Incomplete</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-orange-600">
                            {feedback.incorrect_count}
                          </div>
                          <div className="text-muted-foreground">Incorrect</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-600">
                            {feedback.not_helpful_count}
                          </div>
                          <div className="text-muted-foreground">Not Helpful</div>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                        <div
                          className="bg-green-500"
                          style={{
                            width: `${(feedback.positive_feedback / feedback.total_feedback) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-yellow-500"
                          style={{
                            width: `${(feedback.neutral_feedback / feedback.total_feedback) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-red-500"
                          style={{
                            width: `${(feedback.negative_feedback / feedback.total_feedback) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <ThumbsUp className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No feedback data available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Users can rate chatbot responses
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        sections={exportSections}
        reportTitle="Chatbot Analytics Report"
        reportSubtitle="Usage, Performance, and Cost Analysis"
        csvData={csvData}
        csvTemplate="chatbotSessions"
        dateRange={dateRange}
        metadata={{
          'Total Sessions': summaryStats?.totalSessions.toString() || '0',
          'Total Messages': summaryStats?.totalMessages.toString() || '0',
          'Avg Duration': `${summaryStats?.avgDuration || 0} minutes`,
        }}
      />

      {/* Analytics Settings Dialog */}
      <AnalyticsSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
