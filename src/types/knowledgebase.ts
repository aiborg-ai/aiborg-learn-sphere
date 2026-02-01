/**
 * Knowledgebase Types
 * Type definitions for the Knowledgebase feature
 */

export type KnowledgebaseTopicType = 'pioneers' | 'events' | 'companies' | 'research';

export type KnowledgebaseStatus = 'draft' | 'published' | 'archived';

// Topic-specific metadata interfaces
export interface PioneerMetadata {
  awards?: string[];
  affiliations?: string[];
  birth_year?: number | null;
  country?: string;
  specialty?: string;
  social_links?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

export interface EventMetadata {
  start_date?: string;
  end_date?: string;
  location?: string;
  venue?: string;
  website?: string;
  is_virtual?: boolean;
  registration_url?: string;
  attendees_count?: number;
}

export interface CompanyMetadata {
  founded_year?: number | null;
  headquarters?: string;
  website?: string;
  employees?: string;
  funding?: string;
  products?: string[];
  ceo?: string;
  stock_ticker?: string;
}

export interface ResearchMetadata {
  authors?: string[];
  publication_date?: string;
  journal?: string;
  doi?: string;
  citations?: number | null;
  abstract?: string;
  pdf_url?: string;
  arxiv_id?: string;
}

export type KnowledgebaseMetadata =
  | PioneerMetadata
  | EventMetadata
  | CompanyMetadata
  | ResearchMetadata;

export interface KnowledgebaseEntry {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  topic_type: KnowledgebaseTopicType;
  featured_image: string | null;
  thumbnail_url: string | null;
  gallery_images: string[];
  meta_title: string | null;
  meta_description: string | null;
  status: KnowledgebaseStatus;
  published_at: string | null;
  featured_order: number;
  is_featured: boolean;
  view_count: number;
  tags: string[];
  metadata: KnowledgebaseMetadata;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface KnowledgebaseFilters {
  topic_type?: KnowledgebaseTopicType;
  status?: KnowledgebaseStatus;
  search?: string;
  tags?: string[];
  is_featured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'latest' | 'popular' | 'featured' | 'alphabetical';
}

export interface KnowledgebaseTopicStats {
  topic_type: KnowledgebaseTopicType;
  published_count: number;
  draft_count: number;
  total_count: number;
  total_views: number;
}

export interface KnowledgebaseStats {
  total_entries: number;
  total_views: number;
  published_count: number;
  draft_count: number;
  by_topic: KnowledgebaseTopicStats[];
  featured_count: number;
}

// Topic configuration for UI display
export interface TopicConfig {
  type: KnowledgebaseTopicType;
  label: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  route: string;
}

export const TOPIC_CONFIGS: TopicConfig[] = [
  {
    type: 'pioneers',
    label: 'AI Pioneers',
    description: 'Influential figures shaping the AI revolution',
    icon: 'Users',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    route: '/knowledgebase/pioneers',
  },
  {
    type: 'events',
    label: 'AI Events',
    description: 'Conferences, summits, and meetups',
    icon: 'Calendar',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    route: '/knowledgebase/events',
  },
  {
    type: 'companies',
    label: 'AI Companies',
    description: 'Leading companies and innovative startups',
    icon: 'Building2',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    route: '/knowledgebase/companies',
  },
  {
    type: 'research',
    label: 'AI Research',
    description: 'Landmark papers and breakthroughs',
    icon: 'FileText',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    route: '/knowledgebase/research',
  },
];

export function getTopicConfig(type: KnowledgebaseTopicType): TopicConfig | undefined {
  return TOPIC_CONFIGS.find(config => config.type === type);
}
