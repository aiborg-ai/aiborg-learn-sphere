/**
 * RAG Dashboard
 *
 * Admin dashboard for managing and monitoring the RAG (Retrieval Augmented Generation) system:
 * - Embedding statistics and health
 * - Query analytics and performance
 * - Manual embedding generation
 * - Queue status monitoring
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Database,
  Brain,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Search,
  FileText,
  BookOpen,
  HelpCircle,
  Route,
  BarChart3,
} from '@/components/ui/icons';
import { useToast } from '@/hooks/use-toast';
import { RAGService } from '@/services/rag/RAGService';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface EmbeddingStats {
  total: number;
  by_type: Record<string, number>;
}

interface QueueStatus {
  pending: number;
  processed_today: number;
  errors_today: number;
}

interface QueryAnalytics {
  id: string;
  query_text: string;
  results_count: number;
  top_result_type: string | null;
  top_result_similarity: number | null;
  search_latency_ms: number;
  total_latency_ms: number;
  was_helpful: boolean | null;
  created_at: string;
}

const contentTypeIcons: Record<string, React.ElementType> = {
  course: BookOpen,
  blog_post: FileText,
  faq: HelpCircle,
  learning_path: Route,
  flashcard: Brain,
  assessment: Search,
};

export function RAGDashboard() {
  const { toast } = useToast();
  const [embeddingStats, setEmbeddingStats] = useState<EmbeddingStats | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [queryAnalytics, setQueryAnalytics] = useState<QueryAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState<string>('all');
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<string>('7d');

  // Fetch all data on mount
  useEffect(() => {
    fetchData();
  }, [analyticsTimeframe]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchEmbeddingStats(), fetchQueueStatus(), fetchQueryAnalytics()]);
    } catch (error) {
      logger.error('Error fetching RAG dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmbeddingStats = async () => {
    try {
      const stats = await RAGService.getEmbeddingStats();
      setEmbeddingStats(stats);
    } catch (error) {
      logger.error('Error fetching embedding stats:', error);
    }
  };

  const fetchQueueStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('get_embedding_queue_status');
      if (error) throw error;
      if (data && data.length > 0) {
        setQueueStatus(data[0]);
      }
    } catch (error) {
      logger.error('Error fetching queue status:', error);
    }
  };

  const fetchQueryAnalytics = async () => {
    try {
      // Calculate date range
      const days = analyticsTimeframe === '24h' ? 1 : analyticsTimeframe === '7d' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analytics = await RAGService.getAnalytics({
        start_date: startDate.toISOString(),
        limit: 100,
      });
      setQueryAnalytics(analytics || []);
    } catch (error) {
      logger.error('Error fetching query analytics:', error);
    }
  };

  const handleGenerateEmbeddings = async () => {
    setIsGenerating(true);
    try {
      const options =
        selectedContentType !== 'all'
          ? { content_type: selectedContentType, force_refresh: true }
          : { force_refresh: true };

      const result = await RAGService.generateEmbeddings(options);

      toast({
        title: 'Embeddings Generated',
        description: `Processed ${result.processed} items with ${result.errors} errors`,
      });

      // Refresh stats
      await fetchEmbeddingStats();
    } catch (error) {
      logger.error('Error generating embeddings:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate embeddings',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate metrics
  const avgSearchLatency =
    queryAnalytics.length > 0
      ? Math.round(
          queryAnalytics.reduce((sum, q) => sum + q.search_latency_ms, 0) / queryAnalytics.length
        )
      : 0;

  const avgTotalLatency =
    queryAnalytics.length > 0
      ? Math.round(
          queryAnalytics.reduce((sum, q) => sum + q.total_latency_ms, 0) / queryAnalytics.length
        )
      : 0;

  const helpfulRate =
    queryAnalytics.length > 0
      ? Math.round(
          (queryAnalytics.filter(q => q.was_helpful === true).length /
            queryAnalytics.filter(q => q.was_helpful !== null).length) *
            100
        ) || 0
      : 0;

  const avgResultCount =
    queryAnalytics.length > 0
      ? (
          queryAnalytics.reduce((sum, q) => sum + q.results_count, 0) / queryAnalytics.length
        ).toFixed(1)
      : '0';

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            RAG System Dashboard
          </h2>
          <p className="text-muted-foreground">Monitor and manage Retrieval Augmented Generation</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Embeddings</p>
                <p className="text-2xl font-bold">{embeddingStats?.total || 0}</p>
              </div>
              <Database className="h-8 w-8 text-primary opacity-80" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {Object.keys(embeddingStats?.by_type || {}).length} content types
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Search Time</p>
                <p className="text-2xl font-bold">{avgSearchLatency}ms</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
            <div className="mt-2">
              <Badge variant={avgSearchLatency < 100 ? 'default' : 'secondary'} className="text-xs">
                {avgSearchLatency < 100
                  ? 'Excellent'
                  : avgSearchLatency < 500
                    ? 'Good'
                    : 'Needs optimization'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Helpful Rate</p>
                <p className="text-2xl font-bold">{helpfulRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-80" />
            </div>
            <div className="mt-2">
              <Progress value={helpfulRate} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Queue Status</p>
                <p className="text-2xl font-bold">{queueStatus?.pending || 0}</p>
              </div>
              {queueStatus?.pending === 0 ? (
                <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
              ) : (
                <Clock className="h-8 w-8 text-orange-500 opacity-80" />
              )}
            </div>
            <div className="mt-2">
              <Badge
                variant={queueStatus?.pending === 0 ? 'default' : 'secondary'}
                className="text-xs"
              >
                {queueStatus?.processed_today || 0} processed today
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="embeddings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="embeddings">Embeddings</TabsTrigger>
          <TabsTrigger value="analytics">Query Analytics</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Embeddings Tab */}
        <TabsContent value="embeddings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Embedding Distribution</CardTitle>
              <CardDescription>Content indexed for semantic search by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {embeddingStats?.by_type &&
                  Object.entries(embeddingStats.by_type).map(([type, count]) => {
                    const Icon = contentTypeIcons[type] || FileText;
                    const percentage = Math.round((count / embeddingStats.total) * 100);

                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}

                {(!embeddingStats?.by_type || Object.keys(embeddingStats.by_type).length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No embeddings generated yet</p>
                    <p className="text-sm">Click "Generate Embeddings" to index your content</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Query Analytics</CardTitle>
                  <CardDescription>Recent RAG queries and their performance</CardDescription>
                </div>
                <Select value={analyticsTimeframe} onValueChange={setAnalyticsTimeframe}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24h</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {queryAnalytics.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Query</TableHead>
                        <TableHead className="text-center">Results</TableHead>
                        <TableHead className="text-center">Top Match</TableHead>
                        <TableHead className="text-center">Similarity</TableHead>
                        <TableHead className="text-center">Latency</TableHead>
                        <TableHead className="text-center">Helpful</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queryAnalytics.slice(0, 20).map(query => (
                        <TableRow key={query.id}>
                          <TableCell className="max-w-xs truncate">{query.query_text}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{query.results_count}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {query.top_result_type ? (
                              <Badge variant="outline" className="capitalize">
                                {query.top_result_type.replace('_', ' ')}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {query.top_result_similarity
                              ? `${(query.top_result_similarity * 100).toFixed(0)}%`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={
                                query.search_latency_ms < 100
                                  ? 'text-green-600'
                                  : query.search_latency_ms < 500
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                              }
                            >
                              {query.search_latency_ms}ms
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {query.was_helpful === true ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                            ) : query.was_helpful === false ? (
                              <AlertCircle className="h-4 w-4 text-red-500 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No query data available</p>
                  <p className="text-sm">Analytics will appear once users start using RAG chat</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Summary */}
          {queryAnalytics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Queries</p>
                  <p className="text-2xl font-bold">{queryAnalytics.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  <p className="text-2xl font-bold">{avgTotalLatency}ms</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Avg Results</p>
                  <p className="text-2xl font-bold">{avgResultCount}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Embeddings</CardTitle>
              <CardDescription>
                Index content for semantic search. This uses the OpenAI Embeddings API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Content</SelectItem>
                    <SelectItem value="course">Courses</SelectItem>
                    <SelectItem value="blog_post">Blog Posts</SelectItem>
                    <SelectItem value="faq">FAQs</SelectItem>
                    <SelectItem value="learning_path">Learning Paths</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleGenerateEmbeddings} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Generate Embeddings
                    </>
                  )}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>Note:</strong> This will generate embeddings for all{' '}
                  {selectedContentType === 'all'
                    ? 'content'
                    : selectedContentType.replace('_', ' ')}{' '}
                  that doesn't already have embeddings.
                </p>
                <p className="mt-1">
                  Estimated cost: ~$0.02 per 1M tokens (typically &lt;$1 for full reindex)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Queue Management */}
          <Card>
            <CardHeader>
              <CardTitle>Update Queue</CardTitle>
              <CardDescription>
                Content changes are automatically queued for embedding updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{queueStatus?.pending || 0}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{queueStatus?.processed_today || 0}</p>
                  <p className="text-sm text-muted-foreground">Processed Today</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-red-500">
                    {queueStatus?.errors_today || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Errors Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RAGDashboard;
