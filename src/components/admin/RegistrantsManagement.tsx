import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Calendar,
  BookOpen,
  Search,
  Mail,
  Download,
  Filter,
  Loader2,
  AlertCircle,
} from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { format } from 'date-fns';
import { BatchMessageDialog } from './BatchMessageDialog';

type EntityType = 'sessions' | 'events' | 'courses';

interface Registrant {
  id: string;
  full_name?: string;
  user_name?: string;
  email: string;
  status: string;
  registered_at: string;
  entity_id: string | number;
  entity_name: string;
  age?: number;
  parent_email?: string | null;
}

/**
 * RegistrantsManagement - Admin component to view and manage all registrants
 *
 * Features:
 * - View registrants for sessions, events, and courses
 * - Filter by entity, status, date range
 * - Search by name or email
 * - Select multiple registrants
 * - Send batch messages
 * - Export to CSV
 */
export function RegistrantsManagement() {
  const { toast } = useToast();
  const [entityType, setEntityType] = useState<EntityType>('sessions');
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [filteredRegistrants, setFilteredRegistrants] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [entities, setEntities] = useState<Array<{ id: string | number; name: string }>>([]);
  const [showBatchMessage, setShowBatchMessage] = useState(false);

  const fetchEntities = useCallback(async () => {
    try {
      let data: Record<string, unknown>[] = [];

      if (entityType === 'sessions') {
        const { data: sessions, error } = await supabase
          .from('free_sessions')
          .select('id, title')
          .eq('is_published', true)
          .order('session_date', { ascending: false });

        if (error) throw error;
        data = sessions || [];
      } else if (entityType === 'events') {
        const { data: events, error } = await supabase
          .from('events')
          .select('id, title')
          .eq('is_active', true)
          .order('event_date', { ascending: false });

        if (error) throw error;
        data = events || [];
      } else if (entityType === 'courses') {
        const { data: courses, error } = await supabase
          .from('courses')
          .select('id, title')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        data = courses || [];
      }

      setEntities(data.map(e => ({ id: e.id, name: e.title })));
    } catch (_error) {
      logger._error('Error fetching entities:', _error);
    }
  }, [entityType]);

  const fetchRegistrants = useCallback(async () => {
    try {
      setLoading(true);
      let data: Registrant[] = [];

      if (entityType === 'sessions') {
        const { data: registrations, error } = await supabase
          .from('session_registrations')
          .select(
            `
            id,
            full_name,
            email,
            status,
            registered_at,
            birthdate,
            parent_email,
            session_id,
            free_sessions!inner(id, title)
          `
          )
          .order('registered_at', { ascending: false });

        if (error) throw error;

        data = (registrations || []).map((r: Record<string, unknown>) => {
          const birthdate = new Date(r.birthdate);
          const age = Math.floor(
            (Date.now() - birthdate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
          );

          return {
            id: r.id,
            full_name: r.full_name,
            email: r.email,
            status: r.status,
            registered_at: r.registered_at,
            entity_id: r.session_id,
            entity_name: r.free_sessions.title,
            age,
            parent_email: r.parent_email,
          };
        });
      } else if (entityType === 'events') {
        const { data: registrations, error } = await supabase
          .from('event_registrations')
          .select(
            `
            id,
            email,
            status,
            registered_at,
            event_id,
            events!inner(id, title),
            profiles(display_name)
          `
          )
          .order('registered_at', { ascending: false });

        if (error) throw error;

        data = (registrations || []).map((r: Record<string, unknown>) => ({
          id: r.id,
          user_name: r.profiles?.display_name || 'N/A',
          email: r.email,
          status: r.status || 'registered',
          registered_at: r.registered_at,
          entity_id: r.event_id,
          entity_name: r.events.title,
        }));
      } else if (entityType === 'courses') {
        const { data: enrollments, error } = await supabase
          .from('enrollments')
          .select(
            `
            id,
            user_id,
            enrolled_at,
            payment_status,
            course_id,
            courses!inner(id, title),
            profiles!inner(email, display_name)
          `
          )
          .order('enrolled_at', { ascending: false });

        if (error) throw error;

        data = (enrollments || []).map((e: Record<string, unknown>) => ({
          id: e.id,
          user_name: e.profiles?.display_name || 'N/A',
          email: e.profiles?.email || 'N/A',
          status: e.payment_status,
          registered_at: e.enrolled_at,
          entity_id: e.course_id,
          entity_name: e.courses.title,
        }));
      }

      setRegistrants(data);
    } catch (_error) {
      logger._error('Error fetching registrants:', _error);
      toast({
        title: 'Error',
        description: 'Failed to fetch registrants',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [entityType, toast]);

  const applyFilters = useCallback(() => {
    let filtered = [...registrants];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.full_name?.toLowerCase().includes(query) ||
          r.user_name?.toLowerCase().includes(query) ||
          r.email.toLowerCase().includes(query) ||
          r.entity_name.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // Entity filter
    if (filterEntity !== 'all') {
      filtered = filtered.filter(r => String(r.entity_id) === filterEntity);
    }

    setFilteredRegistrants(filtered);
  }, [registrants, searchQuery, filterStatus, filterEntity]);

  // Fetch entities list (sessions, events, or courses)
  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  // Fetch registrants when entity type changes
  useEffect(() => {
    fetchRegistrants();
  }, [fetchRegistrants]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRegistrants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRegistrants.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const exportToCSV = () => {
    const selectedRegistrants = filteredRegistrants.filter(r => selectedIds.has(r.id));

    const headers = [
      'Name',
      'Email',
      'Status',
      'Registered At',
      entityType === 'sessions' ? 'Session' : entityType === 'events' ? 'Event' : 'Course',
      'Age',
      'Parent Email',
    ];

    const rows = selectedRegistrants.map(r => [
      r.full_name || r.user_name || 'N/A',
      r.email,
      r.status,
      format(new Date(r.registered_at), 'yyyy-MM-dd HH:mm'),
      r.entity_name,
      r.age || 'N/A',
      r.parent_email || 'N/A',
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}-registrants-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: `Exported ${selectedRegistrants.length} registrants to CSV`,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
    > = {
      confirmed: { variant: 'default', label: 'Confirmed' },
      pending: { variant: 'secondary', label: 'Pending' },
      waitlisted: { variant: 'outline', label: 'Waitlisted' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
      completed: { variant: 'default', label: 'Completed' },
      registered: { variant: 'default', label: 'Registered' },
    };

    const config = statusConfig[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSelectedEmails = () => {
    return filteredRegistrants.filter(r => selectedIds.has(r.id)).map(r => r.email);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Registrants Management
        </CardTitle>
        <CardDescription>
          View and manage all registrants for sessions, events, and courses. Send batch messages and
          export data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={entityType} onValueChange={v => setEntityType(v as EntityType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sessions">
              <Calendar className="w-4 h-4 mr-2" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="courses">
              <BookOpen className="w-4 h-4 mr-2" />
              Courses
            </TabsTrigger>
          </TabsList>

          <TabsContent value={entityType} className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-end gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name, email, or entity..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-[180px]">
                <Label htmlFor="status">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="waitlisted">Waitlisted</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Entity Filter */}
              <div className="w-[250px]">
                <Label htmlFor="entity">
                  {entityType === 'sessions'
                    ? 'Session'
                    : entityType === 'events'
                      ? 'Event'
                      : 'Course'}
                </Label>
                <Select value={filterEntity} onValueChange={setFilterEntity}>
                  <SelectTrigger id="entity">
                    <SelectValue placeholder={`All ${entityType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
                    </SelectItem>
                    {entities.map(entity => (
                      <SelectItem key={entity.id} value={String(entity.id)}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Refresh */}
              <Button variant="outline" onClick={fetchRegistrants} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Filter className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {selectedIds.size} selected
                </span>
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowBatchMessage(true)}>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          filteredRegistrants.length > 0 &&
                          selectedIds.size === filteredRegistrants.length
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>
                      {entityType === 'sessions'
                        ? 'Session'
                        : entityType === 'events'
                          ? 'Event'
                          : 'Course'}
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    {entityType === 'sessions' && <TableHead>Age</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredRegistrants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No registrants found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRegistrants.map(registrant => (
                      <TableRow key={registrant.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(registrant.id)}
                            onCheckedChange={() => toggleSelect(registrant.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {registrant.full_name || registrant.user_name}
                          {registrant.age && registrant.age < 13 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Minor
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{registrant.email}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {registrant.entity_name}
                        </TableCell>
                        <TableCell>{getStatusBadge(registrant.status)}</TableCell>
                        <TableCell>
                          {format(new Date(registrant.registered_at), 'MMM d, yyyy')}
                        </TableCell>
                        {entityType === 'sessions' && (
                          <TableCell>{registrant.age || 'N/A'}</TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Total: {filteredRegistrants.length} registrants
                {searchQuery || filterStatus !== 'all' || filterEntity !== 'all'
                  ? ` (filtered from ${registrants.length})`
                  : ''}
              </span>
              <span>{selectedIds.size > 0 && `${selectedIds.size} selected`}</span>
            </div>
          </TabsContent>
        </Tabs>

        {/* Batch Message Dialog */}
        {showBatchMessage && (
          <BatchMessageDialog
            isOpen={showBatchMessage}
            onClose={() => setShowBatchMessage(false)}
            recipients={getSelectedEmails()}
            entityType={entityType}
            onSuccess={() => {
              setSelectedIds(new Set());
              toast({
                title: 'Messages Sent',
                description: `Successfully sent messages to ${selectedIds.size} recipients`,
              });
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
