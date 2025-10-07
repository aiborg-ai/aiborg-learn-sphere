export interface BulkItem {
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

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'default' | 'destructive';
  requiresConfirmation?: boolean;
  action: (items: BulkItem[]) => Promise<void>;
}

export type FilterType = 'all' | 'course' | 'event';
