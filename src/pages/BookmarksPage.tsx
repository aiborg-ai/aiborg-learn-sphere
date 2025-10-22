/* eslint-disable jsx-a11y/prefer-tag-over-role */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Bookmark,
  Search,
  Folder,
  Tag,
  Video,
  FileText,
  BookOpen,
  Trash2,
  ExternalLink,
  Loader2,
  Filter,
} from 'lucide-react';
import type { BookmarkType, BookmarkWithRelations } from '@/types/content-access';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function BookmarksPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<BookmarkType | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { bookmarks, loading, stats, deleteBookmark, getFolders } = useBookmarks({
    filters: {
      bookmark_type: selectedType !== 'all' ? selectedType : undefined,
      folder: selectedFolder !== 'all' ? selectedFolder : undefined,
      search: searchQuery || undefined,
    },
  });

  const folders = getFolders();

  const handleBookmarkClick = (bookmark: BookmarkWithRelations) => {
    switch (bookmark.bookmark_type) {
      case 'course':
        if (bookmark.course_id) {
          navigate(`/course/${bookmark.course_id}`);
        }
        break;
      case 'material':
      case 'video_timestamp':
      case 'pdf_page':
        if (bookmark.material_id && bookmark.course?.id) {
          navigate(`/course/${bookmark.course?.id}?material=${bookmark.material_id}`);
        }
        break;
      case 'assignment':
        if (bookmark.assignment_id) {
          navigate(`/assignment/${bookmark.assignment_id}`);
        }
        break;
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    try {
      await deleteBookmark(id);
      setDeleteId(null);
    } catch (error) {
      logger.error('Error deleting bookmark:', error);
    }
  };

  const getBookmarkIcon = (type: BookmarkType) => {
    switch (type) {
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      case 'material':
        return <FileText className="h-4 w-4" />;
      case 'video_timestamp':
        // eslint-disable-next-line jsx-a11y/media-has-caption
        return <Video className="h-4 w-4" />;
      case 'pdf_page':
        return <FileText className="h-4 w-4" />;
      case 'assignment':
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatMetadata = (bookmark: BookmarkWithRelations) => {
    const parts: string[] = [];

    if (bookmark.metadata.timestamp) {
      const mins = Math.floor(bookmark.metadata.timestamp / 60);
      const secs = Math.floor(bookmark.metadata.timestamp % 60);
      parts.push(`${mins}:${String(secs).padStart(2, '0')}`);
    }

    if (bookmark.metadata.page) {
      parts.push(`Page ${bookmark.metadata.page}`);
    }

    return parts.join(' • ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            className="btn-outline-ai mb-4"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">
                <Bookmark className="inline h-8 w-8 mr-2" />
                My Bookmarks
              </h1>
              <p className="text-white/80">
                Quick access to your saved courses, materials, and content
              </p>
            </div>

            {stats && (
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total:</span>
                    <span className="font-bold">{stats.total_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Recent:</span>
                    <span className="font-bold">{stats.recent_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Folders:</span>
                    <span className="font-bold">{Object.keys(stats.by_folder).length}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bookmarks..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Folder Filter */}
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="All Folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Folders</SelectItem>
                  {folders.map(folder => (
                    <SelectItem key={folder} value={folder}>
                      <Folder className="inline h-3 w-3 mr-2" />
                      {folder}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select
                value={selectedType}
                onValueChange={v => setSelectedType(v as BookmarkType | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="course">Courses</SelectItem>
                  <SelectItem value="material">Materials</SelectItem>
                  <SelectItem value="video_timestamp">Videos</SelectItem>
                  <SelectItem value="pdf_page">PDFs</SelectItem>
                  <SelectItem value="assignment">Assignments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookmarks List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {bookmarks.length} Bookmark{bookmarks.length !== 1 ? 's' : ''}
            </CardTitle>
            <CardDescription>Click on any bookmark to navigate to that content</CardDescription>
          </CardHeader>
          <CardContent>
            {bookmarks.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || selectedFolder !== 'all' || selectedType !== 'all'
                    ? 'No bookmarks match your filters'
                    : 'No bookmarks yet. Start bookmarking content to see them here!'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {bookmarks.map(bookmark => (
                    <div
                      key={bookmark.id}
                      className="group border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="flex-1 min-w-0"
                          onClick={() => handleBookmarkClick(bookmark)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleBookmarkClick(bookmark);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          {/* Header */}
                          <div className="flex items-center gap-2 mb-2">
                            {getBookmarkIcon(bookmark.bookmark_type)}
                            <h3 className="font-medium truncate">{bookmark.title}</h3>
                          </div>

                          {/* Note */}
                          {bookmark.note && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {bookmark.note}
                            </p>
                          )}

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {bookmark.bookmark_type.replace('_', ' ')}
                            </Badge>

                            <Badge variant="secondary" className="text-xs">
                              <Folder className="h-3 w-3 mr-1" />
                              {bookmark.folder}
                            </Badge>

                            {formatMetadata(bookmark) && (
                              <span className="text-xs text-muted-foreground">
                                {formatMetadata(bookmark)}
                              </span>
                            )}

                            {bookmark.tags.length > 0 && (
                              <div className="flex gap-1">
                                {bookmark.tags.slice(0, 3).map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                                {bookmark.tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{bookmark.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Date */}
                          <p className="text-xs text-muted-foreground">
                            Added {formatDate(bookmark.created_at)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              handleBookmarkClick(bookmark);
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={e => {
                              e.stopPropagation();
                              setDeleteId(bookmark.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bookmark?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this bookmark. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteBookmark(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
