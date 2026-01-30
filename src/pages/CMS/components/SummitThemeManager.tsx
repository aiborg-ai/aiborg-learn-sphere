/**
 * Summit Theme Manager Component
 * View and edit Summit themes (The 7 Chakras)
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Edit, Layers, ExternalLink } from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSummitThemes, useSummitStats } from '@/hooks/summit/useSummitResources';
import { getThemeColors } from '@/types/summit';
import type { SummitTheme } from '@/types/summit';
import { useQueryClient } from '@tanstack/react-query';

function SummitThemeManager() {
  const [editingTheme, setEditingTheme] = useState<SummitTheme | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '',
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: themes = [], isLoading } = useSummitThemes();
  const { data: stats } = useSummitStats();

  const handleEditClick = (theme: SummitTheme) => {
    setEditingTheme(theme);
    setEditFormData({
      name: theme.name,
      description: theme.description || '',
      icon: theme.icon,
      color: theme.color,
    });
  };

  const handleSave = async () => {
    if (!editingTheme) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('summit_themes')
        .update({
          name: editFormData.name,
          description: editFormData.description,
          icon: editFormData.icon,
          color: editFormData.color,
        })
        .eq('id', editingTheme.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Theme updated successfully',
      });

      // Refresh themes
      queryClient.invalidateQueries({ queryKey: ['summit-themes'] });
      setEditingTheme(null);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update theme',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getThemeStats = (themeId: string) => {
    return stats?.by_theme.find(t => t.theme_id === themeId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">The Seven Chakras</h2>
          <p className="text-muted-foreground">
            Manage the thematic pillars of India AI Impact Summit 2026
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Layers className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm">
                These seven themes represent the core pillars of India's AI strategy. Each theme has
                curated resources to help participants explore different aspects of AI development
                and governance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Themes Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {themes.map(theme => {
          const colors = getThemeColors(theme.slug);
          const themeStat = getThemeStats(theme.id);
          return (
            <Card key={theme.id} className={`${colors.borderColor} border-2`}>
              <CardHeader className={`${colors.bgColor} pb-3`}>
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className={`${colors.textColor} ${colors.borderColor}`}>
                    #{theme.sort_order}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEditClick(theme)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className={`text-lg ${colors.textColor}`}>{theme.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {theme.description}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resources</span>
                    <span className="font-medium">{theme.resource_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Published</span>
                    <span className="font-medium">{themeStat?.published_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Drafts</span>
                    <span className="font-medium">{themeStat?.draft_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Views</span>
                    <span className="font-medium">{themeStat?.total_views || 0}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>Icon: {theme.icon}</span>
                    <span>|</span>
                    <span>Color: {theme.color}</span>
                  </div>
                  <Button variant="link" size="sm" className="p-0 h-auto mt-2" asChild>
                    <a href={`/summit/${theme.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View public page
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTheme} onOpenChange={open => !open && setEditingTheme(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Theme</DialogTitle>
            <DialogDescription>
              Update the theme details. The slug cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Slug (read-only)</Label>
              <Input value={editingTheme?.slug || ''} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editFormData.name}
                onChange={e => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Theme name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editFormData.description}
                onChange={e => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Theme description..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon Name</Label>
                <Input
                  value={editFormData.icon}
                  onChange={e => setEditFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="e.g., Shield, Users"
                />
                <p className="text-xs text-muted-foreground">Lucide icon name</p>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  value={editFormData.color}
                  onChange={e => setEditFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="e.g., blue, purple"
                />
                <p className="text-xs text-muted-foreground">Tailwind color name</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTheme(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SummitThemeManager;
