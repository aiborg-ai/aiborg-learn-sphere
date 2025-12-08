/**
 * Tenant Management Page (Super Admin Only)
 * Manage all tenants in the multi-tenancy system
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Building2,
  Plus,
  Users,
  BookOpen,
  HardDrive,
  Crown,
  AlertCircle,
  CheckCircle,
  Ban,
} from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { logger } from '@/utils/logger';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  display_name: string;
  tier: string;
  status: string;
  subdomain: string;
  custom_domain: string | null;
  current_users: number;
  current_courses: number;
  current_storage_mb: number;
  max_users: number;
  max_courses: number;
  max_storage_gb: number;
  created_at: string;
}

export default function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    display_name: '',
    tier: 'free',
    subdomain: '',
    max_users: 10,
    max_courses: 5,
    max_storage_gb: 5,
  });

  const { toast } = useToast();
  const { isPlatform } = useTenant();

  useEffect(() => {
    loadTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTenants = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      logger.error('Failed to load tenants', error);
      toast({
        title: 'Error',
        description: 'Failed to load tenants',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    try {
      const { error } = await supabase.from('tenants').insert({
        name: formData.name,
        slug: formData.slug,
        display_name: formData.display_name,
        tier: formData.tier,
        subdomain: formData.subdomain,
        max_users: formData.max_users,
        max_courses: formData.max_courses,
        max_storage_gb: formData.max_storage_gb,
        status: 'trial',
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Tenant created successfully',
      });

      setIsCreateOpen(false);
      setFormData({
        name: '',
        slug: '',
        display_name: '',
        tier: 'free',
        subdomain: '',
        max_users: 10,
        max_courses: 5,
        max_storage_gb: 5,
      });
      loadTenants();
    } catch (error: any) {
      logger.error('Failed to create tenant', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create tenant',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (tenantId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status: newStatus })
        .eq('id', tenantId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Tenant ${newStatus === 'active' ? 'activated' : 'suspended'}`,
      });

      loadTenants();
    } catch (error) {
      logger.error('Failed to update tenant status', error);
      toast({
        title: 'Error',
        description: 'Failed to update tenant status',
        variant: 'destructive',
      });
    }
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      free: 'bg-gray-500',
      startup: 'bg-blue-500',
      growth: 'bg-purple-500',
      enterprise: 'bg-orange-500',
      white_label: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    };

    return (
      <Badge className={colors[tier as keyof typeof colors] || 'bg-gray-500'}>
        {tier.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const icons = {
      active: <CheckCircle className="h-3 w-3" />,
      suspended: <Ban className="h-3 w-3" />,
      trial: <AlertCircle className="h-3 w-3" />,
      cancelled: <Ban className="h-3 w-3" />,
    };

    const colors = {
      active: 'bg-green-500',
      suspended: 'bg-red-500',
      trial: 'bg-yellow-500',
      cancelled: 'bg-gray-500',
    };

    return (
      <Badge className={`${colors[status as keyof typeof colors]} flex items-center gap-1`}>
        {icons[status as keyof typeof icons]}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const calculateUsagePercent = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  // Only allow super admins to access this page
  if (!isPlatform) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            This page is only accessible to platform super administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Tenant Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all organizations and white-label instances
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>
                Set up a new organization or white-label instance
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Acme Corp"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL-safe)</Label>
                  <Input
                    id="slug"
                    placeholder="acmecorp"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  placeholder="Acme Corporation Learning Portal"
                  value={formData.display_name}
                  onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input
                    id="subdomain"
                    placeholder="acmecorp"
                    value={formData.subdomain}
                    onChange={e => setFormData({ ...formData, subdomain: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">{formData.subdomain}.aiborg.com</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier">Tier</Label>
                  <Select
                    value={formData.tier}
                    onValueChange={value => setFormData({ ...formData, tier: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="startup">Startup</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="white_label">White Label</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_users">Max Users</Label>
                  <Input
                    id="max_users"
                    type="number"
                    value={formData.max_users}
                    onChange={e =>
                      setFormData({ ...formData, max_users: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_courses">Max Courses</Label>
                  <Input
                    id="max_courses"
                    type="number"
                    value={formData.max_courses}
                    onChange={e =>
                      setFormData({ ...formData, max_courses: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_storage_gb">Max Storage (GB)</Label>
                  <Input
                    id="max_storage_gb"
                    type="number"
                    value={formData.max_storage_gb}
                    onChange={e =>
                      setFormData({ ...formData, max_storage_gb: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTenant}>Create Tenant</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.filter(t => t.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.filter(t => t.status === 'trial').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">White Label</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.filter(t => t.tier === 'white_label').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
          <CardDescription>Manage and monitor all tenant organizations</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tenants...</div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tenants found</div>
          ) : (
            <div className="space-y-4">
              {tenants.map(tenant => (
                <Card key={tenant.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{tenant.display_name}</h3>
                        {getTierBadge(tenant.tier)}
                        {getStatusBadge(tenant.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tenant.subdomain}.aiborg.com
                        {tenant.custom_domain && ` • ${tenant.custom_domain}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(tenant.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {tenant.status === 'suspended' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(tenant.id, 'active')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Activate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(tenant.id, 'suspended')}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        Users
                      </div>
                      <div className="text-sm font-medium">
                        {tenant.current_users} / {tenant.max_users}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({calculateUsagePercent(tenant.current_users, tenant.max_users)}%)
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        Courses
                      </div>
                      <div className="text-sm font-medium">
                        {tenant.current_courses} / {tenant.max_courses}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({calculateUsagePercent(tenant.current_courses, tenant.max_courses)}%)
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <HardDrive className="h-3 w-3" />
                        Storage
                      </div>
                      <div className="text-sm font-medium">
                        {Math.round(tenant.current_storage_mb / 1024)} GB / {tenant.max_storage_gb}{' '}
                        GB
                        <span className="text-xs text-muted-foreground ml-1">
                          (
                          {calculateUsagePercent(
                            tenant.current_storage_mb / 1024,
                            tenant.max_storage_gb
                          )}
                          %)
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
