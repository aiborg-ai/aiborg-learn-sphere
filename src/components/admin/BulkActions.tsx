import React, { useState, useEffect } from 'react';
import {
  CheckSquare, Square, Trash2, Download, Upload, Edit,
  Archive, Eye, EyeOff, Tag, Copy, AlertCircle, Check,
  X, Filter, MoreHorizontal, ChevronDown, Search, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

import { logger } from '@/utils/logger';
interface BulkItem {
  id: string;
  title?: string; // For courses
  name?: string; // For events
  description: string;
  category: string;
  price: string;
  date: string;
  status: 'active' | 'inactive' | 'draft';
  is_featured: boolean;
  type: 'course' | 'event';
  created_at: string;
  updated_at: string;
}

interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'default' | 'destructive';
  requiresConfirmation?: boolean;
  action: (items: BulkItem[]) => Promise<void>;
}

export function BulkActions() {
  const { toast } = useToast();
  const [items, setItems] = useState<BulkItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'course' | 'event'>('all');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [filterCategory, filterStatus, filterType]);

  const fetchItems = async () => {
    try {
      setIsLoading(true);

      // Fetch courses
      let coursesQuery = supabase
        .from('courses')
        .select('*');

      if (filterCategory !== 'all') {
        coursesQuery = coursesQuery.eq('category', filterCategory);
      }

      const { data: courses } = await coursesQuery;

      // Fetch events
      let eventsQuery = supabase
        .from('events')
        .select('*');

      if (filterCategory !== 'all') {
        eventsQuery = eventsQuery.eq('category', filterCategory);
      }

      const { data: events } = await eventsQuery;

      // Combine and format items
      const allItems: BulkItem[] = [];

      if (filterType === 'all' || filterType === 'course') {
        courses?.forEach(course => {
          allItems.push({
            id: course.id,
            title: course.title,
            description: course.description,
            category: course.category,
            price: course.price || 'Free',
            date: course.start_date,
            status: course.is_active ? 'active' : 'inactive',
            is_featured: course.is_featured || false,
            type: 'course',
            created_at: course.created_at,
            updated_at: course.updated_at
          });
        });
      }

      if (filterType === 'all' || filterType === 'event') {
        events?.forEach(event => {
          allItems.push({
            id: event.id,
            name: event.name,
            description: event.description,
            category: event.category,
            price: event.price || 'Free',
            date: event.date,
            status: event.is_active ? 'active' : 'inactive',
            is_featured: event.is_featured || false,
            type: 'event',
            created_at: event.created_at,
            updated_at: event.updated_at
          });
        });
      }

      // Apply status filter
      const filteredItems = filterStatus === 'all'
        ? allItems
        : allItems.filter(item => item.status === filterStatus);

      setItems(filteredItems);
    } catch (error) {
      logger.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch items',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const bulkActions: BulkAction[] = [
    {
      id: 'export',
      label: 'Export Selected',
      icon: <Download className="h-4 w-4" />,
      action: async (items) => {
        const exportData = {
          courses: items.filter(i => i.type === 'course'),
          events: items.filter(i => i.type === 'event')
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulk-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: 'Export Successful',
          description: `Exported ${items.length} items`
        });
      }
    },
    {
      id: 'activate',
      label: 'Activate',
      icon: <Check className="h-4 w-4" />,
      action: async (items) => {
        const courseIds = items.filter(i => i.type === 'course').map(i => i.id);
        const eventIds = items.filter(i => i.type === 'event').map(i => i.id);

        if (courseIds.length > 0) {
          await supabase
            .from('courses')
            .update({ is_active: true })
            .in('id', courseIds);
        }

        if (eventIds.length > 0) {
          await supabase
            .from('events')
            .update({ is_active: true })
            .in('id', eventIds);
        }

        toast({
          title: 'Items Activated',
          description: `Activated ${items.length} items`
        });

        await fetchItems();
      }
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      icon: <X className="h-4 w-4" />,
      action: async (items) => {
        const courseIds = items.filter(i => i.type === 'course').map(i => i.id);
        const eventIds = items.filter(i => i.type === 'event').map(i => i.id);

        if (courseIds.length > 0) {
          await supabase
            .from('courses')
            .update({ is_active: false })
            .in('id', courseIds);
        }

        if (eventIds.length > 0) {
          await supabase
            .from('events')
            .update({ is_active: false })
            .in('id', eventIds);
        }

        toast({
          title: 'Items Deactivated',
          description: `Deactivated ${items.length} items`
        });

        await fetchItems();
      }
    },
    {
      id: 'feature',
      label: 'Feature',
      icon: <Eye className="h-4 w-4" />,
      action: async (items) => {
        const courseIds = items.filter(i => i.type === 'course').map(i => i.id);
        const eventIds = items.filter(i => i.type === 'event').map(i => i.id);

        if (courseIds.length > 0) {
          await supabase
            .from('courses')
            .update({ is_featured: true })
            .in('id', courseIds);
        }

        if (eventIds.length > 0) {
          await supabase
            .from('events')
            .update({ is_featured: true })
            .in('id', eventIds);
        }

        toast({
          title: 'Items Featured',
          description: `Featured ${items.length} items`
        });

        await fetchItems();
      }
    },
    {
      id: 'unfeature',
      label: 'Unfeature',
      icon: <EyeOff className="h-4 w-4" />,
      action: async (items) => {
        const courseIds = items.filter(i => i.type === 'course').map(i => i.id);
        const eventIds = items.filter(i => i.type === 'event').map(i => i.id);

        if (courseIds.length > 0) {
          await supabase
            .from('courses')
            .update({ is_featured: false })
            .in('id', courseIds);
        }

        if (eventIds.length > 0) {
          await supabase
            .from('events')
            .update({ is_featured: false })
            .in('id', eventIds);
        }

        toast({
          title: 'Items Unfeatured',
          description: `Unfeatured ${items.length} items`
        });

        await fetchItems();
      }
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: <Copy className="h-4 w-4" />,
      action: async (items) => {
        for (const item of items) {
          const newItem = { ...item };
          delete newItem.id;
          delete newItem.created_at;
          delete newItem.updated_at;

          if (item.type === 'course') {
            newItem.title = `${newItem.title} (Copy)`;
            await supabase.from('courses').insert(newItem);
          } else {
            newItem.name = `${newItem.name} (Copy)`;
            await supabase.from('events').insert(newItem);
          }
        }

        toast({
          title: 'Items Duplicated',
          description: `Created ${items.length} copies`
        });

        await fetchItems();
      }
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: <Archive className="h-4 w-4" />,
      action: async (items) => {
        const courseIds = items.filter(i => i.type === 'course').map(i => i.id);
        const eventIds = items.filter(i => i.type === 'event').map(i => i.id);

        if (courseIds.length > 0) {
          await supabase
            .from('courses')
            .update({ is_active: false, display: false })
            .in('id', courseIds);
        }

        if (eventIds.length > 0) {
          await supabase
            .from('events')
            .update({ is_active: false, display: false })
            .in('id', eventIds);
        }

        toast({
          title: 'Items Archived',
          description: `Archived ${items.length} items`
        });

        await fetchItems();
      }
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      requiresConfirmation: true,
      action: async (items) => {
        const courseIds = items.filter(i => i.type === 'course').map(i => i.id);
        const eventIds = items.filter(i => i.type === 'event').map(i => i.id);

        if (courseIds.length > 0) {
          await supabase
            .from('courses')
            .delete()
            .in('id', courseIds);
        }

        if (eventIds.length > 0) {
          await supabase
            .from('events')
            .delete()
            .in('id', eventIds);
        }

        toast({
          title: 'Items Deleted',
          description: `Deleted ${items.length} items`,
          variant: 'destructive'
        });

        setSelectedItems(new Set());
        await fetchItems();
      }
    }
  ];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkAction = async (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setPendingAction(action);
      setShowConfirmDialog(true);
    } else {
      await executeBulkAction(action);
    }
  };

  const executeBulkAction = async (action: BulkAction) => {
    try {
      setIsProcessing(true);
      const selectedItemsArray = items.filter(item => selectedItems.has(item.id));
      await action.action(selectedItemsArray);
      setSelectedItems(new Set());
    } catch (error) {
      logger.error('Bulk action error:', error);
      toast({
        title: 'Action Failed',
        description: 'Failed to complete bulk action',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  const filteredItems = items.filter(item => {
    const searchMatch = searchTerm === '' ||
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    return searchMatch;
  });

  const categories = ['all', 'Technology', 'Business', 'Design', 'Marketing', 'Finance', 'Health', 'Education'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Bulk Actions</h2>
          <p className="text-muted-foreground mt-1">
            Select multiple items to perform actions in bulk
          </p>
        </div>
        <Button onClick={fetchItems} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter items to find what you need
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="course">Courses</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
          </AlertTitle>
          <AlertDescription className="mt-2">
            <div className="flex flex-wrap gap-2">
              {bulkActions.map(action => (
                <Button
                  key={action.id}
                  size="sm"
                  variant={action.variant || 'outline'}
                  onClick={() => handleBulkAction(action)}
                  disabled={isProcessing}
                >
                  {action.icon}
                  <span className="ml-2">{action.label}</span>
                </Button>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Items Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Title/Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.title || item.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {item.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.type === 'course' ? 'Course' : 'Event'}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.price}</TableCell>
                  <TableCell>{format(new Date(item.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.is_featured ? (
                      <Badge variant="default">Featured</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No items found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to {pendingAction?.label.toLowerCase()} {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={pendingAction?.variant || 'default'}
              onClick={() => pendingAction && executeBulkAction(pendingAction)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}