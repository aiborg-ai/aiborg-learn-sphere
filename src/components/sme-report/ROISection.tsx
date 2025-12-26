/**
 * ROISection Component
 *
 * Displays ROI analysis with metrics dashboard and visualizations
 * Shows summary metrics, cost breakdown, benefit breakdown, and charts
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp, Calendar, Target } from 'lucide-react';
import type {
  SMEROISummary,
  SMEROICostBreakdown,
  SMEROIBenefitBreakdown,
} from '@/types/aiAssessment';

interface ROISectionProps {
  roiSummary?: SMEROISummary;
  roiCosts?: SMEROICostBreakdown[];
  roiBenefits?: SMEROIBenefitBreakdown[];
}

export function ROISection({ roiSummary, roiCosts = [], roiBenefits = [] }: ROISectionProps) {
  // If no ROI data, show placeholder
  if (!roiSummary) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">ROI Analysis</h2>
          <p className="text-muted-foreground">
            ROI calculation in progress. Please refresh the page in a moment.
          </p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const totalAnnualCost = roiCosts.reduce((sum, c) => sum + c.annual_cost_usd, 0);

  const chartData = [
    {
      name: 'Year 1',
      cost: roiSummary.total_investment_usd,
      benefit: roiSummary.total_annual_benefit_usd,
    },
    {
      name: 'Year 2',
      cost: totalAnnualCost,
      benefit: roiSummary.total_annual_benefit_usd,
    },
    {
      name: 'Year 3',
      cost: totalAnnualCost,
      benefit: roiSummary.total_annual_benefit_usd,
    },
  ];

  return (
    <section className="space-y-6" aria-labelledby="roi-heading">
      <div>
        <h2 id="roi-heading" className="text-2xl font-bold mb-2">
          ROI Analysis
        </h2>
        <p className="text-muted-foreground">Quantified business value and investment breakdown</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-6 w-6 text-blue-600" />
            <p className="text-sm text-muted-foreground">Total Investment</p>
          </div>
          <p className="text-3xl font-bold text-blue-900">
            ${roiSummary.total_investment_usd.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <p className="text-sm text-muted-foreground">Annual Benefit</p>
          </div>
          <p className="text-3xl font-bold text-green-900">
            ${roiSummary.total_annual_benefit_usd.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-6 w-6 text-orange-600" />
            <p className="text-sm text-muted-foreground">Payback Period</p>
          </div>
          <p className="text-3xl font-bold text-orange-900">{roiSummary.payback_months} months</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-6 w-6 text-purple-600" />
            <p className="text-sm text-muted-foreground">3-Year ROI</p>
          </div>
          <p className="text-3xl font-bold text-purple-900">
            {roiSummary.three_year_roi_percent.toFixed(0)}%
          </p>
        </Card>
      </div>

      {/* Cost vs Benefit Chart */}
      <Card className="p-6">
        <h3 id="cost-benefit-chart" className="text-xl font-bold mb-4">
          Cost vs Benefit Breakdown
        </h3>
        <div role="img" aria-labelledby="cost-benefit-chart" aria-describedby="chart-description">
          <p id="chart-description" className="sr-only">
            Bar chart showing costs and benefits over 3 years. Year 1 includes total investment of $
            {roiSummary.total_investment_usd.toLocaleString()} versus annual benefit of $
            {roiSummary.total_annual_benefit_usd.toLocaleString()}. Years 2 and 3 show annual costs
            versus annual benefits.
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={value => `$${Number(value).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="cost" fill="#ef4444" name="Cost" />
              <Bar dataKey="benefit" fill="#10b981" name="Benefit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Cost Breakdown */}
      {roiCosts.length > 0 && (
        <Card className="p-6">
          <h3 id="cost-breakdown-heading" className="text-xl font-bold mb-4">
            Cost Breakdown
          </h3>
          <dl className="space-y-3" aria-labelledby="cost-breakdown-heading">
            {roiCosts.map(cost => (
              <div
                key={cost.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1">
                  <dt className="font-semibold">{cost.item_name}</dt>
                  <dd className="text-sm text-muted-foreground">
                    {cost.category.replace(/_/g, ' ')}
                  </dd>
                  {cost.notes && (
                    <dd className="text-xs text-muted-foreground mt-1">{cost.notes}</dd>
                  )}
                </div>
                <dd className="text-right">
                  {cost.one_time_cost_usd > 0 && (
                    <p className="text-sm">
                      One-time:{' '}
                      <span className="font-semibold">
                        ${cost.one_time_cost_usd.toLocaleString()}
                      </span>
                    </p>
                  )}
                  {cost.annual_cost_usd > 0 && (
                    <p className="text-sm">
                      Annual:{' '}
                      <span className="font-semibold">
                        ${cost.annual_cost_usd.toLocaleString()}
                      </span>
                    </p>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {/* Benefit Breakdown */}
      {roiBenefits.length > 0 && (
        <Card className="p-6">
          <h3 id="benefit-breakdown-heading" className="text-xl font-bold mb-4">
            Benefit Breakdown
          </h3>
          <dl className="space-y-3" aria-labelledby="benefit-breakdown-heading">
            {roiBenefits.map(benefit => (
              <div
                key={benefit.id}
                className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <dt className="font-semibold">{benefit.benefit_name}</dt>
                    <Badge
                      variant={
                        benefit.confidence_level === 'high'
                          ? 'default'
                          : benefit.confidence_level === 'medium'
                            ? 'secondary'
                            : 'outline'
                      }
                      aria-label={`Confidence level: ${benefit.confidence_level}`}
                    >
                      {benefit.confidence_level} confidence
                    </Badge>
                  </div>
                  <dd className="text-sm text-muted-foreground">
                    {benefit.category.replace(/_/g, ' ')}
                  </dd>
                  {benefit.assumptions && benefit.assumptions.length > 0 && (
                    <dd>
                      <ul className="mt-2 space-y-1" aria-label="Assumptions">
                        {benefit.assumptions.map((assumption, i) => (
                          <li key={i} className="text-xs text-muted-foreground">
                            • {assumption}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  )}
                </div>
                <dd className="text-right">
                  <p className="text-lg font-bold text-green-700">
                    ${benefit.annual_value_usd.toLocaleString()}/year
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {/* Risk Adjusted ROI */}
      {roiSummary.risk_adjusted_roi_percent !== undefined &&
        roiSummary.risk_adjusted_roi_percent !== null && (
          <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                <Target className="h-6 w-6 text-amber-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Risk-Adjusted ROI</h3>
                <p className="text-muted-foreground mb-3">
                  We've applied a conservative 70% confidence factor to account for implementation
                  risks and market uncertainties.
                </p>
                <p className="text-3xl font-bold text-amber-900">
                  {roiSummary.risk_adjusted_roi_percent.toFixed(0)}%
                </p>
                {roiSummary.net_present_value_usd !== undefined &&
                  roiSummary.net_present_value_usd !== null && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Net Present Value: ${roiSummary.net_present_value_usd.toLocaleString()}
                    </p>
                  )}
              </div>
            </div>
          </Card>
        )}
    </section>
  );
}
