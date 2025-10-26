/**
 * Chatbot Analytics Dashboard
 * Comprehensive monitoring and cost tracking for the AI chatbot
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CostOverviewCards } from '@/components/admin/chatbot/CostOverviewCards';
import {
  useDailyStats,
  useRecentMessages,
  useAudienceBreakdown,
  useErrorStats,
} from '@/hooks/admin/useChatbotAnalytics';
import { RefreshCw, Download, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function ChatbotAnalytics() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: dailyStats, isLoading: loadingDaily } = useDailyStats(30);
  const { data: recentMessages, isLoading: loadingMessages } = useRecentMessages(50);
  const { data: audienceBreakdown } = useAudienceBreakdown(30);
  const { data: errorStats } = useErrorStats(7);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExport = () => {
    // Export data as CSV
    const csv = dailyStats
      ?.map(
        stat =>
          `${stat.date},${stat.total_cost_usd},${stat.total_messages},${stat.total_tokens},${stat.error_rate}`
      )
      .join('\n');
    const blob = new Blob([`Date,Cost,Messages,Tokens,ErrorRate\n${csv}`], {
      type: 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatbot-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Cost Overview Cards */}
      <CostOverviewCards key={refreshKey} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Recent Messages</TabsTrigger>
          <TabsTrigger value="audience">By Audience</TabsTrigger>
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
                  {audienceBreakdown.map((aud: any) => (
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
                            width: `${(aud.total_cost / Math.max(...audienceBreakdown.map((a: any) => a.total_cost))) * 100}%`,
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
                  {errorStats.map((stat: any) => (
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
      </Tabs>
    </div>
  );
}
