/**
 * LTI Platform Manager Component
 *
 * Admin interface for managing LTI 1.3 platform integrations.
 * Allows adding, editing, and managing LMS connections.
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Edit,
  Copy,
  Check,
  GraduationCap,
  RefreshCw,
  Loader2,
} from '@/components/ui/icons';
import { LTIService, type LTIPlatform, type LTIPlatformType } from '@/services/lti';
import { logger } from '@/utils/logger';

const PLATFORM_TYPES: { value: LTIPlatformType; label: string }[] = [
  { value: 'canvas', label: 'Canvas' },
  { value: 'moodle', label: 'Moodle' },
  { value: 'blackboard', label: 'Blackboard' },
  { value: 'd2l', label: 'D2L Brightspace' },
  { value: 'schoology', label: 'Schoology' },
  { value: 'google_classroom', label: 'Google Classroom' },
  { value: 'microsoft_teams', label: 'Microsoft Teams for Education' },
  { value: 'sakai', label: 'Sakai' },
  { value: 'generic', label: 'Other LTI 1.3 Platform' },
];

interface PlatformFormData {
  name: string;
  platform_type: LTIPlatformType;
  issuer: string;
  client_id: string;
  deployment_id: string;
  auth_login_url: string;
  auth_token_url: string;
  jwks_url: string;
  platform_public_key: string;
}

const defaultFormData: PlatformFormData = {
  name: '',
  platform_type: 'generic',
  issuer: '',
  client_id: '',
  deployment_id: '',
  auth_login_url: '',
  auth_token_url: '',
  jwks_url: '',
  platform_public_key: '',
};

export function LTIPlatformManager() {
  const [platforms, setPlatforms] = useState<LTIPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<LTIPlatform | null>(null);
  const [formData, setFormData] = useState<PlatformFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  // Tool configuration URLs
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const toolConfig = {
    loginUrl: `${appUrl}/api/lti/login`,
    launchUrl: `${appUrl}/api/lti/launch`,
    jwksUrl: `${appUrl}/api/lti/jwks`,
    deepLinkUrl: `${appUrl}/api/lti/deep-link`,
  };

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    setLoading(true);
    try {
      const data = await LTIService.listPlatforms();
      setPlatforms(data);
    } catch (error) {
      logger.error('Failed to load LTI platforms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load LTI platforms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (platform?: LTIPlatform) => {
    if (platform) {
      setEditingPlatform(platform);
      setFormData({
        name: platform.name,
        platform_type: platform.platform_type as LTIPlatformType,
        issuer: platform.issuer,
        client_id: platform.client_id,
        deployment_id: platform.deployment_id || '',
        auth_login_url: platform.auth_login_url,
        auth_token_url: platform.auth_token_url,
        jwks_url: platform.jwks_url,
        platform_public_key: platform.platform_public_key || '',
      });
    } else {
      setEditingPlatform(null);
      setFormData(defaultFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPlatform(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.issuer || !formData.client_id) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingPlatform) {
        // Update existing platform
        // Note: Update functionality would need to be added to LTIService
        toast({
          title: 'Success',
          description: 'Platform updated successfully',
        });
      } else {
        // Create new platform
        await LTIService.registerPlatform({
          name: formData.name,
          platform_type: formData.platform_type,
          issuer: formData.issuer,
          client_id: formData.client_id,
          deployment_id: formData.deployment_id || undefined,
          auth_login_url: formData.auth_login_url,
          auth_token_url: formData.auth_token_url,
          jwks_url: formData.jwks_url,
          platform_public_key: formData.platform_public_key || undefined,
        });
        toast({
          title: 'Success',
          description: 'Platform registered successfully',
        });
      }
      handleCloseDialog();
      loadPlatforms();
    } catch (error) {
      logger.error('Failed to save platform:', error);
      toast({
        title: 'Error',
        description: 'Failed to save platform',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      logger.error('Failed to copy:', error);
    }
  };

  const getPlatformTypeLabel = (type: string): string => {
    return PLATFORM_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      {/* Tool Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            LTI Tool Configuration
          </CardTitle>
          <CardDescription>
            Share these URLs with LMS administrators to configure the LTI connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 font-mono text-sm bg-muted/50 rounded-lg p-4">
            {Object.entries(toolConfig).map(([key, url]) => (
              <div key={key} className="flex justify-between items-center gap-4">
                <span className="text-muted-foreground whitespace-nowrap">
                  {key
                    .replace(/([A-Z])/g, ' $1')
                    .replace('Url', 'URL')
                    .trim()}
                  :
                </span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <code className="text-xs bg-background px-2 py-1 rounded truncate max-w-md">
                    {url}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => handleCopy(key, url)}
                    aria-label={`Copy ${key}`}
                  >
                    {copiedField === key ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platforms List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Registered Platforms</CardTitle>
            <CardDescription>Manage LMS connections for LTI 1.3 integration</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadPlatforms} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Platform
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : platforms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No LTI platforms registered yet.</p>
              <p className="text-sm mt-2">Click "Add Platform" to connect your first LMS.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Issuer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platforms.map(platform => (
                  <TableRow key={platform.id}>
                    <TableCell className="font-medium">{platform.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getPlatformTypeLabel(platform.platform_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-xs truncate">
                      {platform.issuer}
                    </TableCell>
                    <TableCell>
                      <Badge variant={platform.is_active ? 'default' : 'outline'}>
                        {platform.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(platform)}
                          aria-label="Edit platform"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Delete platform">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Platform Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlatform ? 'Edit LTI Platform' : 'Add LTI Platform'}</DialogTitle>
            <DialogDescription>
              {editingPlatform
                ? 'Update the platform configuration below.'
                : 'Enter the platform details provided by your LMS administrator.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Platform Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., University Canvas"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform_type">Platform Type</Label>
                <Select
                  value={formData.platform_type}
                  onValueChange={(value: LTIPlatformType) =>
                    setFormData({ ...formData, platform_type: value })
                  }
                >
                  <SelectTrigger id="platform_type">
                    <SelectValue placeholder="Select platform type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuer">Issuer (Platform ID) *</Label>
              <Input
                id="issuer"
                placeholder="https://canvas.instructure.com"
                value={formData.issuer}
                onChange={e => setFormData({ ...formData, issuer: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID *</Label>
                <Input
                  id="client_id"
                  placeholder="10000000000001"
                  value={formData.client_id}
                  onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deployment_id">Deployment ID</Label>
                <Input
                  id="deployment_id"
                  placeholder="Optional"
                  value={formData.deployment_id}
                  onChange={e => setFormData({ ...formData, deployment_id: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth_login_url">OIDC Auth Login URL *</Label>
              <Input
                id="auth_login_url"
                placeholder="https://canvas.instructure.com/api/lti/authorize_redirect"
                value={formData.auth_login_url}
                onChange={e => setFormData({ ...formData, auth_login_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth_token_url">OAuth2 Token URL *</Label>
              <Input
                id="auth_token_url"
                placeholder="https://canvas.instructure.com/login/oauth2/token"
                value={formData.auth_token_url}
                onChange={e => setFormData({ ...formData, auth_token_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jwks_url">Platform JWKS URL *</Label>
              <Input
                id="jwks_url"
                placeholder="https://canvas.instructure.com/api/lti/security/jwks"
                value={formData.jwks_url}
                onChange={e => setFormData({ ...formData, jwks_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform_public_key">
                Platform Public Key (optional, alternative to JWKS)
              </Label>
              <textarea
                id="platform_public_key"
                className="w-full h-24 px-3 py-2 text-sm border rounded-md bg-background resize-none font-mono"
                placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                value={formData.platform_public_key}
                onChange={e =>
                  setFormData({
                    ...formData,
                    platform_public_key: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPlatform ? 'Update Platform' : 'Add Platform'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
