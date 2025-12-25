/**
 * BenchmarkingTable Component
 * Displays peer comparison data for skills benchmarking
 * Columns: Skill, Your Score, Peer Average, Percentile, Standing
 */

import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from '@/components/ui/icons';
import type { SkillBenchmark } from '@/types/skillsAssessment';

interface BenchmarkingTableProps {
  benchmarks: SkillBenchmark[];
  showTopSkills?: boolean;
  maxRows?: number;
}

export function BenchmarkingTable({
  benchmarks,
  showTopSkills = false,
  maxRows = 10,
}: BenchmarkingTableProps) {
  if (benchmarks.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Peer Benchmarking</h2>
          <p className="text-muted-foreground">Compare your skills with industry peers</p>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Benchmarking data not available yet. Complete more assessments to enable peer
            comparison.
          </p>
        </div>
      </div>
    );
  }

  // Sort benchmarks by percentile (descending) if showing top skills
  // Otherwise, sort by variance from peer average (absolute delta)
  const sortedBenchmarks = [...benchmarks].sort((a, b) => {
    if (showTopSkills) {
      return b.percentile - a.percentile;
    }
    const deltaA = Math.abs(a.user_score - a.peer_average);
    const deltaB = Math.abs(b.user_score - b.peer_average);
    return deltaB - deltaA;
  });

  // Limit rows if specified
  const displayBenchmarks = sortedBenchmarks.slice(0, maxRows);

  // Get percentile standing badge
  const getPercentileStanding = (percentile: number) => {
    if (percentile >= 75) {
      return { variant: 'default' as const, text: 'Top 25%', color: 'text-green-600' };
    }
    if (percentile >= 50) {
      return { variant: 'secondary' as const, text: 'Above Avg', color: 'text-blue-600' };
    }
    if (percentile >= 25) {
      return { variant: 'outline' as const, text: 'Average', color: 'text-muted-foreground' };
    }
    return { variant: 'outline' as const, text: 'Below Avg', color: 'text-orange-600' };
  };

  // Get delta display
  const getDeltaDisplay = (userScore: number, peerAverage: number) => {
    const delta = userScore - peerAverage;
    if (delta > 0) {
      return (
        <div className="flex items-center justify-center gap-1 text-green-600 print:text-black">
          <TrendingUp className="h-4 w-4 print:text-black" />
          <span className="font-semibold">+{delta.toFixed(0)}%</span>
        </div>
      );
    }
    if (delta < 0) {
      return (
        <div className="flex items-center justify-center gap-1 text-red-600 print:text-black">
          <TrendingDown className="h-4 w-4 print:text-black" />
          <span className="font-semibold">{delta.toFixed(0)}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center gap-1 text-muted-foreground print:text-black">
        <Minus className="h-4 w-4 print:text-black" />
        <span>0%</span>
      </div>
    );
  };

  // Calculate summary stats
  const avgPercentile = Math.round(
    benchmarks.reduce((sum, b) => sum + b.percentile, 0) / benchmarks.length
  );
  const topQuartileCount = benchmarks.filter(b => b.percentile >= 75).length;
  const aboveAverageCount = benchmarks.filter(b => b.user_score > b.peer_average).length;

  return (
    <div className="space-y-4 print:break-inside-avoid">
      <div>
        <h2 className="text-2xl font-bold mb-2 print:text-xl">Peer Benchmarking</h2>
        <p className="text-muted-foreground print:text-black print:text-sm">
          {showTopSkills
            ? `Your top ${displayBenchmarks.length} skills by percentile ranking`
            : `Compare your skills with industry peers (${displayBenchmarks.length} skills)`}
        </p>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse border border-border print:border-black print:text-sm">
          <thead>
            <tr className="bg-muted print:bg-gray-200">
              <th className="border border-border px-4 py-2 text-left font-semibold print:border-black print:px-3 print:py-1.5">
                Skill
              </th>
              <th className="border border-border px-4 py-2 text-center font-semibold print:border-black print:px-3 print:py-1.5">
                Your Score
              </th>
              <th className="border border-border px-4 py-2 text-center font-semibold print:border-black print:px-3 print:py-1.5">
                Peer Avg
              </th>
              <th className="border border-border px-4 py-2 text-center font-semibold print:border-black print:px-3 print:py-1.5">
                Delta
              </th>
              <th className="border border-border px-4 py-2 text-center font-semibold print:border-black print:px-3 print:py-1.5">
                Percentile
              </th>
              <th className="border border-border px-4 py-2 text-center font-semibold print:border-black print:px-3 print:py-1.5">
                Standing
              </th>
            </tr>
          </thead>
          <tbody>
            {displayBenchmarks.map((benchmark, index) => {
              const standing = getPercentileStanding(benchmark.percentile);

              return (
                <tr
                  key={benchmark.skill_id}
                  className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30 print:bg-gray-50'}
                >
                  <td className="border border-border px-4 py-2 font-medium print:border-black print:px-3 print:py-1.5 print:text-sm">
                    {benchmark.skill_name}
                  </td>
                  <td className="border border-border px-4 py-2 text-center font-semibold print:border-black print:px-3 print:py-1.5">
                    {benchmark.user_score}%
                  </td>
                  <td className="border border-border px-4 py-2 text-center text-muted-foreground print:border-black print:px-3 print:py-1.5 print:text-black">
                    {benchmark.peer_average.toFixed(0)}%
                  </td>
                  <td className="border border-border px-4 py-2 print:border-black print:px-3 print:py-1.5">
                    {getDeltaDisplay(benchmark.user_score, benchmark.peer_average)}
                  </td>
                  <td
                    className={`border border-border px-4 py-2 text-center font-semibold ${standing.color} print:border-black print:text-black`}
                  >
                    {benchmark.percentile}th
                  </td>
                  <td className="border border-border px-4 py-2 text-center print:border-black print:px-3 print:py-1.5">
                    <Badge
                      variant={standing.variant}
                      className="print:border-black print:bg-white print:text-black print:text-xs"
                    >
                      {standing.text}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Benchmarking Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-muted/50 rounded-lg print:bg-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{topQuartileCount}</div>
          <div className="text-sm text-muted-foreground">Top 25% Skills</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{aboveAverageCount}</div>
          <div className="text-sm text-muted-foreground">Above Peer Avg</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{avgPercentile}th</div>
          <div className="text-sm text-muted-foreground">Avg Percentile</div>
        </div>
      </div>
    </div>
  );
}
