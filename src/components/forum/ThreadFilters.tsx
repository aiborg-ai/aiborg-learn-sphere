/**
 * ThreadFilters Component
 * Sort and filter controls for thread lists
 */

import { useState } from 'react';
import { Filter, TrendingUp, Clock, Star, Flame, Search } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ThreadFiltersProps {
  onSortChange: (sort: 'hot' | 'new' | 'top' | 'controversial') => void;
  onTimeRangeChange: (range: 'today' | 'week' | 'month' | 'year' | 'all') => void;
  onSearchChange: (query: string) => void;
  currentSort?: string;
  currentTimeRange?: string;
  showFilters?: boolean;
}

export function ThreadFilters({
  onSortChange,
  onTimeRangeChange,
  onSearchChange,
  currentSort = 'hot',
  currentTimeRange = 'all',
  showFilters = true,
}: ThreadFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showPinned, setShowPinned] = useState(true);
  const [showSolved, setShowSolved] = useState(true);

  const sortOptions = [
    { value: 'hot', label: 'Hot', icon: Flame },
    { value: 'new', label: 'New', icon: Clock },
    { value: 'top', label: 'Top', icon: TrendingUp },
    { value: 'controversial', label: 'Controversial', icon: Star },
  ];

  const timeRanges = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search threads..."
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            onSearchChange(e.target.value);
          }}
          className="pl-10"
        />
      </div>

      {/* Sort and Filter Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort Buttons */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {sortOptions.map(option => {
            const Icon = option.icon;
            return (
              <Button
                key={option.value}
                variant="ghost"
                size="sm"
                className={cn('gap-1', currentSort === option.value && 'bg-white shadow-sm')}
                onClick={() => onSortChange(option.value as typeof currentSort)}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </Button>
            );
          })}
        </div>

        {/* Time Range */}
        {currentSort === 'top' && (
          <Select
            value={currentTimeRange}
            onValueChange={value => onTimeRangeChange(value as typeof currentTimeRange)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Additional Filters */}
        {showFilters && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Show</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={showPinned} onCheckedChange={setShowPinned}>
                Pinned threads
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={showSolved} onCheckedChange={setShowSolved}>
                Solved threads
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
