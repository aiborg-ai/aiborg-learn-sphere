/**
 * useCalendarFilters Hook
 *
 * Custom hook for managing calendar filter state with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';
import type { CalendarFilters, CalendarEventType, EventStatus } from '@/types/calendar';
import { logger } from '@/utils/logger';

const STORAGE_KEY = 'aiborg-calendar-filters';

const DEFAULT_FILTERS: CalendarFilters = {
  eventTypes: [
    'assignment',
    'exam',
    'course',
    'workshop_session',
    'free_session',
    'classroom_session',
    'event',
    'deadline',
  ],
  courseIds: [],
  statuses: [],
  dateRangeStart: null,
  dateRangeEnd: null,
  showOnlyUserEvents: false,
  searchQuery: '',
};

interface UseCalendarFiltersReturn {
  /** Current filters */
  filters: CalendarFilters;

  /** Update event types filter */
  setEventTypes: (types: CalendarEventType[]) => void;

  /** Toggle a single event type */
  toggleEventType: (type: CalendarEventType) => void;

  /** Update course filter */
  setCourseIds: (courseIds: string[]) => void;

  /** Toggle a single course */
  toggleCourse: (courseId: string) => void;

  /** Update status filter */
  setStatuses: (statuses: EventStatus[]) => void;

  /** Toggle a single status */
  toggleStatus: (status: EventStatus) => void;

  /** Update date range */
  setDateRange: (start: Date | null, end: Date | null) => void;

  /** Toggle show only user events */
  toggleShowOnlyUserEvents: () => void;

  /** Update search query */
  setSearchQuery: (query: string) => void;

  /** Reset all filters to default */
  resetFilters: () => void;

  /** Save current filters to localStorage */
  saveFilters: () => void;

  /** Whether filters are active (different from default) */
  hasActiveFilters: boolean;

  /** Number of active filters */
  activeFilterCount: number;
}

export function useCalendarFilters(persistToLocalStorage = true): UseCalendarFiltersReturn {
  // Load initial filters from localStorage
  const loadFilters = useCallback((): CalendarFilters => {
    if (!persistToLocalStorage) return DEFAULT_FILTERS;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return {
          ...DEFAULT_FILTERS,
          ...parsed,
          dateRangeStart: parsed.dateRangeStart ? new Date(parsed.dateRangeStart) : null,
          dateRangeEnd: parsed.dateRangeEnd ? new Date(parsed.dateRangeEnd) : null,
        };
      }
    } catch (error) {
      logger.error('Error loading calendar filters from localStorage:', error);
    }
    return DEFAULT_FILTERS;
  }, [persistToLocalStorage]);

  const [filters, setFilters] = useState<CalendarFilters>(loadFilters);

  // Save to localStorage whenever filters change
  useEffect(() => {
    if (persistToLocalStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
      } catch (error) {
        logger.error('Error saving calendar filters to localStorage:', error);
      }
    }
  }, [filters, persistToLocalStorage]);

  // Event types
  const setEventTypes = useCallback((types: CalendarEventType[]) => {
    setFilters(prev => ({ ...prev, eventTypes: types }));
  }, []);

  const toggleEventType = useCallback((type: CalendarEventType) => {
    setFilters(prev => {
      const isSelected = prev.eventTypes.includes(type);
      return {
        ...prev,
        eventTypes: isSelected
          ? prev.eventTypes.filter(t => t !== type)
          : [...prev.eventTypes, type],
      };
    });
  }, []);

  // Courses
  const setCourseIds = useCallback((courseIds: string[]) => {
    setFilters(prev => ({ ...prev, courseIds }));
  }, []);

  const toggleCourse = useCallback((courseId: string) => {
    setFilters(prev => {
      const isSelected = prev.courseIds.includes(courseId);
      return {
        ...prev,
        courseIds: isSelected
          ? prev.courseIds.filter(id => id !== courseId)
          : [...prev.courseIds, courseId],
      };
    });
  }, []);

  // Statuses
  const setStatuses = useCallback((statuses: EventStatus[]) => {
    setFilters(prev => ({ ...prev, statuses }));
  }, []);

  const toggleStatus = useCallback((status: EventStatus) => {
    setFilters(prev => {
      const isSelected = prev.statuses.includes(status);
      return {
        ...prev,
        statuses: isSelected ? prev.statuses.filter(s => s !== status) : [...prev.statuses, status],
      };
    });
  }, []);

  // Date range
  const setDateRange = useCallback((start: Date | null, end: Date | null) => {
    setFilters(prev => ({
      ...prev,
      dateRangeStart: start,
      dateRangeEnd: end,
    }));
  }, []);

  // Show only user events
  const toggleShowOnlyUserEvents = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      showOnlyUserEvents: !prev.showOnlyUserEvents,
    }));
  }, []);

  // Search query
  const setSearchQuery = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Save filters (manual save trigger)
  const saveFilters = useCallback(() => {
    if (persistToLocalStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
        logger.info('Calendar filters saved');
      } catch (error) {
        logger.error('Error saving calendar filters:', error);
      }
    }
  }, [filters, persistToLocalStorage]);

  // Check if filters are active
  const hasActiveFilters = useCallback(() => {
    // Check if event types differ from default (all types)
    const hasEventTypeFilter = filters.eventTypes.length < DEFAULT_FILTERS.eventTypes.length;

    // Check if other filters are active
    const hasOtherFilters =
      filters.courseIds.length > 0 ||
      filters.statuses.length > 0 ||
      filters.dateRangeStart !== null ||
      filters.dateRangeEnd !== null ||
      filters.showOnlyUserEvents ||
      filters.searchQuery.trim() !== '';

    return hasEventTypeFilter || hasOtherFilters;
  }, [filters])();

  // Count active filters
  const activeFilterCount = useCallback(() => {
    let count = 0;

    if (filters.eventTypes.length < DEFAULT_FILTERS.eventTypes.length) {
      count++; // Event types filter is active
    }
    if (filters.courseIds.length > 0) {
      count++; // Course filter is active
    }
    if (filters.statuses.length > 0) {
      count++; // Status filter is active
    }
    if (filters.dateRangeStart || filters.dateRangeEnd) {
      count++; // Date range filter is active
    }
    if (filters.showOnlyUserEvents) {
      count++; // User events filter is active
    }
    if (filters.searchQuery.trim() !== '') {
      count++; // Search filter is active
    }

    return count;
  }, [filters])();

  return {
    filters,
    setEventTypes,
    toggleEventType,
    setCourseIds,
    toggleCourse,
    setStatuses,
    toggleStatus,
    setDateRange,
    toggleShowOnlyUserEvents,
    setSearchQuery,
    resetFilters,
    saveFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}
