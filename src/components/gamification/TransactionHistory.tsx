/**
 * Transaction History Component
 * Shows recent point transactions with details
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Award,
  TrendingUp,
  Zap,
  BookOpen,
  Users,
  Trophy,
  Star,
  ArrowUp,
  ArrowDown,
} from '@/components/ui/icons';
import type { PointTransaction } from '@/services/gamification';

interface TransactionHistoryProps {
  transactions: PointTransaction[];
  showTitle?: boolean;
  maxHeight?: string;
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  assessment_question: <BookOpen className="h-4 w-4" />,
  assessment_completed: <Trophy className="h-4 w-4" />,
  achievement_unlocked: <Star className="h-4 w-4" />,
  streak_bonus: <Zap className="h-4 w-4" />,
  social_share: <Users className="h-4 w-4" />,
  daily_login: <TrendingUp className="h-4 w-4" />,
};

const SOURCE_COLORS: Record<string, string> = {
  assessment_question: 'text-blue-600 bg-blue-50 border-blue-200',
  assessment_completed: 'text-purple-600 bg-purple-50 border-purple-200',
  achievement_unlocked: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  streak_bonus: 'text-orange-600 bg-orange-50 border-orange-200',
  social_share: 'text-green-600 bg-green-50 border-green-200',
  daily_login: 'text-cyan-600 bg-cyan-50 border-cyan-200',
};

export function TransactionHistory({
  transactions,
  showTitle = true,
  maxHeight = '500px',
}: TransactionHistoryProps) {
  const getSourceLabel = (source: string) => {
    return source
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (transactions.length === 0) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your point transactions will appear here</CardDescription>
          </CardHeader>
        )}
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No transactions yet</p>
            <p className="text-sm mt-1">Complete assessments to earn points!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest point transactions</CardDescription>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <ScrollArea style={{ maxHeight }}>
          <div className="divide-y divide-gray-200">
            {transactions.map(transaction => {
              const sourceColor =
                SOURCE_COLORS[transaction.source] || 'text-gray-600 bg-gray-50 border-gray-200';
              const sourceIcon = SOURCE_ICONS[transaction.source] || <Award className="h-4 w-4" />;

              return (
                <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg border ${sourceColor} flex-shrink-0`}>
                      {sourceIcon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {getSourceLabel(transaction.source)}
                        </h4>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {transaction.amount > 0 ? (
                            <ArrowUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-red-600" />
                          )}
                          <span
                            className={`font-bold ${
                              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {transaction.amount > 0 ? '+' : ''}
                            {transaction.amount}
                          </span>
                        </div>
                      </div>

                      {transaction.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {transaction.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500">
                          {formatDate(transaction.created_at)}
                        </span>

                        {transaction.multiplier && transaction.multiplier > 1 && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Zap className="h-3 w-3" />
                            {transaction.multiplier}x multiplier
                          </Badge>
                        )}

                        {transaction.metadata && transaction.metadata.difficulty && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {transaction.metadata.difficulty}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
