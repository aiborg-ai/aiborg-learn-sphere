import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Megaphone, ToggleLeft, ToggleRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  priority: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AnnouncementManagementProps {
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  userId?: string;
  onRefresh: () => void;
}

export function AnnouncementManagement({
  announcements,
  setAnnouncements,
  userId,
  onRefresh
}: AnnouncementManagementProps) {
  const [loading, setLoading] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 1
  });
  const { toast } = useToast();

  const createAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          priority: newAnnouncement.priority,
          is_active: true,
          created_by: userId
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement created successfully",
      });

      onRefresh();
      setNewAnnouncement({ title: '', content: '', priority: 1 });
    } catch (error) {
      logger.error('Error creating announcement:', error);
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const toggleAnnouncementStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setAnnouncements(announcements.map(a =>
        a.id === id ? { ...a, is_active: !currentStatus } : a
      ));

      toast({
        title: "Success",
        description: "Announcement status updated",
      });
    } catch (error) {
      logger.error('Error updating announcement:', error);
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-white/95 backdrop-blur">
      <CardHeader>
        <CardTitle>Announcements</CardTitle>
        <CardDescription>Manage system announcements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={createAnnouncement} className="space-y-4">
          <div>
            <Label htmlFor="announcement-title">Title</Label>
            <Input
              id="announcement-title"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="announcement-content">Content</Label>
            <Textarea
              id="announcement-content"
              value={newAnnouncement.content}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="announcement-priority">Priority</Label>
            <Input
              id="announcement-priority"
              type="number"
              min="1"
              max="10"
              value={newAnnouncement.priority}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: parseInt(e.target.value) })}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading && <Megaphone className="mr-2 h-4 w-4 animate-spin" />}
            Create Announcement
          </Button>
        </form>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell className="font-medium">{announcement.title}</TableCell>
                  <TableCell className="max-w-md truncate">{announcement.content}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{announcement.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={announcement.is_active ? "success" : "secondary"}>
                      {announcement.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAnnouncementStatus(announcement.id, announcement.is_active)}
                    >
                      {announcement.is_active ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}