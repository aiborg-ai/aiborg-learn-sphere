export interface BlogCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  color: string;
  icon: string | null;
  post_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlogTag {
  id: string;
  slug: string;
  name: string;
  post_count: number;
  created_at: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  author_id: string;
  category_id: string | null;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  published_at: string | null;
  scheduled_for: string | null;
  meta_title: string | null;
  meta_description: string | null;
  reading_time: number;
  view_count: number;
  is_featured: boolean;
  allow_comments: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  author_name?: string;
  author_avatar?: string;
  category_name?: string;
  category_slug?: string;
  category_color?: string;
  tags?: BlogTag[];
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_approved: boolean;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  user_name?: string;
  user_avatar?: string;
  replies?: BlogComment[];
}

export interface BlogLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface BlogShare {
  id: string;
  post_id: string;
  user_id: string | null;
  platform: 'email' | 'whatsapp' | 'twitter' | 'facebook' | 'linkedin' | 'copy_link';
  created_at: string;
}

export interface BlogBookmark {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface BlogFilters {
  category?: string;
  tags?: string[];
  search?: string;
  status?: 'draft' | 'published' | 'scheduled' | 'archived';
  author?: string;
  featured?: boolean;
  sortBy?: 'latest' | 'popular' | 'trending';
  page?: number;
  limit?: number;
}

export interface BlogStats {
  total_posts: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  posts_this_month: number;
  trending_posts: BlogPost[];
  popular_categories: BlogCategory[];
}