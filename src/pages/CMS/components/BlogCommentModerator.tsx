import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Check, X, Flag, Trash2, Eye } from 'lucide-react';

function BlogCommentModerator() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_comments')
        .select(`
          *,
          blog_posts!inner(title, slug),
          profiles!blog_comments_user_id_fkey(email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch comments',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCommentStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('blog_comments')
        .update({
          status,
          moderated_by: (await supabase.auth.getUser()).data.user?.id,
          moderated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Comment ${status}`
      });
      fetchComments();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update comment',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500/20 text-green-600">Approved</Badge>;
      case 'pending': return <Badge className="bg-yellow-500/20 text-yellow-600">Pending</Badge>;
      case 'spam': return <Badge className="bg-red-500/20 text-red-600">Spam</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Comment Moderation</h2>
        <div className="flex gap-2">
          <Badge variant="outline">
            {comments.filter(c => c.status === 'pending').length} Pending
          </Badge>
          <Badge variant="outline">
            {comments.filter(c => c.status === 'approved').length} Approved
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No comments yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {comments.map(comment => (
                <div key={comment.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {comment.profiles?.full_name || comment.profiles?.email || 'Anonymous'}
                          </p>
                          {getStatusBadge(comment.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          on "{comment.blog_posts?.title}"
                        </p>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      <div className="flex gap-1">
                        {comment.status !== 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCommentStatus(comment.id, 'approved')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {comment.status !== 'spam' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCommentStatus(comment.id, 'spam')}
                          >
                            <Flag className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateCommentStatus(comment.id, 'deleted')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default BlogCommentModerator;