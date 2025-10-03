import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDownloads, formatFileSize } from '@/hooks/useDownloads';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Download,
  Search,
  Trash2,
  RefreshCw,
  FileText,
  Video,
  File,
  HardDrive,
  Calendar,
  Eye,
  Loader2,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileType, DownloadWithRelations } from '@/types/content-access';
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

export default function DownloadsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<FileType | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [clearAllDialog, setClearAllDialog] = useState(false);

  const { downloads, loading, stats, deleteDownload, clearAllDownloads } = useDownloads({
    filters: {
      file_type: selectedType !== 'all' ? selectedType : undefined,
      search: searchQuery || undefined,
    },
  });

  const handleRedownload = (download: DownloadWithRelations) => {
    const link = document.createElement('a');
    link.href = download.downloaded_url;
    link.download = download.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDownload(id);
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting download:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllDownloads();
      setClearAllDialog(false);
    } catch (error) {
      console.error('Error clearing downloads:', error);
    }
  };

  const getFileIcon = (type: FileType | null) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5 text-blue-500" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'presentation':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'document':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
                <Download className="inline h-8 w-8 mr-2" />
                Download History
              </h1>
              <p className="text-white/80">
                Track and manage your downloaded materials
              </p>
            </div>

            {stats && (
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Files:</span>
                    <span className="font-bold">{stats.total_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Size:</span>
                    <span className="font-bold">{formatFileSize(stats.total_size)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Videos:</span>
                    <span className="font-bold">{stats.by_type.video || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>PDFs:</span>
                    <span className="font-bold">{stats.by_type.pdf || 0}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Most Accessed */}
        {stats && stats.most_accessed.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Most Accessed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.most_accessed.slice(0, 3).map((item) => (
                  <div
                    key={item.material_id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.material_title}</p>
                      <p className="text-sm text-muted-foreground">
                        Accessed {item.access_count} time{item.access_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge variant="secondary">{item.access_count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search downloads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="pdf">PDFs</SelectItem>
                  <SelectItem value="presentation">Presentations</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Downloads List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {downloads.length} Download{downloads.length !== 1 ? 's' : ''}
                </CardTitle>
                <CardDescription>
                  Your download history and file access tracking
                </CardDescription>
              </div>
              {downloads.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setClearAllDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {downloads.length === 0 ? (
              <div className="text-center py-12">
                <Download className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || selectedType !== 'all'
                    ? 'No downloads match your filters'
                    : 'No downloads yet. Downloaded materials will appear here!'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {downloads.map((download) => (
                    <div
                      key={download.id}
                      className="group border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-2">
                            {getFileIcon(download.file_type)}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{download.file_name}</h3>
                              {download.material?.title && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {download.material.title}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                            {download.file_size && (
                              <div className="flex items-center gap-1">
                                <HardDrive className="h-3 w-3" />
                                {formatFileSize(download.file_size)}
                              </div>
                            )}
                            {download.file_type && (
                              <Badge variant="outline" className="text-xs">
                                {download.file_type}
                              </Badge>
                            )}
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {download.access_count} time{download.access_count !== 1 ? 's' : ''}
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Downloaded: {formatDate(download.download_date)}
                            </div>
                            {download.last_accessed && (
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                Last accessed: {formatDate(download.last_accessed)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRedownload(download)}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Re-download
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(download.id)}
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

      {/* Delete Single Download Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Download Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this download from your history. The file itself won't be deleted from your device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Dialog */}
      <AlertDialog open={clearAllDialog} onOpenChange={setClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Download History?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove all download records from your history. Downloaded files on your device won't be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
