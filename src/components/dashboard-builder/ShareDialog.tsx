/**
 * Share Dialog
 *
 * Dialog for sharing dashboards via private links or publishing to template gallery
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Share2,
  Link2,
  Copy,
  Check,
  Globe,
  Lock,
  Calendar,
  Users,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ShareLinkService } from '@/services/dashboard/ShareLinkService';
import { TemplateGalleryService } from '@/services/dashboard/TemplateGalleryService';
import { SECURITY_CONFIG } from '@/config/security';
import type { DashboardView } from '@/types/dashboard';

interface ShareDialogProps {
  view: DashboardView | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDialog({ view, isOpen, onClose }: ShareDialogProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'link' | 'publish'>('link');

  // Share link settings
  const [expiresInDays, setExpiresInDays] = useState<number>(7);
  const [maxUses, setMaxUses] = useState<number>(0);
  const [requireAuth, setRequireAuth] = useState(false);

  // Publish template settings
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateTags, setTemplateTags] = useState('');

  const queryClient = useQueryClient();

  // Fetch existing share links
  const { data: shareLinks } = useQuery({
    queryKey: ['share-links', view?.id],
    queryFn: async () => {
      if (!view) return [];
      return await ShareLinkService.getShareLinks(view.id);
    },
    enabled: isOpen && !!view,
  });

  // Create share link mutation
  const createShareLinkMutation = useMutation({
    mutationFn: async () => {
      if (!view) throw new Error('No view selected');

      const expiresAt = expiresInDays > 0
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined;

      return await ShareLinkService.createShareLink({
        dashboardViewId: view.id,
        expiresAt,
        maxUses: maxUses > 0 ? maxUses : undefined,
        requireAuth,
      });
    },
    onSuccess: (newLink) => {
      queryClient.invalidateQueries({ queryKey: ['share-links', view?.id] });
      toast.success('Share link created successfully');

      // Copy to clipboard
      const shareUrl = `${window.location.origin}/dashboard-builder?share=${newLink.token}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(newLink.token);
      setTimeout(() => setCopiedLink(null), 2000);
    },
    onError: () => {
      toast.error('Failed to create share link');
    },
  });

  // Delete share link mutation
  const deleteShareLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      await ShareLinkService.revokeShareLink(linkId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-links', view?.id] });
      toast.success('Share link deleted');
    },
    onError: () => {
      toast.error('Failed to delete share link');
    },
  });

  // Publish template mutation
  const publishTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!view) throw new Error('No view selected');
      if (!templateName.trim()) throw new Error('Template name is required');
      if (!templateCategory.trim()) throw new Error('Category is required');

      const tags = templateTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      return await TemplateGalleryService.publishTemplate({
        dashboardViewId: view.id,
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        category: templateCategory.trim(),
        tags,
      });
    },
    onSuccess: () => {
      toast.success('Template published to gallery');
      setActiveTab('link');
      // Reset form
      setTemplateName('');
      setTemplateDescription('');
      setTemplateCategory('');
      setTemplateTags('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to publish template');
    },
  });

  const handleCopyLink = (token: string) => {
    const shareUrl = `${window.location.origin}/dashboard-builder?share=${token}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(token);
    setTimeout(() => setCopiedLink(null), 2000);
    toast.success('Link copied to clipboard');
  };

  const handleCreateShareLink = () => {
    createShareLinkMutation.mutate();
  };

  const handlePublishTemplate = () => {
    publishTemplateMutation.mutate();
  };

  if (!view) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Dashboard
          </DialogTitle>
          <DialogDescription>
            Share your dashboard via private link or publish to the template gallery
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'link' | 'publish')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">
              <Lock className="h-4 w-4 mr-2" />
              Private Link
            </TabsTrigger>
            <TabsTrigger value="publish">
              <Globe className="h-4 w-4 mr-2" />
              Publish Template
            </TabsTrigger>
          </TabsList>

          {/* Private Link Tab */}
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <h4 className="text-sm font-semibold mb-3">Create Share Link</h4>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiresIn">Expires In</Label>
                      <Select
                        value={expiresInDays.toString()}
                        onValueChange={(v) => setExpiresInDays(parseInt(v))}
                      >
                        <SelectTrigger id="expiresIn">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Day</SelectItem>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="0">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxUses">
                        Max Uses (max {SECURITY_CONFIG.SHARE_LINK_MAX_USES})
                      </Label>
                      <Input
                        id="maxUses"
                        type="number"
                        min="0"
                        max={SECURITY_CONFIG.SHARE_LINK_MAX_USES}
                        value={maxUses}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setMaxUses(Math.min(value, SECURITY_CONFIG.SHARE_LINK_MAX_USES));
                        }}
                        placeholder="Unlimited"
                      />
                      {maxUses > SECURITY_CONFIG.SHARE_LINK_MAX_USES && (
                        <p className="text-xs text-amber-600">
                          Maximum {SECURITY_CONFIG.SHARE_LINK_MAX_USES} uses allowed
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="requireAuth">Require Authentication</Label>
                      <p className="text-xs text-muted-foreground">
                        Users must be logged in to view
                      </p>
                    </div>
                    <Switch
                      id="requireAuth"
                      checked={requireAuth}
                      onCheckedChange={setRequireAuth}
                    />
                  </div>

                  <Button
                    onClick={handleCreateShareLink}
                    disabled={createShareLinkMutation.isPending}
                    className="w-full"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Create Share Link
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Existing Share Links */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Active Share Links</h4>

                {(!shareLinks || shareLinks.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Link2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active share links</p>
                    <p className="text-xs mt-1">Create a link to share your dashboard</p>
                  </div>
                )}

                {shareLinks && shareLinks.length > 0 && (
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {shareLinks.map((link) => {
                        const isExpired = link.expires_at
                          ? new Date(link.expires_at) < new Date()
                          : false;
                        const isMaxedOut = link.max_uses
                          ? link.use_count >= link.max_uses
                          : false;

                        return (
                          <div
                            key={link.id}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border',
                              (isExpired || isMaxedOut) && 'opacity-50'
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-xs bg-muted px-2 py-1 rounded truncate">
                                  {link.token.slice(0, 16)}...
                                </code>
                                {isExpired && (
                                  <Badge variant="destructive" className="text-xs">
                                    Expired
                                  </Badge>
                                )}
                                {isMaxedOut && (
                                  <Badge variant="destructive" className="text-xs">
                                    Max Uses Reached
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {link.use_count} uses
                                  {link.max_uses && ` / ${link.max_uses}`}
                                </span>
                                {link.expires_at && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Expires {new Date(link.expires_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleCopyLink(link.token)}
                              disabled={isExpired || isMaxedOut}
                            >
                              {copiedLink === link.token ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteShareLinkMutation.mutate(link.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Publish Template Tab */}
          <TabsContent value="publish" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">
                  Template Name * ({templateName.length}/{SECURITY_CONFIG.MAX_TEMPLATE_NAME_LENGTH})
                </Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, SECURITY_CONFIG.MAX_TEMPLATE_NAME_LENGTH);
                    setTemplateName(value);
                  }}
                  placeholder="e.g., Student Progress Dashboard"
                  maxLength={SECURITY_CONFIG.MAX_TEMPLATE_NAME_LENGTH}
                />
                {templateName.length >= SECURITY_CONFIG.MAX_TEMPLATE_NAME_LENGTH && (
                  <p className="text-xs text-amber-600">
                    Maximum length reached
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateDescription">
                  Description ({templateDescription.length}/{SECURITY_CONFIG.MAX_TEMPLATE_DESC_LENGTH})
                </Label>
                <Input
                  id="templateDescription"
                  value={templateDescription}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, SECURITY_CONFIG.MAX_TEMPLATE_DESC_LENGTH);
                    setTemplateDescription(value);
                  }}
                  placeholder="Describe what this dashboard is for..."
                  maxLength={SECURITY_CONFIG.MAX_TEMPLATE_DESC_LENGTH}
                />
                {templateDescription.length >= SECURITY_CONFIG.MAX_TEMPLATE_DESC_LENGTH && (
                  <p className="text-xs text-amber-600">
                    Maximum length reached
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateCategory">Category *</Label>
                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                  <SelectTrigger id="templateCategory">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateTags">
                  Tags (comma-separated, max {SECURITY_CONFIG.MAX_TEMPLATE_TAGS})
                </Label>
                <Input
                  id="templateTags"
                  value={templateTags}
                  onChange={(e) => setTemplateTags(e.target.value)}
                  placeholder="e.g., progress, analytics, overview"
                />
                {templateTags.split(',').filter(t => t.trim()).length > SECURITY_CONFIG.MAX_TEMPLATE_TAGS && (
                  <p className="text-xs text-amber-600">
                    Maximum {SECURITY_CONFIG.MAX_TEMPLATE_TAGS} tags allowed
                  </p>
                )}
              </div>

              <div className="p-4 border rounded-lg bg-blue-500/10 border-blue-500/20">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> Publishing your dashboard will make it available in the
                  public template gallery. Other users will be able to view and clone your
                  dashboard layout.
                </p>
              </div>

              <Button
                onClick={handlePublishTemplate}
                disabled={publishTemplateMutation.isPending || !templateName || !templateCategory}
                className="w-full"
              >
                <Globe className="h-4 w-4 mr-2" />
                Publish to Gallery
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ShareDialog;
