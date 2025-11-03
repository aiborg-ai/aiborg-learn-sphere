/**
 * Calendar Filter Panel Component
 *
 * Advanced filtering UI for calendar events with:
 * - Event type multi-select with color indicators
 * - Course filter
 * - Status filter
 * - User events toggle
 * - Search
 * - Active filter chips
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Filter, X, Search, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import type { CalendarEventType, EventStatus } from '@/types/calendar';
import { EVENT_TYPE_COLORS, getEventTypeLabel } from '@/services/calendar/CalendarEventService';
import { cn } from '@/lib/utils';

interface CalendarFilterPanelProps {
  /** Selected event types */
  selectedEventTypes: CalendarEventType[];

  /** Toggle event type */
  onToggleEventType: (type: CalendarEventType) => void;

  /** Selected statuses */
  selectedStatuses: EventStatus[];

  /** Toggle status */
  onToggleStatus: (status: EventStatus) => void;

  /** Show only user events */
  showOnlyUserEvents: boolean;

  /** Toggle show only user events */
  onToggleUserEvents: () => void;

  /** Search query */
  searchQuery: string;

  /** Update search query */
  onSearchChange: (query: string) => void;

  /** Reset all filters */
  onReset: () => void;

  /** Number of active filters */
  activeFilterCount: number;

  /** Compact mode (for mobile) */
  compact?: boolean;

  /** Collapsible */
  collapsible?: boolean;

  /** Initially collapsed */
  initiallyCollapsed?: boolean;
}

const EVENT_TYPES: CalendarEventType[] = [
  'assignment',
  'exam',
  'course',
  'workshop_session',
  'free_session',
  'classroom_session',
  'event',
  'deadline',
];

const STATUSES: EventStatus[] = ['upcoming', 'ongoing', 'completed', 'overdue', 'cancelled'];

const STATUS_LABELS: Record<EventStatus, string> = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<EventStatus, string> = {
  upcoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ongoing: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export function CalendarFilterPanel({
  selectedEventTypes,
  onToggleEventType,
  selectedStatuses,
  onToggleStatus,
  showOnlyUserEvents,
  onToggleUserEvents,
  searchQuery,
  onSearchChange,
  onReset,
  activeFilterCount,
  compact = false,
  collapsible = true,
  initiallyCollapsed = false,
}: CalendarFilterPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed);

  const allEventTypesSelected = selectedEventTypes.length === EVENT_TYPES.length;

  const toggleAllEventTypes = () => {
    if (allEventTypesSelected) {
      // Deselect all
      EVENT_TYPES.forEach(type => {
        if (selectedEventTypes.includes(type)) {
          onToggleEventType(type);
        }
      });
    } else {
      // Select all
      EVENT_TYPES.forEach(type => {
        if (!selectedEventTypes.includes(type)) {
          onToggleEventType(type);
        }
      });
    }
  };

  const FilterHeader = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4" />
        <span className="font-semibold">Filters</span>
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {activeFilterCount}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-8">
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
        {collapsible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8"
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className="space-y-3">
        <FilterHeader />

        {!isCollapsed && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="pl-8"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSearchChange('')}
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Quick toggles */}
            <div className="flex items-center justify-between">
              <Label htmlFor="user-events" className="text-sm">
                My Events Only
              </Label>
              <Switch
                id="user-events"
                checked={showOnlyUserEvents}
                onCheckedChange={onToggleUserEvents}
              />
            </div>

            {/* Event type chips */}
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(type => {
                const isSelected = selectedEventTypes.includes(type);
                const config = EVENT_TYPE_COLORS[type];
                return (
                  <Badge
                    key={type}
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn('cursor-pointer transition-all', isSelected && config.bg)}
                    onClick={() => onToggleEventType(type)}
                  >
                    {getEventTypeLabel(type)}
                  </Badge>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          <FilterHeader />
        </CardTitle>
        {!isCollapsed && (
          <CardDescription>Filter calendar events by type, status, and more</CardDescription>
        )}
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search events, courses..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="pl-8"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSearchChange('')}
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Event Types */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Event Types</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAllEventTypes}
                className="h-7 text-xs"
              >
                {allEventTypesSelected ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <ScrollArea className="h-[240px] pr-3">
              <div className="space-y-2">
                {EVENT_TYPES.map(type => {
                  const isSelected = selectedEventTypes.includes(type);
                  const config = EVENT_TYPE_COLORS[type];

                  return (
                    <div
                      key={type}
                      className="flex items-center space-x-2 rounded-md p-2 hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`event-type-${type}`}
                        checked={isSelected}
                        onCheckedChange={() => onToggleEventType(type)}
                      />
                      <Label
                        htmlFor={`event-type-${type}`}
                        className="flex-1 cursor-pointer flex items-center gap-2"
                      >
                        <div className={cn('w-3 h-3 rounded-full', config.bg)}></div>
                        <span className="text-sm">{getEventTypeLabel(type)}</span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Status Filter */}
          <div className="space-y-3">
            <div className="text-sm font-semibold">Status</div>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(status => {
                const isSelected = selectedStatuses.includes(status);
                return (
                  <Badge
                    key={status}
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer transition-all',
                      isSelected && STATUS_COLORS[status]
                    )}
                    onClick={() => onToggleStatus(status)}
                  >
                    {STATUS_LABELS[status]}
                  </Badge>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* User Events Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <div className="text-sm font-medium cursor-pointer">My Events Only</div>
              <p className="text-xs text-muted-foreground">
                Show only events you&apos;re assigned, enrolled, or registered for
              </p>
            </div>
            <Switch
              id="my-events"
              checked={showOnlyUserEvents}
              onCheckedChange={onToggleUserEvents}
              aria-label="Toggle my events only filter"
            />
          </div>

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground">
                  Active Filters ({activeFilterCount})
                </div>
                <div className="flex flex-wrap gap-2">
                  {!allEventTypesSelected && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedEventTypes.length} Event Type
                      {selectedEventTypes.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {selectedStatuses.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedStatuses.length} Status{selectedStatuses.length !== 1 ? 'es' : ''}
                    </Badge>
                  )}
                  {showOnlyUserEvents && (
                    <Badge variant="secondary" className="text-xs">
                      My Events
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge variant="secondary" className="text-xs">
                      Search: "{searchQuery}"
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
