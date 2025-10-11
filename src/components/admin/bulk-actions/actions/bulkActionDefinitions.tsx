import { Download, Check, X, Eye, EyeOff, Copy, Archive, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { BulkAction, BulkItem } from '../types';

interface ToastOptions {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

export const createBulkActions = (
  toast: (options: ToastOptions) => void,
  fetchItems: () => Promise<void>
): BulkAction[] => [
  {
    id: 'export',
    label: 'Export Selected',
    icon: <Download className="h-4 w-4" />,
    action: async (items: BulkItem[]) => {
      const exportData = {
        courses: items.filter(i => i.type === 'course'),
        events: items.filter(i => i.type === 'event'),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
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
        description: `Exported ${items.length} items`,
      });
    },
  },
  {
    id: 'activate',
    label: 'Activate',
    icon: <Check className="h-4 w-4" />,
    action: async (items: BulkItem[]) => {
      const courseIds = items.filter(i => i.type === 'course').map(i => i.id);
      const eventIds = items.filter(i => i.type === 'event').map(i => i.id);

      if (courseIds.length > 0) {
        await supabase.from('courses').update({ is_active: true }).in('id', courseIds);
      }

      if (eventIds.length > 0) {
        await supabase.from('events').update({ is_active: true }).in('id', eventIds);
      }

      toast({
        title: 'Items Activated',
        description: `Activated ${items.length} items`,
      });

      await fetchItems();
    },
  },
  {
    id: 'deactivate',
    label: 'Deactivate',
    icon: <X className="h-4 w-4" />,
    action: async (items: BulkItem[]) => {
      const courseIds = items.filter(i => i.type === 'course').map(i => i.id);
      const eventIds = items.filter(i => i.type === 'event').map(i => i.id);

      if (courseIds.length > 0) {
        await supabase.from('courses').update({ is_active: false }).in('id', courseIds);
      }

      if (eventIds.length > 0) {
        await supabase.from('events').update({ is_active: false }).in('id', eventIds);
      }

      toast({
        title: 'Items Deactivated',
        description: `Deactivated ${items.length} items`,
      });

      await fetchItems();
    },
  },
  {
    id: 'feature',
    label: 'Feature',
    icon: <Eye className="h-4 w-4" />,
    action: async (items: BulkItem[]) => {
      const courseIds = items.filter(i => i.type === 'course').map(i => i.id);
      const eventIds = items.filter(i => i.type === 'event').map(i => i.id);

      if (courseIds.length > 0) {
        await supabase.from('courses').update({ is_featured: true }).in('id', courseIds);
      }

      if (eventIds.length > 0) {
        await supabase.from('events').update({ is_featured: true }).in('id', eventIds);
      }

      toast({
        title: 'Items Featured',
        description: `Featured ${items.length} items`,
      });

      await fetchItems();
    },
  },
  {
    id: 'unfeature',
    label: 'Unfeature',
    icon: <EyeOff className="h-4 w-4" />,
    action: async (items: BulkItem[]) => {
      const courseIds = items.filter(i => i.type === 'course').map(i => i.id);
      const eventIds = items.filter(i => i.type === 'event').map(i => i.id);

      if (courseIds.length > 0) {
        await supabase.from('courses').update({ is_featured: false }).in('id', courseIds);
      }

      if (eventIds.length > 0) {
        await supabase.from('events').update({ is_featured: false }).in('id', eventIds);
      }

      toast({
        title: 'Items Unfeatured',
        description: `Unfeatured ${items.length} items`,
      });

      await fetchItems();
    },
  },
  {
    id: 'duplicate',
    label: 'Duplicate',
    icon: <Copy className="h-4 w-4" />,
    action: async (items: BulkItem[]) => {
      for (const item of items) {
        const { id, created_at, updated_at, ...itemWithoutMetadata } = item;

        if (item.type === 'course') {
          const courseData = {
            ...itemWithoutMetadata,
            title: `${item.title} (Copy)`,
          };
          await supabase.from('courses').insert(courseData);
        } else {
          const eventData = {
            ...itemWithoutMetadata,
            name: `${item.name} (Copy)`,
          };
          await supabase.from('events').insert(eventData);
        }
      }

      toast({
        title: 'Items Duplicated',
        description: `Created ${items.length} copies`,
      });

      await fetchItems();
    },
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: <Archive className="h-4 w-4" />,
    action: async (items: BulkItem[]) => {
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
          .update({ is_active: false, is_visible: false })
          .in('id', eventIds);
      }

      toast({
        title: 'Items Archived',
        description: `Archived ${items.length} items`,
      });

      await fetchItems();
    },
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    variant: 'destructive' as const,
    requiresConfirmation: true,
    action: async (items: BulkItem[]) => {
      const courseIds = items.filter(i => i.type === 'course').map(i => i.id);
      const eventIds = items.filter(i => i.type === 'event').map(i => i.id);

      if (courseIds.length > 0) {
        await supabase.from('courses').delete().in('id', courseIds);
      }

      if (eventIds.length > 0) {
        await supabase.from('events').delete().in('id', eventIds);
      }

      toast({
        title: 'Items Deleted',
        description: `Deleted ${items.length} items`,
        variant: 'destructive',
      });

      await fetchItems();
    },
  },
];
