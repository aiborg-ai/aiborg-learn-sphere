/**
 * Summit Resource Hub Types
 * Type definitions for the India AI Impact Summit - Seven Chakras Resource Hub
 */

// Resource types available
export type SummitResourceType =
  | 'article'
  | 'paper'
  | 'case-study'
  | 'video'
  | 'tool'
  | 'official-doc'
  | 'dataset'
  | 'report';

export type SummitResourceStatus = 'draft' | 'published';

// Theme (Chakra) interface
export interface SummitTheme {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  sort_order: number;
  resource_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Resource interface
export interface SummitResource {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  url: string;
  theme_id: string;
  resource_type: SummitResourceType;
  source: string | null;
  status: SummitResourceStatus;
  is_featured: boolean;
  featured_order: number;
  view_count: number;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  // Joined fields
  theme?: SummitTheme;
}

// Filters for querying resources
export interface SummitResourceFilters {
  theme_id?: string;
  theme_slug?: string;
  resource_type?: SummitResourceType;
  status?: SummitResourceStatus;
  search?: string;
  tags?: string[];
  is_featured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'latest' | 'popular' | 'featured' | 'alphabetical';
}

// Statistics for themes
export interface SummitThemeStats {
  theme_id: string;
  theme_slug: string;
  theme_name: string;
  published_count: number;
  draft_count: number;
  total_count: number;
  total_views: number;
}

// Overall statistics
export interface SummitStats {
  total_resources: number;
  total_views: number;
  published_count: number;
  draft_count: number;
  featured_count: number;
  by_theme: SummitThemeStats[];
  by_type: { type: SummitResourceType; count: number }[];
}

// Theme configuration for UI display
export interface SummitThemeConfig {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

// Resource type configuration for UI display
export interface ResourceTypeConfig {
  type: SummitResourceType;
  label: string;
  icon: string;
  color: string;
}

// Theme configurations with colors for UI
export const SUMMIT_THEME_CONFIGS: Record<string, Partial<SummitThemeConfig>> = {
  'safe-trusted-ai': {
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
  },
  'human-capital': {
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
  },
  science: {
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-200',
  },
  'resilience-innovation-efficiency': {
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
  },
  'inclusion-social-empowerment': {
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-600',
    borderColor: 'border-pink-200',
  },
  'democratizing-ai-resources': {
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-600',
    borderColor: 'border-cyan-200',
  },
  'economic-growth-social-good': {
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-200',
  },
};

// Resource type configurations
export const RESOURCE_TYPE_CONFIGS: ResourceTypeConfig[] = [
  { type: 'article', label: 'Article', icon: 'FileText', color: 'text-blue-500' },
  { type: 'paper', label: 'Research Paper', icon: 'ScrollText', color: 'text-purple-500' },
  { type: 'case-study', label: 'Case Study', icon: 'BookOpen', color: 'text-green-500' },
  { type: 'video', label: 'Video', icon: 'Video', color: 'text-red-500' },
  { type: 'tool', label: 'Tool', icon: 'Wrench', color: 'text-orange-500' },
  { type: 'official-doc', label: 'Official Document', icon: 'FileCheck', color: 'text-indigo-500' },
  { type: 'dataset', label: 'Dataset', icon: 'Database', color: 'text-cyan-500' },
  { type: 'report', label: 'Report', icon: 'BarChart', color: 'text-amber-500' },
];

// Helper function to get theme colors
export function getThemeColors(slug: string): Partial<SummitThemeConfig> {
  return (
    SUMMIT_THEME_CONFIGS[slug] || {
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-200',
    }
  );
}

// Helper function to get resource type config
export function getResourceTypeConfig(type: SummitResourceType): ResourceTypeConfig | undefined {
  return RESOURCE_TYPE_CONFIGS.find(config => config.type === type);
}

// Form data for creating/updating resources
export interface SummitResourceFormData {
  title: string;
  description: string;
  url: string;
  theme_id: string;
  resource_type: SummitResourceType;
  source: string;
  status: SummitResourceStatus;
  is_featured: boolean;
  tags: string[];
  metadata?: Record<string, unknown>;
}
