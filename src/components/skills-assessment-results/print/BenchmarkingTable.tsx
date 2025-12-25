/**
 * BenchmarkingTable Component
 *
 * Print-optimized peer comparison table
 * Shows: Skill, Your Score, Peer Average, Percentile, Standing
 */

import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from '@/components/ui/icons';

interface SkillBenchmark {
  skill_id: string;
  user_score: number;
  peer_average: number;
  percentile: number;
  skill_name?: string;
}

interface BenchmarkingTableProps {
  benchmarks: SkillBenchmark[];
  showTopSkills?: boolean;
  maxRows?: number;
}

function getPercentileBadge(percentile: number) {
  if (percentile >= 75) {
    return { label: 'Top 25%', className: 'bg-green-200 text-green-900 border-green-900' };
  } else if (percentile >= 50) {
    return { label: 'Above Avg', className: 'bg-blue-200 text-blue-900 border-blue-900' };
  } else if (percentile >= 25) {
    return { label: 'Average', className: 'bg-yellow-200 text-yellow-900 border-yellow-900' };
  } else {
    return { label: 'Below Avg', className: 'bg-orange-200 text-orange-900 border-orange-900' };
  }
}

function getStandingIcon(userScore: number, peerAverage: number) {
  const diff = userScore - peerAverage;
  if (diff > 5) {
    return <TrendingUp className="h-4 w-4 text-green-600 print:text-black" />;
  } else if (diff < -5) {
    return <TrendingDown className="h-4 w-4 text-red-600 print:text-black" />;
  } else {
    return <Minus className="h-4 w-4 text-gray-400 print:text-black" />;
  }
}

export function BenchmarkingTable({
  benchmarks,
  showTopSkills = true,
  maxRows = 10,
}: BenchmarkingTableProps) {
  if (!benchmarks || benchmarks.length === 0) {
    return (
      <div className="print:block">
        <h2 className="text-2xl font-bold mb-4 print:text-black print:border-b-2 print:border-black print:pb-2">
          Peer Benchmarking
        </h2>
        <p className="text-muted-foreground print:text-gray-700">
          No benchmarking data available. Complete more assessments to compare with peers.
        </p>
      </div>
    );
  }

  // Sort by percentile (highest first) if showTopSkills, otherwise by skill name
  const sortedBenchmarks = [...benchmarks].sort((a, b) => {
    if (showTopSkills) {
      return b.percentile - a.percentile;
    }
    return (a.skill_name || '').localeCompare(b.skill_name || '');
  });

  // Limit number of rows if specified
  const displayBenchmarks = maxRows ? sortedBenchmarks.slice(0, maxRows) : sortedBenchmarks;

  const avgPercentile = benchmarks.reduce((sum, b) => sum + b.percentile, 0) / benchmarks.length;
  const topPerformerCount = benchmarks.filter(b => b.percentile >= 75).length;
  const aboveAverageCount = benchmarks.filter(b => b.user_score > b.peer_average).length;

  return (
    <div className="print:block">
      <h2 className="text-2xl font-bold mb-4 print:text-black print:border-b-2 print:border-black print:pb-2">
        Peer Benchmarking
      </h2>
      <p className="text-sm text-muted-foreground mb-4 print:text-gray-700 print:mb-6">
        {showTopSkills
          ? `Top ${displayBenchmarks.length} skills compared with industry peers`
          : `${displayBenchmarks.length} skills compared with industry peers`}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse print:border-2 print:border-black">
          <thead>
            <tr className="bg-muted print:bg-gray-200">
              <th className="text-left p-3 font-semibold border print:border-black print:text-black">
                #
              </th>
              <th className="text-left p-3 font-semibold border print:border-black print:text-black">
                Skill
              </th>
              <th className="text-center p-3 font-semibold border print:border-black print:text-black">
                Your Score
              </th>
              <th className="text-center p-3 font-semibold border print:border-black print:text-black">
                Peer Avg
              </th>
              <th className="text-center p-3 font-semibold border print:border-black print:text-black">
                Difference
              </th>
              <th className="text-center p-3 font-semibold border print:border-black print:text-black">
                Percentile
              </th>
              <th className="text-center p-3 font-semibold border print:border-black print:text-black">
                Standing
              </th>
            </tr>
          </thead>
          <tbody>
            {displayBenchmarks.map((benchmark, index) => {
              const percentileBadge = getPercentileBadge(benchmark.percentile);
              const diff = benchmark.user_score - benchmark.peer_average;

              return (
                <tr
                  key={benchmark.skill_id}
                  className="hover:bg-muted/50 print:hover:bg-transparent"
                >
                  <td className="p-3 border print:border-black print:text-black">{index + 1}</td>
                  <td className="p-3 border print:border-black print:text-black font-medium">
                    {benchmark.skill_name || 'Unknown Skill'}
                  </td>
                  <td className="p-3 border print:border-black text-center print:text-black font-semibold">
                    {benchmark.user_score.toFixed(0)}%
                  </td>
                  <td className="p-3 border print:border-black text-center print:text-black">
                    {benchmark.peer_average.toFixed(0)}%
                  </td>
                  <td className="p-3 border print:border-black text-center print:text-black">
                    <span
                      className={
                        diff > 0
                          ? 'text-green-600 print:text-black'
                          : diff < 0
                            ? 'text-red-600 print:text-black'
                            : 'text-gray-500 print:text-black'
                      }
                    >
                      {diff > 0 ? '+' : ''}
                      {diff.toFixed(0)}%
                    </span>
                  </td>
                  <td className="p-3 border print:border-black text-center">
                    <Badge className={`print:border ${percentileBadge.className}`}>
                      {percentileBadge.label}
                    </Badge>
                  </td>
                  <td className="p-3 border print:border-black text-center">
                    {getStandingIcon(benchmark.user_score, benchmark.peer_average)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 print:grid-cols-3 print:mt-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg print:bg-white print:border print:border-black">
          <div className="text-2xl font-bold text-blue-600 print:text-black">
            {avgPercentile.toFixed(0)}th
          </div>
          <div className="text-xs text-muted-foreground print:text-gray-700">Avg Percentile</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg print:bg-white print:border print:border-black">
          <div className="text-2xl font-bold text-green-600 print:text-black">
            {topPerformerCount}
          </div>
          <div className="text-xs text-muted-foreground print:text-gray-700">Top 25% Skills</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg print:bg-white print:border print:border-black">
          <div className="text-2xl font-bold text-purple-600 print:text-black">
            {aboveAverageCount}/{benchmarks.length}
          </div>
          <div className="text-xs text-muted-foreground print:text-gray-700">Above Average</div>
        </div>
      </div>

      {showTopSkills && benchmarks.length > maxRows && (
        <p className="text-xs text-muted-foreground mt-4 print:text-gray-700 print:mt-6">
          Showing top {maxRows} of {benchmarks.length} skills
        </p>
      )}
    </div>
  );
}
