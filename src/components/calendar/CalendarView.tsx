/**
 * Calendar View Component (Refactored)
 *
 * Main calendar component with:
 * - Multiple view modes (Agenda, Month, Week, Day)
 * - Advanced filtering
 * - Real-time updates
 * - Event modal
 * - Statistics dashboard
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  List,
  CalendarRange,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Home,
  Loader2,
} from '@/components/ui/icons';
import { useAuth } from '@/hooks/useAuth';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useCalendarFilters } from '@/hooks/useCalendarFilters';
import { CalendarFilterPanel } from './CalendarFilterPanel';
import { AgendaView } from './AgendaView';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { CalendarEventModal } from './CalendarEventModal';
import type { CalendarView as CalendarViewType, CalendarEvent } from '@/types/calendar';
import { format } from 'date-fns';

export function CalendarView() {
  const { user } = useAuth();

  // View state
  const [currentView, setCurrentView] = useState<CalendarViewType>('agenda');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Calendar events hook
  const {
    events,
    filteredEvents,
    stats,
    loading,
    error,
    dateRange,
    nextMonth,
    previousMonth,
    goToToday,
    refresh,
    applyFilters,
  } = useCalendarEvents({
    userId: user?.id,
    enableRealtime: true,
  });

  // Filter hook
  const {
    filters,
    toggleEventType,
    toggleStatus,
    toggleShowOnlyUserEvents,
    setSearchQuery,
    resetFilters,
    activeFilterCount,
  } = useCalendarFilters();

  // Apply filters to calendar hook
  const handleFilterChange = () => {
    applyFilters(filters);
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  // Handle date select
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (currentView !== 'month' && currentView !== 'day') {
      setCurrentView('day');
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <p className="text-red-500">Error loading calendar: {error.message}</p>
          <Button onClick={refresh} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CalendarDays className="h-6 w-6" />
                Academic Calendar
              </CardTitle>
              <CardDescription className="mt-1">
                View all your assignments, courses, events, and sessions in one place
              </CardDescription>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={previousMonth} disabled={loading}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[180px] text-center">
                <div className="font-semibold">{format(dateRange.start, 'MMMM yyyy')}</div>
              </div>
              <Button variant="outline" size="sm" onClick={nextMonth} disabled={loading}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} disabled={loading}>
                <Home className="h-4 w-4 mr-1" />
                Today
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Events</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.upcomingToday}</div>
              <p className="text-xs text-muted-foreground mt-1">Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">{stats.upcomingThisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">This Week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.completedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.overdueCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Overdue</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter Panel */}
        <div className="lg:col-span-1">
          <CalendarFilterPanel
            selectedEventTypes={filters.eventTypes}
            onToggleEventType={type => {
              toggleEventType(type);
              handleFilterChange();
            }}
            selectedStatuses={filters.statuses}
            onToggleStatus={status => {
              toggleStatus(status);
              handleFilterChange();
            }}
            showOnlyUserEvents={filters.showOnlyUserEvents}
            onToggleUserEvents={() => {
              toggleShowOnlyUserEvents();
              handleFilterChange();
            }}
            searchQuery={filters.searchQuery}
            onSearchChange={query => {
              setSearchQuery(query);
              handleFilterChange();
            }}
            onReset={() => {
              resetFilters();
              handleFilterChange();
            }}
            activeFilterCount={activeFilterCount}
          />
        </div>

        {/* Calendar Views */}
        <div className="lg:col-span-3">
          <Tabs
            value={currentView}
            onValueChange={value => setCurrentView(value as CalendarViewType)}
          >
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="agenda" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Agenda</span>
              </TabsTrigger>
              <TabsTrigger value="month" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Month</span>
              </TabsTrigger>
              <TabsTrigger value="week" className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4" />
                <span className="hidden sm:inline">Week</span>
              </TabsTrigger>
              <TabsTrigger value="day" className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                <span className="hidden sm:inline">Day</span>
              </TabsTrigger>
            </TabsList>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading events...</span>
              </div>
            )}

            {!loading && (
              <>
                <TabsContent value="agenda" className="mt-0">
                  <AgendaView
                    events={filteredEvents}
                    onEventClick={handleEventClick}
                    showEmptyState
                    maxHeight="700px"
                  />
                </TabsContent>

                <TabsContent value="month" className="mt-0">
                  <MonthView
                    events={filteredEvents}
                    selectedDate={selectedDate}
                    currentMonth={dateRange.start}
                    onDateSelect={handleDateSelect}
                    onMonthChange={() => {
                      // Month change is handled by the header navigation
                    }}
                    onEventClick={handleEventClick}
                  />
                </TabsContent>

                <TabsContent value="week" className="mt-0">
                  <WeekView
                    events={filteredEvents}
                    selectedDate={selectedDate}
                    onEventClick={handleEventClick}
                  />
                </TabsContent>

                <TabsContent value="day" className="mt-0">
                  <DayView
                    events={filteredEvents}
                    selectedDate={selectedDate}
                    onEventClick={handleEventClick}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>

          {/* Results Info */}
          {!loading && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Showing {filteredEvents.length} of {events.length} events
              </div>
              {activeFilterCount > 0 && (
                <Badge variant="secondary">
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      <CalendarEventModal
        event={selectedEvent}
        open={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
}
