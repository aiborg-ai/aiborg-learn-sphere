import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ArrowUp, ArrowDown, Minus, Info } from 'lucide-react';
import type { Benchmark } from '../types';

interface PeerComparisonTabProps {
  benchmarks: Benchmark[];
  audienceType?: string;
}

export function PeerComparisonTab({ benchmarks, audienceType }: PeerComparisonTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How You Compare</CardTitle>
        <CardDescription>
          Your performance compared to other {audienceType || 'users'} on the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {benchmarks.length > 0 ? (
          <div className="space-y-6">
            {benchmarks.map((benchmark, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{benchmark.category_name}</span>
                  <div className="flex items-center gap-2">
                    {benchmark.user_score > benchmark.average_score ? (
                      <ArrowUp className="h-4 w-4 text-green-500" />
                    ) : benchmark.user_score < benchmark.average_score ? (
                      <ArrowDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <Minus className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="text-sm font-medium">
                      {benchmark.user_score > benchmark.average_score ? '+' : ''}
                      {Math.round(benchmark.user_score - benchmark.average_score)}%
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">You</div>
                    <Progress value={benchmark.user_score} className="h-2" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Average</div>
                    <Progress value={benchmark.average_score} className="h-2" />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  You're in the top {100 - benchmark.percentile}% for this category
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Peer comparison data is being calculated. Check back later!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
