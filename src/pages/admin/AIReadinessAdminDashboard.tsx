// ============================================================================
// AI-Readiness Admin Dashboard
// Comprehensive admin view with analytics, filters, and benchmark management
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAdminAllAssessments,
  useAssessmentStatistics,
  type AdminAssessmentsFilters,
} from '@/hooks/useAIReadinessAssessment';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle,
  FileText,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function AIReadinessAdminDashboard() {
  const navigate = useNavigate();

  // Filters state
  const [filters, setFilters] = useState<AdminAssessmentsFilters>({
    status: undefined,
    industry: undefined,
    companySize: undefined,
    maturityLevel: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    limit: 10,
    offset: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);

  // Fetch data
  const { data: assessmentsData, isLoading: assessmentsLoading } = useAdminAllAssessments(filters);
  const { data: stats, isLoading: statsLoading } = useAssessmentStatistics(filters);

  const assessments = assessmentsData?.assessments || [];
  const totalCount = assessmentsData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / (filters.limit || 10));

  // Filter handlers
  const updateFilter = <K extends keyof AdminAssessmentsFilters>(
    key: K,
    value: AdminAssessmentsFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      status: undefined,
      industry: undefined,
      companySize: undefined,
      maturityLevel: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      limit: 10,
      offset: 0,
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters(prev => ({
      ...prev,
      offset: (page - 1) * (filters.limit || 10),
    }));
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-emerald-500',
      draft: 'bg-amber-500',
      in_progress: 'bg-blue-500',
    };
    return variants[status as keyof typeof variants] || 'bg-gray-500';
  };

  const getMaturityBadge = (level: string) => {
    const variants = {
      awareness: 'bg-rose-500',
      experimenting: 'bg-amber-500',
      adopting: 'bg-blue-500',
      optimizing: 'bg-emerald-500',
      leading: 'bg-violet-500',
    };
    return variants[level as keyof typeof variants] || 'bg-gray-500';
  };

  const formatDuration = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return '< 1h';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">AI-Readiness Admin Dashboard</h1>
            <p className="text-slate-600 mt-2">
              Comprehensive analytics and management for all assessments
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Admin
          </Button>
        </div>

        {/* Statistics Overview */}
        {statsLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Assessments */}
            <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Total Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats?.totalAssessments}</div>
                <p className="text-xs text-slate-500 mt-1">All time</p>
              </CardContent>
            </Card>

            {/* Completed */}
            <Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">
                  {stats?.completedAssessments}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {stats?.completionRate.toFixed(1)}% completion rate
                </p>
              </CardContent>
            </Card>

            {/* Average Score */}
            <Card className="border-2 border-violet-100 bg-gradient-to-br from-violet-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Average Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-violet-600">
                  {stats?.averageScore.toFixed(1)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Out of 100</p>
              </CardContent>
            </Card>

            {/* Avg Time to Complete */}
            <Card className="border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Avg. Completion Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {formatDuration(stats?.averageTimeToComplete || 0)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Average duration</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Maturity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Maturity Level Distribution
              </CardTitle>
              <CardDescription>Breakdown by AI-Readiness maturity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.maturityDistribution &&
                Object.entries(stats.maturityDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([level, count]) => (
                    <div key={level} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize font-medium">{level}</span>
                        <span className="text-slate-500">
                          {count} ({((count / (stats.totalAssessments || 1)) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getMaturityBadge(level)}`}
                          style={{
                            width: `${(count / (stats.totalAssessments || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
            </CardContent>
          </Card>

          {/* Industry Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Industry Distribution
              </CardTitle>
              <CardDescription>Assessments by industry sector</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.industryDistribution &&
                Object.entries(stats.industryDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([industry, count]) => (
                    <div key={industry} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize font-medium">{industry}</span>
                        <span className="text-slate-500">
                          {count} ({((count / (stats.totalAssessments || 1)) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                          style={{
                            width: `${(count / (stats.totalAssessments || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>Filter assessments by various criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={value =>
                    updateFilter('status', value === 'all' ? undefined : (value as any))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Industry Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Industry</label>
                <Select
                  value={filters.industry || 'all'}
                  onValueChange={value =>
                    updateFilter('industry', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Company Size Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Company Size</label>
                <Select
                  value={filters.companySize || 'all'}
                  onValueChange={value =>
                    updateFilter('companySize', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All sizes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sizes</SelectItem>
                    <SelectItem value="1-50">1-50</SelectItem>
                    <SelectItem value="51-200">51-200</SelectItem>
                    <SelectItem value="201-1000">201-1000</SelectItem>
                    <SelectItem value="1001-5000">1001-5000</SelectItem>
                    <SelectItem value="5000+">5000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Maturity Level Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Maturity Level</label>
                <Select
                  value={filters.maturityLevel || 'all'}
                  onValueChange={value =>
                    updateFilter('maturityLevel', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="awareness">Awareness</SelectItem>
                    <SelectItem value="experimenting">Experimenting</SelectItem>
                    <SelectItem value="adopting">Adopting</SelectItem>
                    <SelectItem value="optimizing">Optimizing</SelectItem>
                    <SelectItem value="leading">Leading</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Button */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 invisible">Reset</label>
                <Button variant="outline" onClick={resetFilters} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Date From</label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={e => updateFilter('dateFrom', e.target.value || undefined)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Date To</label>
                <Input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={e => updateFilter('dateTo', e.target.value || undefined)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessments Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Assessments</CardTitle>
                <CardDescription>
                  Showing {assessments.length} of {totalCount} assessments
                </CardDescription>
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {assessmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : assessments.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No assessments found matching the current filters.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Maturity</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assessments.map(assessment => (
                        <TableRow key={assessment.id}>
                          <TableCell className="font-medium">
                            {assessment.company_name || 'Unnamed'}
                          </TableCell>
                          <TableCell className="capitalize">
                            {assessment.industry || 'N/A'}
                          </TableCell>
                          <TableCell>{assessment.company_size || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusBadge(assessment.status)} text-white`}>
                              {assessment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {assessment.overall_readiness_score
                              ? Math.round(assessment.overall_readiness_score)
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {assessment.maturity_level ? (
                              <Badge
                                className={`${getMaturityBadge(assessment.maturity_level)} text-white`}
                              >
                                {assessment.maturity_level}
                              </Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>{formatDate(assessment.created_at!)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/assessment/ai-readiness/results/${assessment.id}`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-slate-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
