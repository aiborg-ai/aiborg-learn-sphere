/**
 * ChurnPredictionCard Component
 *
 * AI-powered churn prediction visualization
 * Shows users at risk of churning with actionable insights
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  TrendingDown,
  Mail,
  Clock,
  Activity,
  ChevronRight,
  Sparkles,
} from '@/components/ui/icons';

interface ChurnRiskUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  riskScore: number; // 0-100
  lastActive: string; // ISO date
  enrolledCourses: number;
  completedCourses: number;
  riskFactors: string[];
  predictedChurnDate?: string;
  recommendedAction: string;
}

interface ChurnPredictionCardProps {
  users: ChurnRiskUser[];
  isLoading?: boolean;
  totalUsers?: number;
  onContactUser?: (userId: string) => void;
  onViewDetails?: (userId: string) => void;
}

function getRiskLevel(score: number): {
  label: string;
  color: string;
  variant: 'default' | 'destructive' | 'secondary';
} {
  if (score >= 80) return { label: 'Critical', color: 'text-red-500', variant: 'destructive' };
  if (score >= 60) return { label: 'High', color: 'text-orange-500', variant: 'default' };
  if (score >= 40) return { label: 'Medium', color: 'text-yellow-500', variant: 'secondary' };
  return { label: 'Low', color: 'text-green-500', variant: 'secondary' };
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
}

export function ChurnPredictionCard({
  users,
  isLoading = false,
  totalUsers = 0,
  onContactUser,
  onViewDetails,
}: ChurnPredictionCardProps) {
  const atRiskCount = users.length;
  const criticalCount = users.filter(u => u.riskScore >= 80).length;
  const highRiskCount = users.filter(u => u.riskScore >= 60 && u.riskScore < 80).length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Churn Prediction
            </CardTitle>
            <CardDescription>AI-powered risk analysis</CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {atRiskCount} at risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-red-500/10">
            <div className="text-2xl font-bold text-red-500">{criticalCount}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-orange-500/10">
            <div className="text-2xl font-bold text-orange-500">{highRiskCount}</div>
            <div className="text-xs text-muted-foreground">High Risk</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="text-2xl font-bold">
              {totalUsers > 0 ? ((atRiskCount / totalUsers) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">At Risk Rate</div>
          </div>
        </div>

        {/* User list */}
        <div className="space-y-3">
          {users.slice(0, 5).map(user => {
            const risk = getRiskLevel(user.riskScore);

            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {user.name}
                      <Badge variant={risk.variant} className="text-xs">
                        {risk.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(user.lastActive)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {user.completedCourses}/{user.enrolledCourses} courses
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Risk score bar */}
                  <div className="w-16">
                    <Progress value={user.riskScore} className="h-2" />
                    <div className={`text-xs text-center mt-1 font-medium ${risk.color}`}>
                      {user.riskScore}%
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    {onContactUser && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onContactUser(user.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                    {onViewDetails && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(user.id)}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {users.length > 5 && (
          <Button variant="outline" className="w-full mt-4" onClick={() => onViewDetails?.('all')}>
            View all {users.length} at-risk users
          </Button>
        )}

        {users.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingDown className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No users at risk of churning</p>
            <p className="text-sm">Great job maintaining engagement!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
