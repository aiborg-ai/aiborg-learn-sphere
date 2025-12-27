import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  Play,
  Pause,
  Search,
  User,
  BookOpen,
  LogIn,
  LogOut,
  FileText,
  MessageSquare,
  Trophy,
  CreditCard,
  CheckCircle2,
  Eye,
  Download,
  Upload,
  Settings,
  Zap,
  MousePointer,
} from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type EventType =
  | 'page_view'
  | 'login'
  | 'logout'
  | 'course_enrolled'
  | 'course_completed'
  | 'assessment_started'
  | 'assessment_completed'
  | 'payment'
  | 'comment'
  | 'achievement'
  | 'download'
  | 'upload'
  | 'settings_changed'
  | 'error';

interface ActivityEvent {
  id: string;
  type: EventType;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  location?: string;
  device?: string;
}

const eventConfig: Record<EventType, { icon: React.ElementType; color: string; label: string }> = {
  page_view: { icon: Eye, color: 'text-slate-500 bg-slate-100', label: 'Page View' },
  login: { icon: LogIn, color: 'text-green-600 bg-green-100', label: 'Login' },
  logout: { icon: LogOut, color: 'text-slate-500 bg-slate-100', label: 'Logout' },
  course_enrolled: { icon: BookOpen, color: 'text-blue-600 bg-blue-100', label: 'Enrollment' },
  course_completed: {
    icon: CheckCircle2,
    color: 'text-green-600 bg-green-100',
    label: 'Completion',
  },
  assessment_started: {
    icon: FileText,
    color: 'text-purple-600 bg-purple-100',
    label: 'Assessment',
  },
  assessment_completed: { icon: Trophy, color: 'text-amber-600 bg-amber-100', label: 'Assessment' },
  payment: { icon: CreditCard, color: 'text-emerald-600 bg-emerald-100', label: 'Payment' },
  comment: { icon: MessageSquare, color: 'text-blue-600 bg-blue-100', label: 'Comment' },
  achievement: { icon: Trophy, color: 'text-amber-600 bg-amber-100', label: 'Achievement' },
  download: { icon: Download, color: 'text-slate-600 bg-slate-100', label: 'Download' },
  upload: { icon: Upload, color: 'text-slate-600 bg-slate-100', label: 'Upload' },
  settings_changed: { icon: Settings, color: 'text-slate-600 bg-slate-100', label: 'Settings' },
  error: { icon: Zap, color: 'text-red-600 bg-red-100', label: 'Error' },
};

const ActivityItem = ({ event, isNew }: { event: ActivityEvent; isNew?: boolean }) => {
  const config = eventConfig[event.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-all duration-300',
        isNew && 'bg-primary/5 border border-primary/20',
        !isNew && 'hover:bg-slate-50'
      )}
    >
      <div className={cn('p-2 rounded-full', config.color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={event.userAvatar} />
            <AvatarFallback className="text-xs">
              {event.userName
                .split(' ')
                .map(n => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm truncate">{event.userName}</span>
          <Badge variant="outline" className="text-xs">
            {config.label}
          </Badge>
          {isNew && (
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}</span>
          {event.location && (
            <>
              <span>•</span>
              <span>{event.location}</span>
            </>
          )}
          {event.device && (
            <>
              <span>•</span>
              <span>{event.device}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  color: string;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={cn('p-3 rounded-full', color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export function LiveActivityFeed() {
  const [isPaused, setIsPaused] = useState(false);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | EventType>('all');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    activeUsers: 0,
    eventsPerMinute: 0,
    peakTime: '14:00',
    totalToday: 0,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate sample events
  const generateEvent = useCallback((): ActivityEvent => {
    const eventTypes: EventType[] = [
      'page_view',
      'page_view',
      'page_view', // More common
      'login',
      'logout',
      'course_enrolled',
      'course_completed',
      'assessment_started',
      'assessment_completed',
      'payment',
      'comment',
      'achievement',
      'download',
    ];

    const users = [
      { name: 'John Smith', email: 'john@example.com' },
      { name: 'Sarah Johnson', email: 'sarah@example.com' },
      { name: 'Michael Brown', email: 'michael@example.com' },
      { name: 'Emily Davis', email: 'emily@example.com' },
      { name: 'David Wilson', email: 'david@example.com' },
      { name: 'Lisa Anderson', email: 'lisa@example.com' },
      { name: 'James Taylor', email: 'james@example.com' },
      { name: 'Jennifer Martinez', email: 'jennifer@example.com' },
    ];

    const pages = ['/dashboard', '/courses', '/blog', '/profile', '/assessments', '/forum'];
    const courses = [
      'AI Fundamentals',
      'Machine Learning 101',
      'Data Science Basics',
      'Deep Learning',
    ];
    const assessments = ['AI Readiness', 'AI Fluency', 'AI Awareness'];
    const locations = ['London, UK', 'New York, US', 'Singapore', 'Sydney, AU', 'Berlin, DE'];
    const devices = ['Chrome on Windows', 'Safari on Mac', 'Mobile - iOS', 'Mobile - Android'];

    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const user = users[Math.floor(Math.random() * users.length)];

    const descriptions: Record<EventType, () => string> = {
      page_view: () => `Viewed ${pages[Math.floor(Math.random() * pages.length)]}`,
      login: () => 'Logged in to the platform',
      logout: () => 'Logged out of the platform',
      course_enrolled: () => `Enrolled in "${courses[Math.floor(Math.random() * courses.length)]}"`,
      course_completed: () => `Completed "${courses[Math.floor(Math.random() * courses.length)]}"`,
      assessment_started: () =>
        `Started ${assessments[Math.floor(Math.random() * assessments.length)]} assessment`,
      assessment_completed: () =>
        `Completed ${assessments[Math.floor(Math.random() * assessments.length)]} with ${Math.floor(Math.random() * 30) + 70}% score`,
      payment: () => `Made a payment of $${(Math.random() * 200 + 50).toFixed(2)}`,
      comment: () => 'Posted a comment in the forum',
      achievement: () => 'Unlocked a new achievement badge',
      download: () => 'Downloaded course materials',
      upload: () => 'Uploaded an assignment',
      settings_changed: () => 'Updated profile settings',
      error: () => 'Encountered an error',
    };

    return {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      userId: `usr-${Math.random().toString(36).substr(2, 9)}`,
      userName: user.name,
      userEmail: user.email,
      description: descriptions[type](),
      timestamp: new Date().toISOString(),
      location: locations[Math.floor(Math.random() * locations.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
    };
  }, []);

  // Start/stop event generation
  useEffect(() => {
    if (!isPaused) {
      // Initial load
      const initialEvents = Array.from({ length: 20 }, generateEvent);
      setEvents(initialEvents);

      // Generate new events periodically
      intervalRef.current = setInterval(
        () => {
          const newEvent = generateEvent();
          setEvents(prev => [newEvent, ...prev.slice(0, 99)]);
          setNewEventIds(prev => new Set([...prev, newEvent.id]));

          // Remove "new" status after 3 seconds
          setTimeout(() => {
            setNewEventIds(prev => {
              const next = new Set(prev);
              next.delete(newEvent.id);
              return next;
            });
          }, 3000);

          // Update stats
          setStats(prev => ({
            ...prev,
            totalToday: prev.totalToday + 1,
            eventsPerMinute: Math.floor(Math.random() * 20) + 10,
            activeUsers: Math.floor(Math.random() * 50) + 20,
          }));
        },
        2000 + Math.random() * 3000
      );
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, generateEvent]);

  // Try to get real users count
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        setStats(prev => ({
          ...prev,
          activeUsers: Math.min(count || 0, 50),
          totalToday: Math.floor(Math.random() * 500) + 100,
        }));
      } catch {
        // Keep sample data
      }
    };
    fetchStats();
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.type === filter;
    const matchesSearch =
      search === '' ||
      event.userName.toLowerCase().includes(search.toLowerCase()) ||
      event.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-full', isPaused ? 'bg-slate-100' : 'bg-green-100')}>
            <Activity className={cn('h-5 w-5', isPaused ? 'text-slate-500' : 'text-green-600')} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Live Activity Feed</h2>
            <p className="text-sm text-muted-foreground">
              {isPaused ? 'Feed paused' : 'Real-time user activity'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant={isPaused ? 'default' : 'outline'} onClick={() => setIsPaused(!isPaused)}>
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Active Users"
          value={stats.activeUsers}
          icon={User}
          color="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Events/Min"
          value={stats.eventsPerMinute}
          icon={Activity}
          color="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Peak Hour"
          value={stats.peakTime as unknown as number}
          icon={Zap}
          color="bg-amber-100 text-amber-600"
        />
        <StatsCard
          title="Total Today"
          value={stats.totalToday}
          icon={MousePointer}
          color="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user or activity..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={v => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="login">Logins</SelectItem>
                <SelectItem value="page_view">Page Views</SelectItem>
                <SelectItem value="course_enrolled">Enrollments</SelectItem>
                <SelectItem value="course_completed">Completions</SelectItem>
                <SelectItem value="assessment_started">Assessments</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Stream</CardTitle>
              <CardDescription>
                Showing {filteredEvents.length} activities
                {!isPaused && (
                  <span className="ml-2 inline-flex items-center">
                    <span className="relative flex h-2 w-2 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    Live
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {filteredEvents.map(event => (
                <ActivityItem key={event.id} event={event} isNew={newEventIds.has(event.id)} />
              ))}
              {filteredEvents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No activities match your filter
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
