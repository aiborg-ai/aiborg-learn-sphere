/**
 * Knowledgebase Entry Manager Component
 * Manage entries for a specific topic type
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreHorizontal,
  Search,
  Filter,
  Calendar,
  Clock,
  FileText,
  Copy,
  ExternalLink,
  Star,
} from '@/components/ui/icons';
import KnowledgebaseEntryEditor from './KnowledgebaseEntryEditor';
import { format } from 'date-fns';
import { logger } from '@/utils/logger';
import type { KnowledgebaseEntry, KnowledgebaseTopicType } from '@/types/knowledgebase';
import { getTopicConfig } from '@/types/knowledgebase';

interface KnowledgebaseEntryManagerProps {
  topicType: KnowledgebaseTopicType;
}

function KnowledgebaseEntryManager({ topicType }: KnowledgebaseEntryManagerProps) {
  const [entries, setEntries] = useState<KnowledgebaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgebaseEntry | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const { toast } = useToast();

  const topicConfig = getTopicConfig(topicType);

  useEffect(() => {
    fetchEntries();
  }, [topicType, statusFilter]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('knowledgebase_entries')
        .select('*')
        .eq('topic_type', topicType)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries((data as KnowledgebaseEntry[]) || []);
    } catch (err) {
      logger.error('Error fetching entries:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch entries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const { error } = await supabase.from('knowledgebase_entries').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Entry deleted successfully',
      });
      fetchEntries();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete entry',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updateData: { status: string; published_at?: string } = { status };

      if (status === 'published') {
        const entry = entries.find(e => e.id === id);
        if (!entry?.published_at) {
          updateData.published_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('knowledgebase_entries')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Entry ${status === 'published' ? 'published' : `changed to ${status}`} successfully`,
      });
      fetchEntries();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update entry status',
        variant: 'destructive',
      });
    }
  };

  const toggleFeatured = async (id: string, is_featured: boolean) => {
    try {
      const { error } = await supabase
        .from('knowledgebase_entries')
        .update({ is_featured: !is_featured })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Entry ${!is_featured ? 'featured' : 'unfeatured'} successfully`,
      });
      fetchEntries();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update featured status',
        variant: 'destructive',
      });
    }
  };

  const duplicateEntry = async (entry: KnowledgebaseEntry) => {
    try {
      const newEntry = {
        ...entry,
        id: undefined,
        title: `${entry.title} (Copy)`,
        slug: `${entry.slug}-copy-${Date.now()}`,
        status: 'draft' as const,
        published_at: null,
        view_count: 0,
        created_at: undefined,
        updated_at: undefined,
      };

      const { error } = await supabase.from('knowledgebase_entries').insert(newEntry);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Entry duplicated successfully',
      });
      fetchEntries();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to duplicate entry',
        variant: 'destructive',
      });
    }
  };

  const filteredEntries = entries.filter(
    entry =>
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/20 text-green-600';
      case 'draft':
        return 'bg-gray-500/20 text-gray-600';
      case 'archived':
        return 'bg-red-500/20 text-red-600';
      default:
        return 'bg-gray-500/20 text-gray-600';
    }
  };

  if (showEditor) {
    return (
      <KnowledgebaseEntryEditor
        entry={selectedEntry}
        topicType={topicType}
        onClose={() => {
          setShowEditor(false);
          setSelectedEntry(null);
          fetchEntries();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage {topicConfig?.label}</h2>
        <Button onClick={() => setShowEditor(true)} className="btn-hero">
          <Plus className="mr-2 h-4 w-4" />
          Add {topicConfig?.label.replace('AI ', '')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No entries found</p>
              <Button onClick={() => setShowEditor(true)} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create your first entry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{entry.title}</p>
                          {entry.is_featured && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{entry.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(entry.status)}>{entry.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <Eye className="h-3 w-3" />
                          {entry.view_count || 0} views
                        </div>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            {entry.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {entry.tags.length > 2 && (
                              <span className="text-muted-foreground">
                                +{entry.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {entry.published_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(entry.published_at), 'MMM d, yyyy')}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated {format(new Date(entry.updated_at), 'MMM d')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedEntry(entry);
                              setShowEditor(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a
                              href={`/knowledgebase/${topicType}/${entry.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateEntry(entry)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => toggleFeatured(entry.id, entry.is_featured)}
                          >
                            {entry.is_featured ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Unfeature
                              </>
                            ) : (
                              <>
                                <Star className="mr-2 h-4 w-4" />
                                Feature
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {entry.status !== 'published' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(entry.id, 'published')}
                            >
                              Publish
                            </DropdownMenuItem>
                          )}
                          {entry.status !== 'draft' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(entry.id, 'draft')}>
                              Convert to Draft
                            </DropdownMenuItem>
                          )}
                          {entry.status !== 'archived' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(entry.id, 'archived')}
                            >
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(entry.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default KnowledgebaseEntryManager;
