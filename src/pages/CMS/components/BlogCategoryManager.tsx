import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, FolderOpen, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string | null;
  post_count: number;
  is_active: boolean;
  sort_order: number;
  parent_id: string | null;
}

function BlogCategoryManager() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#6B46C1',
    is_active: true,
    sort_order: 0
  });
  const [showNewForm, setShowNewForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch categories',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase
        .from('blog_categories')
        .insert(newCategory);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Category created successfully'
      });

      setNewCategory({
        name: '',
        slug: '',
        description: '',
        color: '#6B46C1',
        is_active: true,
        sort_order: 0
      });
      setShowNewForm(false);
      fetchCategories();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive'
      });
    }
  };

  const handleUpdate = async (category: BlogCategory) => {
    try {
      const { error } = await supabase
        .from('blog_categories')
        .update({
          name: category.name,
          slug: category.slug,
          description: category.description,
          color: category.color,
          is_active: category.is_active,
          sort_order: category.sort_order
        })
        .eq('id', category.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Category updated successfully'
      });

      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will not delete associated posts.')) return;

    try {
      const { error } = await supabase
        .from('blog_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Category deleted successfully'
      });

      fetchCategories();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive'
      });
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Categories</h2>
        <Button
          onClick={() => setShowNewForm(true)}
          className="btn-hero"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      </div>

      {/* New Category Form */}
      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Category name"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                    placeholder="category-slug"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setNewCategory({ ...newCategory, slug: generateSlug(newCategory.name) })}
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Category description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={newCategory.sort_order}
                  onChange={(e) => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newCategory.is_active}
                    onCheckedChange={(checked) => setNewCategory({ ...newCategory, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleCreate} className="btn-hero">
                <Save className="mr-2 h-4 w-4" />
                Create Category
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No categories yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {categories.map(category => (
                <div key={category.id} className="p-4">
                  {editingCategory?.id === category.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          placeholder="Category name"
                        />
                        <Input
                          value={editingCategory.slug}
                          onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                          placeholder="category-slug"
                        />
                      </div>
                      <Textarea
                        value={editingCategory.description || ''}
                        onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                        placeholder="Description"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setEditingCategory(null)}>
                          Cancel
                        </Button>
                        <Button onClick={() => handleUpdate(editingCategory)} className="btn-hero">
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{category.name}</p>
                            <Badge variant="secondary">{category.post_count} posts</Badge>
                            {!category.is_active && (
                              <Badge variant="destructive">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{category.slug}</p>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default BlogCategoryManager;