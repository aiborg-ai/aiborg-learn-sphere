import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Settings, 
  Edit, 
  Save, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  RefreshCw,
  Shield
} from "lucide-react";

interface CMSContent {
  id: string;
  section_name: string;
  content_key: string;
  content_value: string;
  content_type: 'text' | 'html' | 'json' | 'image_url';
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function CMSAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<CMSContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newContent, setNewContent] = useState({
    section_name: '',
    content_key: '',
    content_value: '',
    content_type: 'text' as const,
    description: ''
  });

  // Check if user is admin
  const isAdmin = user?.email === 'hirendra.vikram@aiborg.ai';

  useEffect(() => {
    if (isAdmin) {
      fetchContent();
    }
  }, [isAdmin]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('cms_content')
        .select('*')
        .order('section_name', { ascending: true });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch CMS content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (item: CMSContent) => {
    try {
      const { error } = await (supabase as any)
        .from('cms_content')
        .update({
          content_value: item.content_value,
          description: item.description,
          is_active: item.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content updated successfully",
      });
      
      setEditingId(null);
      fetchContent();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive",
      });
    }
  };

  const handleCreate = async () => {
    try {
      const { error } = await (supabase as any)
        .from('cms_content')
        .insert(newContent);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content created successfully",
      });
      
      setNewContent({
        section_name: '',
        content_key: '',
        content_value: '',
        content_type: 'text',
        description: ''
      });
      fetchContent();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create content",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('cms_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content deleted successfully",
      });
      
      fetchContent();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (item: CMSContent) => {
    try {
      const { error } = await (supabase as any)
        .from('cms_content')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Content ${!item.is_active ? 'activated' : 'deactivated'}`,
      });
      
      fetchContent();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle content status",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="font-semibold text-xl mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access the CMS admin panel.
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading CMS content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="font-display text-3xl font-bold">CMS Admin Panel</h1>
          </div>
          <p className="text-muted-foreground">
            Manage website content and configuration
          </p>
        </div>

        {/* Add New Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Input
                placeholder="Section Name"
                value={newContent.section_name}
                onChange={(e) => setNewContent(prev => ({ ...prev, section_name: e.target.value }))}
              />
              <Input
                placeholder="Content Key"
                value={newContent.content_key}
                onChange={(e) => setNewContent(prev => ({ ...prev, content_key: e.target.value }))}
              />
              <Select
                value={newContent.content_type}
                onValueChange={(value: any) => setNewContent(prev => ({ ...prev, content_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="image_url">Image URL</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Description"
                value={newContent.description}
                onChange={(e) => setNewContent(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="mb-4">
              <Textarea
                placeholder="Content Value"
                value={newContent.content_value}
                onChange={(e) => setNewContent(prev => ({ ...prev, content_value: e.target.value }))}
                rows={3}
              />
            </div>
            <Button onClick={handleCreate} className="btn-hero">
              <Plus className="mr-2 h-4 w-4" />
              Create Content
            </Button>
          </CardContent>
        </Card>

        {/* Content List */}
        <div className="space-y-4">
          {content.map((item) => (
            <Card key={item.id} className={`${!item.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{item.section_name}</Badge>
                        <Badge variant="secondary">{item.content_key}</Badge>
                        <Badge variant={item.is_active ? "default" : "destructive"}>
                          {item.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(item)}
                    >
                      {item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {editingId === item.id ? (
                  <div className="space-y-4">
                    <Textarea
                      value={item.content_value}
                      onChange={(e) => {
                        const updated = content.map(c => 
                          c.id === item.id ? { ...c, content_value: e.target.value } : c
                        );
                        setContent(updated);
                      }}
                      rows={4}
                    />
                    <Input
                      placeholder="Description"
                      value={item.description || ''}
                      onChange={(e) => {
                        const updated = content.map(c => 
                          c.id === item.id ? { ...c, description: e.target.value } : c
                        );
                        setContent(updated);
                      }}
                    />
                    <Button onClick={() => handleSave(item)} className="btn-hero">
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{item.content_value}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {content.length === 0 && (
          <Card className="p-12 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Content Found</h3>
            <p className="text-muted-foreground">
              Start by adding your first piece of content above.
            </p>
          </Card>
        )}

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <Button variant="outline" onClick={fetchContent}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Content
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CMSAdmin;