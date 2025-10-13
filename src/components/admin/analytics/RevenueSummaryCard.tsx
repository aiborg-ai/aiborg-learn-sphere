import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from './utils';
import type { RevenueMetrics } from './types';

interface RevenueSummaryCardProps {
  data: RevenueMetrics | null;
}

export function RevenueSummaryCard({ data }: RevenueSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Summary</CardTitle>
        <CardDescription>Comprehensive revenue metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(data?.total || 0)}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold">{data?.transactions || 0}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {data?.transactions && data.transactions > 0
                ? formatPercentage(((data?.successfulTransactions || 0) / data.transactions) * 100)
                : '0%'}
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Avg Transaction</p>
            <p className="text-2xl font-bold">
              {formatCurrency(data?.averageTransactionValue || 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
