/**
 * Retention Curve Visualizer Component
 *
 * Displays personalized forgetting curves and retention predictions.
 * Shows exponential decay curves with review markers.
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TrendingDown,
  Timer,
} from '@/components/ui/icons';
import { ForgettingCurve } from '@/services/feedback-loop/FeedbackLoopTypes';
import { cn } from '@/lib/utils';

interface TopicRetention {
  topicId: string;
  topicName: string;
  currentRetention: number;
  lastReviewed: Date;
  nextReview: Date;
  forgettingCurve?: ForgettingCurve;
  dueForReview: boolean;
}

interface RetentionCurveVisualizerProps {
  data: TopicRetention[];
  selectedTopicId?: string;
  isLoading?: boolean;
  showOverallCurve?: boolean;
  reviewThreshold?: number;
  className?: string;
  onTopicSelect?: (topicId: string) => void;
  onReviewClick?: (topicId: string) => void;
}

export function RetentionCurveVisualizer({
  data,
  selectedTopicId,
  isLoading = false,
  showOverallCurve = true,
  reviewThreshold = 0.8,
  className,
  onTopicSelect,
  onReviewClick,
}: RetentionCurveVisualizerProps) {
  // Find selected topic or use first
  const selectedTopic = useMemo(() => {
    if (selectedTopicId) {
      return data.find(t => t.topicId === selectedTopicId);
    }
    return data[0];
  }, [data, selectedTopicId]);

  // Generate curve data points
  const curveData = useMemo(() => {
    if (!selectedTopic?.forgettingCurve) {
      // Generate default Ebbinghaus curve
      const decayConstant = 0.3; // Default decay
      return Array.from({ length: 31 }, (_, day) => ({
        day,
        retention: Math.exp(-decayConstant * day) * 100,
        threshold: reviewThreshold * 100,
      }));
    }

    const { decayConstant, initialStrength } = selectedTopic.forgettingCurve;
    return Array.from({ length: 31 }, (_, day) => ({
      day,
      retention: initialStrength * Math.exp(-decayConstant * day) * 100,
      threshold: reviewThreshold * 100,
    }));
  }, [selectedTopic, reviewThreshold]);

  // Calculate days until review needed
  const daysUntilReview = useMemo(() => {
    if (!selectedTopic) return null;

    const threshold = reviewThreshold;
    const decayConstant = selectedTopic.forgettingCurve?.decayConstant || 0.3;
    const initialStrength = selectedTopic.forgettingCurve?.initialStrength || 1;

    // R = S * e^(-k*t), solve for t: t = -ln(R/S) / k
    const days = -Math.log(threshold / initialStrength) / decayConstant;
    return Math.max(0, Math.ceil(days));
  }, [selectedTopic, reviewThreshold]);

  // Count topics due for review
  const dueCount = data.filter(t => t.dueForReview).length;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Retention Curves
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Retention Curves
          </CardTitle>
          <CardDescription>Track your memory retention over time</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingDown className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No retention data yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Complete flashcard reviews to build your forgetting curves
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Retention Curves
            </CardTitle>
            <CardDescription>
              {data.length} topic{data.length !== 1 ? 's' : ''} tracked
            </CardDescription>
          </div>
          {dueCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {dueCount} due for review
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {data.filter(t => t.currentRetention >= reviewThreshold).length}
            </p>
            <p className="text-xs text-muted-foreground">Well Retained</p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">
              {
                data.filter(t => t.currentRetention >= 0.5 && t.currentRetention < reviewThreshold)
                  .length
              }
            </p>
            <p className="text-xs text-muted-foreground">Fading</p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold text-red-600">
              {data.filter(t => t.currentRetention < 0.5).length}
            </p>
            <p className="text-xs text-muted-foreground">Needs Review</p>
          </div>
        </div>

        {/* Topic Selector */}
        <div className="flex flex-wrap gap-2">
          {data.map(topic => (
            <button
              key={topic.topicId}
              onClick={() => onTopicSelect?.(topic.topicId)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                selectedTopic?.topicId === topic.topicId
                  ? 'bg-primary text-primary-foreground'
                  : topic.dueForReview
                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 hover:bg-red-200'
                    : 'bg-secondary hover:bg-secondary/80'
              )}
            >
              {topic.topicName}
              <span className="ml-1 opacity-70">
                ({(topic.currentRetention * 100).toFixed(0)}%)
              </span>
            </button>
          ))}
        </div>

        {/* Selected Topic Details */}
        {selectedTopic && (
          <div className="p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium">{selectedTopic.topicName}</h4>
                <p className="text-xs text-muted-foreground">
                  Last reviewed: {selectedTopic.lastReviewed.toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    'text-2xl font-bold',
                    selectedTopic.currentRetention >= reviewThreshold
                      ? 'text-green-600'
                      : selectedTopic.currentRetention >= 0.5
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  )}
                >
                  {(selectedTopic.currentRetention * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Current Retention</p>
              </div>
            </div>

            {/* Retention Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Retention Level</span>
                <span>{(selectedTopic.currentRetention * 100).toFixed(0)}%</span>
              </div>
              <div className="relative h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-500',
                    selectedTopic.currentRetention >= reviewThreshold
                      ? 'bg-green-500'
                      : selectedTopic.currentRetention >= 0.5
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  )}
                  style={{ width: `${selectedTopic.currentRetention * 100}%` }}
                />
                {/* Threshold marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary"
                  style={{ left: `${reviewThreshold * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0%</span>
                <span>Threshold ({(reviewThreshold * 100).toFixed(0)}%)</span>
                <span>100%</span>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex items-center gap-3">
              {daysUntilReview !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {daysUntilReview === 0
                      ? 'Review now!'
                      : `Review in ${daysUntilReview} day${daysUntilReview !== 1 ? 's' : ''}`}
                  </span>
                </div>
              )}
              {selectedTopic.dueForReview && onReviewClick && (
                <button
                  onClick={() => onReviewClick(selectedTopic.topicId)}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                >
                  <RefreshCw className="h-4 w-4" />
                  Review Now
                </button>
              )}
            </div>
          </div>
        )}

        {/* Forgetting Curve Chart */}
        {showOverallCurve && (
          <div className="p-4 border rounded-lg">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
              <TrendingDown className="h-4 w-4" />
              Forgetting Curve
              {selectedTopic && (
                <span className="text-muted-foreground font-normal">
                  - {selectedTopic.topicName}
                </span>
              )}
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={curveData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  tickFormatter={value => `Day ${value}`}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  tickFormatter={value => `${value}%`}
                />

                {/* Danger zone */}
                <ReferenceArea y1={0} y2={reviewThreshold * 100} fill="#fecaca" fillOpacity={0.3} />

                {/* Threshold line */}
                <ReferenceLine
                  y={reviewThreshold * 100}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label={{
                    value: 'Review Threshold',
                    position: 'insideTopLeft',
                    fontSize: 10,
                    fill: '#ef4444',
                  }}
                />

                {/* Retention curve */}
                <Area
                  type="monotone"
                  dataKey="retention"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#retentionGradient)"
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload[0]) return null;
                    const data = payload[0].payload;
                    const isAboveThreshold = data.retention >= data.threshold;

                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-xl text-sm">
                        <p className="font-medium mb-1">Day {data.day}</p>
                        <div className="flex items-center gap-2">
                          {isAboveThreshold ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <span className={isAboveThreshold ? 'text-green-600' : 'text-red-600'}>
                            {data.retention.toFixed(1)}% retention
                          </span>
                        </div>
                        {!isAboveThreshold && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Below review threshold
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="mt-4 p-3 rounded bg-muted/50 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <strong>Ebbinghaus Forgetting Curve:</strong> Memory decays exponentially without
                review. Regular spaced repetition resets this curve, improving long-term retention.
              </p>
            </div>
          </div>
        )}

        {/* Due for Review List */}
        {dueCount > 0 && (
          <div className="p-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Topics Due for Review
            </h4>
            <div className="space-y-2">
              {data
                .filter(t => t.dueForReview)
                .slice(0, 5)
                .map(topic => (
                  <div
                    key={topic.topicId}
                    className="flex items-center justify-between p-2 rounded bg-white dark:bg-gray-900/50"
                  >
                    <span className="text-sm">{topic.topicName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600">
                        {(topic.currentRetention * 100).toFixed(0)}%
                      </span>
                      {onReviewClick && (
                        <button
                          onClick={() => onReviewClick(topic.topicId)}
                          className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RetentionCurveVisualizer;
