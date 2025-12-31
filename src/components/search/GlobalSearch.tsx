import { useEffect, useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  BookOpen,
  FileText,
  Video,
  Calendar,
  User,
  BookMarked,
  Download,
  Clock,
  List,
  Home,
  Sparkles,
} from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  id: string;
  title: string;
  type: 'course' | 'assignment' | 'material' | 'page' | 'action';
  description?: string;
  icon: React.ReactNode;
  url: string;
  badge?: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { user: _user } = useAuth();
  const navigate = useNavigate();

  // Quick actions - always available
  // eslint-disable-next-line react-hooks/exhaustive-deps -- quickActions is intentionally recreated on each render for simplicity
  const quickActions: SearchResult[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'page',
      description: 'Go to your dashboard',
      icon: <Home className="h-4 w-4" />,
      url: '/dashboard',
    },
    {
      id: 'calendar',
      title: 'Calendar',
      type: 'page',
      description: 'View your calendar',
      icon: <Calendar className="h-4 w-4" />,
      url: '/calendar',
    },
    {
      id: 'bookmarks',
      title: 'Bookmarks',
      type: 'page',
      description: 'View saved bookmarks',
      icon: <BookMarked className="h-4 w-4" />,
      url: '/bookmarks',
    },
    {
      id: 'downloads',
      title: 'Downloads',
      type: 'page',
      description: 'View download history',
      icon: <Download className="h-4 w-4" />,
      url: '/downloads',
    },
    {
      id: 'watch-later',
      title: 'Watch Later',
      type: 'page',
      description: 'View watch later queue',
      icon: <Clock className="h-4 w-4" />,
      url: '/watch-later',
    },
    {
      id: 'playlists',
      title: 'Playlists',
      type: 'page',
      description: 'Manage your playlists',
      icon: <List className="h-4 w-4" />,
      url: '/playlists',
    },
    {
      id: 'profile',
      title: 'Profile Settings',
      type: 'page',
      description: 'Edit your profile',
      icon: <User className="h-4 w-4" />,
      url: '/profile',
    },
    {
      id: 'ai-assessment',
      title: 'AI Assessment',
      type: 'page',
      description: 'Take an AI assessment',
      icon: <Sparkles className="h-4 w-4" />,
      url: '/ai-assessment',
      badge: 'NEW',
    },
  ];

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search functionality
  const performSearch = useCallback(
    async (query: string) => {
      if (!query || query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchQuery = query.toLowerCase();
        const searchResults: SearchResult[] = [];

        // Search courses
        const { data: courses } = await supabase
          .from('courses')
          .select('id, title, description, category')
          .or(
            `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`
          )
          .limit(5);

        if (courses) {
          courses.forEach(course => {
            searchResults.push({
              id: `course-${course.id}`,
              title: course.title,
              type: 'course',
              description: course.description?.substring(0, 60) + '...' || course.category,
              icon: <BookOpen className="h-4 w-4" />,
              url: `/course/${course.id}`,
            });
          });
        }

        // Search assignments
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id, title, description, courses(title)')
          .ilike('title', `%${searchQuery}%`)
          .limit(5);

        if (assignments) {
          assignments.forEach(assignment => {
            searchResults.push({
              id: `assignment-${assignment.id}`,
              title: assignment.title,
              type: 'assignment',
              description: assignment.courses?.title || assignment.description?.substring(0, 60),
              icon: <FileText className="h-4 w-4" />,
              url: `/assignment/${assignment.id}`,
            });
          });
        }

        // Search course materials
        const { data: materials } = await supabase
          .from('course_materials')
          .select('id, title, type, courses(title)')
          .ilike('title', `%${searchQuery}%`)
          .limit(5);

        if (materials) {
          materials.forEach(material => {
            searchResults.push({
              id: `material-${material.id}`,
              title: material.title,
              type: 'material',
              description: material.courses?.title,
              icon:
                material.type === 'video' ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <Video className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                ),
              url: `/course/${material.courses?.id}`,
            });
          });
        }

        // Filter quick actions by search query
        const filteredActions = quickActions.filter(
          action =>
            action.title.toLowerCase().includes(searchQuery) ||
            action.description?.toLowerCase().includes(searchQuery)
        );

        setResults([...searchResults, ...filteredActions]);
      } catch (_error) {
        logger._error('Search _error:', _error);
      } finally {
        setLoading(false);
      }
    },
    [quickActions]
  );

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(search);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, performSearch]);

  const handleSelect = (url: string) => {
    setOpen(false);
    setSearch('');
    navigate(url);
  };

  const groupedResults = {
    courses: results.filter(r => r.type === 'course'),
    assignments: results.filter(r => r.type === 'assignment'),
    materials: results.filter(r => r.type === 'material'),
    pages: results.filter(r => r.type === 'page'),
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-md border border-white/20 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search courses, assignments, materials..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
          ) : (
            <>
              {!search && (
                <>
                  <CommandGroup heading="Quick Actions">
                    {quickActions.slice(0, 6).map(action => (
                      <CommandItem
                        key={action.id}
                        onSelect={() => handleSelect(action.url)}
                        className="flex items-center gap-3"
                      >
                        {action.icon}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {action.title}
                            {action.badge && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                {action.badge}
                              </Badge>
                            )}
                          </div>
                          {action.description && (
                            <p className="text-xs text-muted-foreground">{action.description}</p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {search && results.length === 0 && (
                <CommandEmpty>No results found for "{search}"</CommandEmpty>
              )}

              {groupedResults.courses.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Courses">
                    {groupedResults.courses.map(result => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result.url)}
                        className="flex items-center gap-3"
                      >
                        {result.icon}
                        <div className="flex-1">
                          <div>{result.title}</div>
                          {result.description && (
                            <p className="text-xs text-muted-foreground">{result.description}</p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {groupedResults.assignments.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Assignments">
                    {groupedResults.assignments.map(result => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result.url)}
                        className="flex items-center gap-3"
                      >
                        {result.icon}
                        <div className="flex-1">
                          <div>{result.title}</div>
                          {result.description && (
                            <p className="text-xs text-muted-foreground">{result.description}</p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {groupedResults.materials.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Materials">
                    {groupedResults.materials.map(result => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result.url)}
                        className="flex items-center gap-3"
                      >
                        {result.icon}
                        <div className="flex-1">
                          <div>{result.title}</div>
                          {result.description && (
                            <p className="text-xs text-muted-foreground">{result.description}</p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {groupedResults.pages.length > 0 && search && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Pages">
                    {groupedResults.pages.map(result => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result.url)}
                        className="flex items-center gap-3"
                      >
                        {result.icon}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {result.title}
                            {result.badge && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                {result.badge}
                              </Badge>
                            )}
                          </div>
                          {result.description && (
                            <p className="text-xs text-muted-foreground">{result.description}</p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </>
          )}
        </CommandList>

        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>
              Press <kbd className="px-1 py-0.5 rounded bg-muted">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 rounded bg-muted">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-muted">↵</kbd> to select
            </span>
          </div>
        </div>
      </CommandDialog>
    </>
  );
}
