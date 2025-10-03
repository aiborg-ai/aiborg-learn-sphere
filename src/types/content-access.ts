/**
 * TypeScript types for Student Content Access Features
 * Tables: bookmarks, downloads, watch_later, playlists, playlist_items
 */

// ============================================================================
// BOOKMARKS
// ============================================================================

export type BookmarkType = 'course' | 'material' | 'video_timestamp' | 'pdf_page' | 'assignment';

export interface BookmarkMetadata {
  // Video timestamp metadata
  timestamp?: number;
  chapter?: string;

  // PDF page metadata
  page?: number;
  scroll_position?: number;

  // Material section metadata
  section?: string;

  // Generic metadata
  [key: string]: unknown;
}

export interface Bookmark {
  id: string;
  user_id: string;
  bookmark_type: BookmarkType;

  // References (only one will be populated based on type)
  course_id: number | null;
  material_id: string | null;
  assignment_id: string | null;

  // Type-specific metadata
  metadata: BookmarkMetadata;

  // User organization
  title: string;
  note: string | null;
  tags: string[];
  folder: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface BookmarkWithRelations extends Bookmark {
  course?: {
    id: number;
    title: string;
    thumbnail?: string;
  };
  material?: {
    id: string;
    title: string;
    material_type: string;
    file_url: string;
  };
  assignment?: {
    id: string;
    title: string;
    due_date: string;
  };
}

export interface CreateBookmarkInput {
  bookmark_type: BookmarkType;
  course_id?: number;
  material_id?: string;
  assignment_id?: string;
  metadata?: BookmarkMetadata;
  title: string;
  note?: string;
  tags?: string[];
  folder?: string;
}

export interface UpdateBookmarkInput {
  title?: string;
  note?: string;
  tags?: string[];
  folder?: string;
  metadata?: BookmarkMetadata;
}

// ============================================================================
// DOWNLOADS
// ============================================================================

export type FileType = 'video' | 'pdf' | 'presentation' | 'document' | 'other';

export interface DownloadDeviceInfo {
  user_agent?: string;
  platform?: string;
  screen_resolution?: string;
  [key: string]: unknown;
}

export interface Download {
  id: string;
  user_id: string;
  material_id: string;
  course_id: number | null;

  // File metadata
  file_name: string;
  file_size: number | null; // bytes
  file_type: FileType | null;
  downloaded_url: string;
  mime_type: string | null;

  // Tracking
  download_date: string;
  last_accessed: string | null;
  access_count: number;

  // Offline availability
  is_available_offline: boolean;

  // Device info
  device_info: DownloadDeviceInfo;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface DownloadWithRelations extends Download {
  material?: {
    id: string;
    title: string;
    material_type: string;
    description: string | null;
  };
  course?: {
    id: number;
    title: string;
  };
}

export interface CreateDownloadInput {
  material_id: string;
  course_id?: number;
  file_name: string;
  file_size?: number;
  file_type?: FileType;
  downloaded_url: string;
  mime_type?: string;
  device_info?: DownloadDeviceInfo;
}

export interface UpdateDownloadAccessInput {
  last_accessed: string;
  access_count: number;
}

// ============================================================================
// WATCH LATER QUEUE
// ============================================================================

export interface WatchLater {
  id: string;
  user_id: string;
  material_id: string;
  course_id: number | null;
  queue_position: number;
  note: string | null;
  added_at: string;
}

export interface WatchLaterWithRelations extends WatchLater {
  material?: {
    id: string;
    title: string;
    description: string | null;
    material_type: string;
    file_url: string;
    duration: number | null;
  };
  course?: {
    id: number;
    title: string;
  };
}

export interface AddToWatchLaterInput {
  material_id: string;
  course_id?: number;
  note?: string;
}

export interface UpdateWatchLaterPositionInput {
  id: string;
  queue_position: number;
}

// ============================================================================
// PLAYLISTS
// ============================================================================

export interface Playlist {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  thumbnail_url: string | null;
  item_count: number;
  total_duration: number; // seconds
  created_at: string;
  updated_at: string;
}

export interface PlaylistWithRelations extends Playlist {
  items?: PlaylistItemWithRelations[];
  user?: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface CreatePlaylistInput {
  title: string;
  description?: string;
  is_public?: boolean;
  thumbnail_url?: string;
}

export interface UpdatePlaylistInput {
  title?: string;
  description?: string;
  is_public?: boolean;
  thumbnail_url?: string;
}

// ============================================================================
// PLAYLIST ITEMS
// ============================================================================

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  material_id: string;
  position: number;
  note: string | null;
  start_time: number | null; // For videos
  end_time: number | null; // For videos
  added_at: string;
}

export interface PlaylistItemWithRelations extends PlaylistItem {
  material?: {
    id: string;
    title: string;
    description: string | null;
    material_type: string;
    file_url: string;
    duration: number | null;
    file_size: number | null;
  };
}

export interface AddToPlaylistInput {
  playlist_id: string;
  material_id: string;
  position?: number; // If not provided, append to end
  note?: string;
  start_time?: number;
  end_time?: number;
}

export interface UpdatePlaylistItemInput {
  position?: number;
  note?: string;
  start_time?: number;
  end_time?: number;
}

export interface ReorderPlaylistItemsInput {
  items: Array<{
    id: string;
    position: number;
  }>;
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

export interface BookmarkFilters {
  bookmark_type?: BookmarkType;
  course_id?: number;
  folder?: string;
  tags?: string[];
  search?: string; // Search in title and note
}

export interface DownloadFilters {
  course_id?: number;
  file_type?: FileType;
  date_from?: string;
  date_to?: string;
  search?: string; // Search in file_name
}

export interface PlaylistFilters {
  is_public?: boolean;
  user_id?: string;
  search?: string; // Search in title and description
}

// ============================================================================
// STATS & ANALYTICS
// ============================================================================

export interface BookmarkStats {
  total_count: number;
  by_type: Record<BookmarkType, number>;
  by_folder: Record<string, number>;
  recent_count: number; // Last 7 days
}

export interface DownloadStats {
  total_count: number;
  total_size: number; // bytes
  by_type: Record<FileType, number>;
  most_accessed: Array<{
    material_id: string;
    material_title: string;
    access_count: number;
  }>;
}

export interface PlaylistStats {
  total_playlists: number;
  total_items: number;
  average_items_per_playlist: number;
  total_duration: number; // seconds
  public_playlists: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface BookmarksResponse extends PaginatedResponse<BookmarkWithRelations> {
  stats?: BookmarkStats;
}

export interface DownloadsResponse extends PaginatedResponse<DownloadWithRelations> {
  stats?: DownloadStats;
}

export interface PlaylistsResponse extends PaginatedResponse<PlaylistWithRelations> {
  stats?: PlaylistStats;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ContentAccessError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type ContentAccessResult<T> =
  | { success: true; data: T }
  | { success: false; error: ContentAccessError };
