import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
} from '@/components/ui/icons';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  permissions: string[];
  status: 'active' | 'revoked' | 'expired';
  lastUsed?: string;
  usageCount: number;
  rateLimit: number;
  expiresAt?: string;
  createdAt: string;
  createdBy: string;
}

const StatsCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={cn('p-3 rounded-full', color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export function ApiKeyManager() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());
  const [newKeyCreated, setNewKeyCreated] = useState<string | null>(null);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);

  // Form state
  const [newKey, setNewKey] = useState({
    name: '',
    permissions: [] as string[],
    rateLimit: '1000',
    expiresIn: 'never',
  });

  // Sample API keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: 'key1',
      name: 'Production API',
      key: 'sk_live_abc123xyz789def456',
      prefix: 'sk_live',
      permissions: ['read', 'write'],
      status: 'active',
      lastUsed: new Date(Date.now() - 3600000).toISOString(),
      usageCount: 15234,
      rateLimit: 1000,
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      createdBy: 'Admin',
    },
    {
      id: 'key2',
      name: 'Development API',
      key: 'sk_test_xyz789abc123def456',
      prefix: 'sk_test',
      permissions: ['read', 'write', 'delete'],
      status: 'active',
      lastUsed: new Date(Date.now() - 7200000).toISOString(),
      usageCount: 8756,
      rateLimit: 500,
      createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      createdBy: 'Admin',
    },
    {
      id: 'key3',
      name: 'Read-only API',
      key: 'sk_live_readonly_abc123',
      prefix: 'sk_live',
      permissions: ['read'],
      status: 'active',
      lastUsed: new Date(Date.now() - 86400000).toISOString(),
      usageCount: 3421,
      rateLimit: 2000,
      createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
      createdBy: 'Admin',
    },
    {
      id: 'key4',
      name: 'Old Integration Key',
      key: 'sk_test_old_xyz789',
      prefix: 'sk_test',
      permissions: ['read'],
      status: 'revoked',
      usageCount: 1200,
      rateLimit: 1000,
      createdAt: new Date(Date.now() - 86400000 * 180).toISOString(),
      createdBy: 'Admin',
    },
  ]);

  const stats = {
    totalKeys: apiKeys.length,
    activeKeys: apiKeys.filter(k => k.status === 'active').length,
    totalRequests: apiKeys.reduce((sum, k) => sum + k.usageCount, 0),
    revokedKeys: apiKeys.filter(k => k.status === 'revoked').length,
  };

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'sk_live_';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const handleCreateKey = () => {
    const key = generateApiKey();
    const newApiKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKey.name,
      key,
      prefix: 'sk_live',
      permissions: newKey.permissions,
      status: 'active',
      usageCount: 0,
      rateLimit: parseInt(newKey.rateLimit),
      expiresAt:
        newKey.expiresIn !== 'never'
          ? new Date(Date.now() + parseInt(newKey.expiresIn) * 86400000).toISOString()
          : undefined,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin',
    };

    setApiKeys(prev => [newApiKey, ...prev]);
    setNewKeyCreated(key);
    setNewKey({ name: '', permissions: [], rateLimit: '1000', expiresIn: 'never' });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: 'Copied', description: 'API key copied to clipboard.' });
  };

  const handleRevokeKey = (keyId: string) => {
    setApiKeys(prev => prev.map(k => (k.id === keyId ? { ...k, status: 'revoked' as const } : k)));
    setDeleteDialogOpen(false);
    toast({ title: 'Key Revoked', description: 'The API key has been revoked.' });
  };

  const toggleShowKey = (keyId: string) => {
    setShowKeys(prev => {
      const next = new Set(prev);
      if (next.has(keyId)) {
        next.delete(keyId);
      } else {
        next.add(keyId);
      }
      return next;
    });
  };

  const maskKey = (key: string) => {
    return key.slice(0, 12) + '••••••••••••••••••••';
  };

  const permissionOptions = [
    { value: 'read', label: 'Read', description: 'Read access to resources' },
    { value: 'write', label: 'Write', description: 'Create and update resources' },
    { value: 'delete', label: 'Delete', description: 'Delete resources' },
    { value: 'admin', label: 'Admin', description: 'Full administrative access' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-amber-100">
            <Key className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">API Keys</h2>
            <p className="text-sm text-muted-foreground">
              Manage API keys for external integrations
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Keys"
          value={stats.totalKeys}
          icon={Key}
          color="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Active Keys"
          value={stats.activeKeys}
          icon={CheckCircle2}
          color="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Total Requests"
          value={stats.totalRequests.toLocaleString()}
          icon={BarChart3}
          color="bg-purple-100 text-purple-600"
        />
        <StatsCard
          title="Revoked Keys"
          value={stats.revokedKeys}
          icon={AlertTriangle}
          color="bg-red-100 text-red-600"
        />
      </div>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage your API keys and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map(apiKey => (
                <TableRow key={apiKey.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{apiKey.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created{' '}
                        {formatDistanceToNow(new Date(apiKey.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                        {showKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                      </code>
                      <Button variant="ghost" size="sm" onClick={() => toggleShowKey(apiKey.id)}>
                        {showKeys.has(apiKey.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleCopyKey(apiKey.key)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {apiKey.permissions.map(perm => (
                        <Badge key={perm} variant="outline" className="text-xs capitalize">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        apiKey.status === 'active' && 'bg-green-100 text-green-700',
                        apiKey.status === 'revoked' && 'bg-red-100 text-red-700',
                        apiKey.status === 'expired' && 'bg-slate-100 text-slate-700'
                      )}
                    >
                      {apiKey.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{apiKey.usageCount.toLocaleString()} requests</p>
                      <p className="text-xs text-muted-foreground">{apiKey.rateLimit}/min limit</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {apiKey.lastUsed ? (
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(apiKey.lastUsed), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {apiKey.status === 'active' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedKeyId(apiKey.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={open => {
          setCreateDialogOpen(open);
          if (!open) setNewKeyCreated(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>Generate a new API key for external integrations</DialogDescription>
          </DialogHeader>

          {newKeyCreated ? (
            <div className="space-y-4">
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  Your API key has been created. Copy it now - you won't be able to see it again!
                </AlertDescription>
              </Alert>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono break-all">{newKeyCreated}</code>
                  <Button size="sm" onClick={() => handleCopyKey(newKeyCreated)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setNewKeyCreated(null);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Production API"
                  value={newKey.name}
                  onChange={e => setNewKey(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label>Permissions</Label>
                <div className="space-y-2">
                  {permissionOptions.map(perm => (
                    <div
                      key={perm.value}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <p className="font-medium text-sm">{perm.label}</p>
                        <p className="text-xs text-muted-foreground">{perm.description}</p>
                      </div>
                      <Switch
                        checked={newKey.permissions.includes(perm.value)}
                        onCheckedChange={checked => {
                          setNewKey(prev => ({
                            ...prev,
                            permissions: checked
                              ? [...prev.permissions, perm.value]
                              : prev.permissions.filter(p => p !== perm.value),
                          }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="rateLimit">Rate Limit (per min)</Label>
                  <Select
                    value={newKey.rateLimit}
                    onValueChange={v => setNewKey(prev => ({ ...prev, rateLimit: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                      <SelectItem value="1000">1,000</SelectItem>
                      <SelectItem value="5000">5,000</SelectItem>
                      <SelectItem value="10000">10,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiresIn">Expires In</Label>
                  <Select
                    value={newKey.expiresIn}
                    onValueChange={v => setNewKey(prev => ({ ...prev, expiresIn: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateKey}
                  disabled={!newKey.name || newKey.permissions.length === 0}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Generate Key
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this API key? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Any applications using this key will immediately lose access.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedKeyId && handleRevokeKey(selectedKeyId)}
            >
              Revoke Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
