/**
 * UserProgressDashboard Component
 *
 * Comprehensive view of user progress across Lingo, courses, and assessments.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Icon } from '@/utils/iconLoader';
import { useUserProgressData } from '@/hooks/useUserProgressData';
import { ProgressMetricsCards } from './ProgressMetricsCards';
import type { UserProgressSortField } from '@/types/user-progress.types';

export function UserProgressDashboard() {
  const {
    users,
    metrics,
    pagination,
    isLoading,
    error,
    refetch,
    setFilters,
    setSort,
    setPage,
    filters,
    sort,
  } = useUserProgressData();

  const [searchInput, setSearchInput] = useState('');

  // Handle search
  function handleSearch() {
    setFilters({ search: searchInput });
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  // Handle sort
  function handleSort(field: UserProgressSortField) {
    if (sort.field === field) {
      setSort({ field, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSort({ field, direction: 'desc' });
    }
  }

  // Get sort icon
  function getSortIcon(field: UserProgressSortField) {
    if (sort.field !== field) return null;
    return sort.direction === 'asc' ? (
      <Icon name="ChevronUp" className="h-4 w-4" />
    ) : (
      <Icon name="ChevronDown" className="h-4 w-4" />
    );
  }

  // Export to JSON
  function handleExportJSON() {
    const exportData = {
      exported_at: new Date().toISOString(),
      metrics,
      users,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-progress-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export to CSV
  function handleExportCSV() {
    const headers = [
      'Name',
      'Email',
      'Role',
      'Lingo XP',
      'Streak',
      'Lessons Completed',
      'Courses Enrolled',
      'Courses Completed',
      'Avg Progress',
      'Assessments',
      'Avg Score',
      'Last Activity',
    ];

    const rows = users.map(u => [
      u.full_name,
      u.email,
      u.role,
      u.lingo_xp,
      u.lingo_streak,
      u.lingo_lessons_completed,
      u.enrolled_courses,
      u.completed_courses,
      `${u.avg_course_progress}%`,
      u.assessments_taken,
      u.avg_assessment_score,
      u.last_activity_at ? new Date(u.last_activity_at).toLocaleDateString() : 'Never',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-progress-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Format date
  function formatDate(dateStr?: string) {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }

  // Get activity badge
  function getActivityBadge(lastActivity?: string) {
    if (!lastActivity) {
      return <Badge variant="outline">Never active</Badge>;
    }

    const date = new Date(lastActivity);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    if (diffDays < 30) {
      return <Badge className="bg-yellow-100 text-yellow-800">At risk</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            <Icon name="AlertTriangle" className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
            <Button onClick={refetch} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Icon name="Users" className="h-6 w-6" />
            User Progress
          </h2>
          <p className="text-muted-foreground">
            View and analyze learner progress across all platforms
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={isLoading}>
            <Icon name="FileSpreadsheet" className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={handleExportJSON} disabled={isLoading}>
            <Icon name="FileJson" className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button variant="outline" onClick={refetch} disabled={isLoading}>
            <Icon name="RefreshCw" className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && <ProgressMetricsCards metrics={metrics} isLoading={isLoading} />}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="max-w-sm"
              />
              <Button onClick={handleSearch}>
                <Icon name="Search" className="h-4 w-4" />
              </Button>
            </div>

            <Select
              value={filters.role || 'all'}
              onValueChange={v => setFilters({ role: v === 'all' ? undefined : v })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.activityStatus || 'all'}
              onValueChange={v =>
                setFilters({
                  activityStatus: v as 'all' | 'active' | 'inactive' | 'at_risk',
                })
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="active">Active (7d)</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="inactive">Inactive (30d+)</SelectItem>
              </SelectContent>
            </Select>

            {(filters.search || filters.role || filters.activityStatus !== 'all') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchInput('');
                  setFilters({ search: '', role: undefined, activityStatus: 'all' });
                }}
              >
                <Icon name="X" className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Users ({pagination.total})</CardTitle>
          <CardDescription>
            Showing {(pagination.page - 1) * 20 + 1} -{' '}
            {Math.min(pagination.page * 20, pagination.total)} of {pagination.total}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader2" className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your criteria.
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('full_name')}
                      >
                        <div className="flex items-center gap-1">
                          User {getSortIcon('full_name')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 text-center"
                        onClick={() => handleSort('lingo_xp')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Lingo XP {getSortIcon('lingo_xp')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 text-center"
                        onClick={() => handleSort('enrolled_courses')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Courses {getSortIcon('enrolled_courses')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 text-center"
                        onClick={() => handleSort('avg_course_progress')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Progress {getSortIcon('avg_course_progress')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 text-center"
                        onClick={() => handleSort('assessments_taken')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Tests {getSortIcon('assessments_taken')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 text-center"
                        onClick={() => handleSort('avg_assessment_score')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Avg Score {getSortIcon('avg_assessment_score')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('last_activity_at')}
                      >
                        <div className="flex items-center gap-1">
                          Activity {getSortIcon('last_activity_at')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Icon name="Zap" className="h-4 w-4 text-amber-500" />
                            {user.lingo_xp.toLocaleString()}
                          </div>
                          {user.lingo_streak > 0 && (
                            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                              <Icon name="Flame" className="h-3 w-3 text-orange-500" />
                              {user.lingo_streak} day streak
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span>{user.enrolled_courses}</span>
                            {user.completed_courses > 0 && (
                              <span className="text-xs text-green-600">
                                {user.completed_courses} completed
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${user.avg_course_progress}%` }}
                              />
                            </div>
                            <span className="text-sm">{user.avg_course_progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{user.assessments_taken}</TableCell>
                        <TableCell className="text-center">
                          {user.assessments_taken > 0 ? (
                            <Badge
                              variant={user.avg_assessment_score >= 70 ? 'default' : 'secondary'}
                            >
                              {user.avg_assessment_score}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getActivityBadge(user.last_activity_at)}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(user.last_activity_at)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <Icon name="ChevronLeft" className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Next
                    <Icon name="ChevronRight" className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
