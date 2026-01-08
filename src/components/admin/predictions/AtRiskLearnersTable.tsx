/**
 * At-Risk Learners Table
 *
 * Displays learners identified as at-risk with actionable insights
 */

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertTriangle, MoreVertical, Mail, Phone, UserPlus } from 'lucide-react';
import { useAtRiskLearners } from '@/hooks/admin/useAtRiskLearners';
import { cn } from '@/lib/utils';

const riskLevelColors = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export function AtRiskLearnersTable() {
  const { learners, isLoading } = useAtRiskLearners();
  const [filter, setFilter] = useState<'all' | 'critical' | 'high'>('all');

  const filteredLearners = learners?.filter(learner => {
    if (filter === 'all') return true;
    return learner.severity === filter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading at-risk learners...</div>
      </div>
    );
  }

  if (!filteredLearners || filteredLearners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500">No at-risk learners found</p>
        <p className="text-sm text-gray-400 mt-1">
          All learners are on track or no predictions have been generated yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({learners?.length || 0})
        </Button>
        <Button
          variant={filter === 'critical' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('critical')}
        >
          Critical ({learners?.filter(l => l.severity === 'critical').length || 0})
        </Button>
        <Button
          variant={filter === 'high' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('high')}
        >
          High ({learners?.filter(l => l.severity === 'high').length || 0})
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Learner</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Risk Factors</TableHead>
              <TableHead>Dropout Probability</TableHead>
              <TableHead>Days Since Alert</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLearners.map(learner => (
              <TableRow key={learner.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{learner.display_name || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{learner.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{learner.course_title || 'N/A'}</div>
                </TableCell>
                <TableCell>
                  <Badge className={cn(riskLevelColors[learner.risk_level])}>
                    {learner.risk_level?.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-semibold text-red-600">
                      {learner.risk_score?.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500">/100</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {learner.contributing_factors?.slice(0, 3).map((factor, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {factor.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                    {learner.contributing_factors?.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{learner.contributing_factors.length - 3} more
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium text-red-600">
                    {learner.dropout_probability?.toFixed(1)}%
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{Math.floor(learner.days_since_alert || 0)} days</div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Phone className="h-4 w-4 mr-2" />
                        Schedule Call
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign Mentor
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
