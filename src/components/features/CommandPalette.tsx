import { useState, useEffect, useMemo } from 'react';
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
import {
  Home,
  LayoutDashboard,
  User,
  Shield,
  BookOpen,
  GraduationCap,
  Brain,
  Calendar,
  Award,
  Bookmark,
  Download,
  Clock,
  ListVideo,
  TrendingUp,
  Sparkles,
} from '@/components/ui/icons';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: string;
  keywords?: string[];
}

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Use Ctrl+P for command palette (Ctrl+K is for global search)
      if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands: Command[] = useMemo(
    () => [
      // Navigation
      {
        id: 'nav-home',
        label: 'Home',
        description: 'Go to homepage',
        icon: Home,
        action: () => {
          navigate('/');
          setOpen(false);
        },
        category: 'Navigation',
        keywords: ['home', 'index', 'landing'],
      },
      {
        id: 'nav-dashboard',
        label: 'Dashboard',
        description: 'View your dashboard',
        icon: LayoutDashboard,
        action: () => {
          navigate('/dashboard');
          setOpen(false);
        },
        category: 'Navigation',
        keywords: ['dashboard', 'overview', 'home'],
      },
      {
        id: 'nav-profile',
        label: 'Profile',
        description: 'Edit your profile',
        icon: User,
        action: () => {
          navigate('/profile');
          setOpen(false);
        },
        category: 'Navigation',
        keywords: ['profile', 'settings', 'account'],
      },
      {
        id: 'nav-admin',
        label: 'Admin Dashboard',
        description: 'Access admin panel',
        icon: Shield,
        action: () => {
          navigate('/admin');
          setOpen(false);
        },
        category: 'Navigation',
        keywords: ['admin', 'management', 'control'],
      },
      {
        id: 'nav-blog',
        label: 'Blog',
        description: 'Read latest articles',
        icon: BookOpen,
        action: () => {
          navigate('/blog');
          setOpen(false);
        },
        category: 'Navigation',
        keywords: ['blog', 'articles', 'posts', 'news'],
      },

      // Learning
      {
        id: 'learning-courses',
        label: 'My Courses',
        description: 'View enrolled courses',
        icon: GraduationCap,
        action: () => {
          navigate('/my-courses');
          setOpen(false);
        },
        category: 'Learning',
        keywords: ['courses', 'enrolled', 'learning'],
      },
      {
        id: 'learning-paths',
        label: 'Learning Paths',
        description: 'Explore learning paths',
        icon: TrendingUp,
        action: () => {
          navigate('/learning-paths');
          setOpen(false);
        },
        category: 'Learning',
        keywords: ['paths', 'roadmap', 'journey'],
      },
      {
        id: 'learning-assessment',
        label: 'AI Assessment',
        description: 'Take an AI assessment',
        icon: Brain,
        action: () => {
          navigate('/ai-assessment');
          setOpen(false);
        },
        category: 'Learning',
        keywords: ['assessment', 'test', 'evaluation', 'quiz'],
      },

      // Resources
      {
        id: 'resource-calendar',
        label: 'Calendar',
        description: 'View your schedule',
        icon: Calendar,
        action: () => {
          navigate('/calendar');
          setOpen(false);
        },
        category: 'Resources',
        keywords: ['calendar', 'schedule', 'events'],
      },
      {
        id: 'resource-achievements',
        label: 'Achievements',
        description: 'View your achievements',
        icon: Award,
        action: () => {
          navigate('/achievements');
          setOpen(false);
        },
        category: 'Resources',
        keywords: ['achievements', 'badges', 'awards'],
      },
      {
        id: 'resource-bookmarks',
        label: 'Bookmarks',
        description: 'Access saved items',
        icon: Bookmark,
        action: () => {
          navigate('/bookmarks');
          setOpen(false);
        },
        category: 'Resources',
        keywords: ['bookmarks', 'saved', 'favorites'],
      },
      {
        id: 'resource-downloads',
        label: 'Downloads',
        description: 'View downloaded content',
        icon: Download,
        action: () => {
          navigate('/downloads');
          setOpen(false);
        },
        category: 'Resources',
        keywords: ['downloads', 'files', 'saved'],
      },
      {
        id: 'resource-watch-later',
        label: 'Watch Later',
        description: 'View watch later list',
        icon: Clock,
        action: () => {
          navigate('/watch-later');
          setOpen(false);
        },
        category: 'Resources',
        keywords: ['watch', 'later', 'queue'],
      },
      {
        id: 'resource-playlists',
        label: 'Playlists',
        description: 'Manage your playlists',
        icon: ListVideo,
        action: () => {
          navigate('/playlists');
          setOpen(false);
        },
        category: 'Resources',
        keywords: ['playlists', 'collections', 'lists'],
      },
      {
        id: 'resource-analytics',
        label: 'Analytics',
        description: 'View your progress analytics',
        icon: TrendingUp,
        action: () => {
          navigate('/analytics');
          setOpen(false);
        },
        category: 'Resources',
        keywords: ['analytics', 'stats', 'progress', 'metrics'],
      },
      {
        id: 'resource-gamification',
        label: 'Gamification',
        description: 'View points and leaderboard',
        icon: Sparkles,
        action: () => {
          navigate('/gamification');
          setOpen(false);
        },
        category: 'Resources',
        keywords: ['gamification', 'points', 'leaderboard', 'game'],
      },
    ],
    [navigate]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." aria-label="Command search input" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {['Navigation', 'Learning', 'Resources'].map(category => {
          const categoryCommands = commands.filter(cmd => cmd.category === category);
          if (categoryCommands.length === 0) return null;

          return (
            <div key={category}>
              <CommandGroup heading={category}>
                {categoryCommands.map(command => (
                  <CommandItem
                    key={command.id}
                    onSelect={command.action}
                    className="cursor-pointer"
                  >
                    <command.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                    <div className="flex flex-col">
                      <span>{command.label}</span>
                      {command.description && (
                        <span className="text-xs text-muted-foreground">{command.description}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              {category !== 'Resources' && <CommandSeparator />}
            </div>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
};
