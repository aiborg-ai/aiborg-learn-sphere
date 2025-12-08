/**
 * Domain Management Page (Tenant Admin Only)
 * Manage custom domains for white-label instances
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Globe,
  Plus,
  CheckCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  Trash2,
  Info,
} from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { logger } from '@/utils/logger';

interface Domain {
  id: string;
  tenant_id: string;
  domain: string;
  is_primary: boolean;
  is_verified: boolean;
  verification_token: string;
  verification_method: 'dns_txt' | 'dns_cname' | 'http_file';
  created_at: string;
  verified_at: string | null;
}

export default function DomainManagement() {
  const { tenantId, isTenant } = useTenant();
  const { toast } = useToast();

  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<
    'dns_txt' | 'dns_cname' | 'http_file'
  >('dns_txt');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (tenantId) {
      loadDomains();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const loadDomains = async () => {
    if (!tenantId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenant_domains')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      logger.error('Failed to load domains', error);
      toast({
        title: 'Error',
        description: 'Failed to load domains',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!tenantId || !newDomain) return;

    setIsAdding(true);
    try {
      // Generate verification token
      const verificationToken = generateVerificationToken();

      const { error } = await supabase.from('tenant_domains').insert({
        tenant_id: tenantId,
        domain: newDomain,
        is_primary: domains.length === 0, // First domain is primary
        verification_token: verificationToken,
        verification_method: verificationMethod,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Domain added successfully. Please verify ownership.',
      });

      setIsAddOpen(false);
      setNewDomain('');
      loadDomains();
    } catch (error: any) {
      logger.error('Failed to add domain', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add domain',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleVerifyDomain = async (domain: Domain) => {
    try {
      const { data, error } = await supabase.rpc('verify_tenant_domain', {
        p_domain: domain.domain,
        p_verification_token: domain.verification_token,
      });

      if (error) throw error;

      if (data) {
        toast({
          title: 'Success',
          description: 'Domain verified successfully!',
        });
        loadDomains();
      } else {
        toast({
          title: 'Verification Failed',
          description: 'Could not verify domain. Please check your DNS records.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      logger.error('Failed to verify domain', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify domain',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;

    try {
      const { error } = await supabase.from('tenant_domains').delete().eq('id', domainId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Domain deleted successfully',
      });

      loadDomains();
    } catch (error: any) {
      logger.error('Failed to delete domain', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete domain',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
    });
  };

  const generateVerificationToken = () => {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  const getVerificationInstructions = (domain: Domain) => {
    switch (domain.verification_method) {
      case 'dns_txt':
        return {
          title: 'Add TXT Record',
          steps: [
            'Go to your DNS provider (e.g., Cloudflare, GoDaddy)',
            'Add a new TXT record:',
            `  Name: _aiborg-verify.${domain.domain}`,
            `  Value: ${domain.verification_token}`,
            'Wait for DNS propagation (5-30 minutes)',
            'Click "Verify Domain" button',
          ],
        };
      case 'dns_cname':
        return {
          title: 'Add CNAME Record',
          steps: [
            'Go to your DNS provider',
            'Add a new CNAME record:',
            `  Name: ${domain.domain}`,
            `  Value: ${tenantId}.aiborg.com`,
            'Wait for DNS propagation (5-30 minutes)',
            'Click "Verify Domain" button',
          ],
        };
      case 'http_file':
        return {
          title: 'Upload Verification File',
          steps: [
            `Create a file at: https://${domain.domain}/.well-known/aiborg-verify.txt`,
            `File content: ${domain.verification_token}`,
            'Make sure the file is publicly accessible',
            'Click "Verify Domain" button',
          ],
        };
      default:
        return { title: 'Unknown Method', steps: [] };
    }
  };

  // Only allow tenant admins to access this page
  if (!isTenant) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            This page is only accessible to tenant administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8 text-primary" />
            Domain Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure custom domains for your white-label instance
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Domain</DialogTitle>
              <DialogDescription>
                Add a custom domain for your white-label instance
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="learn.yourcompany.com"
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Verification Method</Label>
                <Select
                  value={verificationMethod}
                  onValueChange={(value: any) => setVerificationMethod(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dns_txt">DNS TXT Record (Recommended)</SelectItem>
                    <SelectItem value="dns_cname">DNS CNAME Record</SelectItem>
                    <SelectItem value="http_file">HTTP File Upload</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDomain} disabled={isAdding || !newDomain}>
                {isAdding ? 'Adding...' : 'Add Domain'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Custom Domain Setup</AlertTitle>
        <AlertDescription>
          Custom domains allow you to access your platform at your own URL (e.g.,
          learn.yourcompany.com) instead of the default subdomain. Verification is required to prove
          ownership.
        </AlertDescription>
      </Alert>

      {/* Domains List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Domains</CardTitle>
          <CardDescription>Manage custom domains for your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading domains...</div>
          ) : domains.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No custom domains yet. Add one to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map(domain => {
                const instructions = getVerificationInstructions(domain);

                return (
                  <Card key={domain.id} className="p-4">
                    <div className="space-y-4">
                      {/* Domain Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{domain.domain}</h3>
                            {domain.is_primary && (
                              <Badge variant="outline" className="bg-blue-500/10">
                                Primary
                              </Badge>
                            )}
                            {domain.is_verified ? (
                              <Badge className="bg-green-500 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-500/10">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pending Verification
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Added {new Date(domain.created_at).toLocaleDateString()}
                            {domain.verified_at &&
                              ` • Verified ${new Date(domain.verified_at).toLocaleDateString()}`}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {!domain.is_verified && (
                            <Button
                              size="sm"
                              onClick={() => handleVerifyDomain(domain)}
                              className="gap-1"
                            >
                              <RefreshCw className="h-4 w-4" />
                              Verify
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDomain(domain.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Verification Instructions (Only if not verified) */}
                      {!domain.is_verified && (
                        <div className="pt-4 border-t space-y-3">
                          <h4 className="font-medium">{instructions.title}</h4>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                            {instructions.steps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ol>

                          {/* Copy verification token */}
                          <div className="flex items-center gap-2 mt-3">
                            <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                              {domain.verification_token}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(domain.verification_token)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
