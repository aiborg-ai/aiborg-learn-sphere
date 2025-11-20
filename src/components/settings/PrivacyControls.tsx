/**
 * Privacy Controls Component
 *
 * GDPR-compliant privacy management interface for users.
 * Provides controls for:
 * - Consent management
 * - Data export (Right to Access)
 * - Data deletion (Right to be Forgotten)
 * - PII viewing and management
 *
 * @module components/settings/PrivacyControls
 */

import React, { useState, useEffect } from 'react';
import { Download, Trash2, Shield, Eye, EyeOff, Lock, AlertTriangle } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { piiService, type DecryptedPII } from '@/services/encryption/pii-service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

/**
 * Consent types
 */
interface UserConsent {
  consent_type: string;
  granted: boolean;
  granted_at?: string;
  consent_version: string;
}

/**
 * Privacy Controls Component
 */
export const PrivacyControls = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [piiData, setPiiData] = useState<DecryptedPII | null>(null);
  const [showPII, setShowPII] = useState(false);
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');

  /**
   * Load user consents
   */
  useEffect(() => {
    loadConsents();
  }, []);

  /**
   * Fetch user consent records
   */
  const loadConsents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', user.id)
        .order('consent_type');

      if (error) throw error;

      // Initialize with default consents if none exist
      if (!data || data.length === 0) {
        setConsents([
          { consent_type: 'terms_of_service', granted: true, consent_version: '1.0' },
          { consent_type: 'privacy_policy', granted: true, consent_version: '1.0' },
          { consent_type: 'marketing_emails', granted: false, consent_version: '1.0' },
          { consent_type: 'analytics', granted: false, consent_version: '1.0' },
          { consent_type: 'cookies_functional', granted: true, consent_version: '1.0' },
          { consent_type: 'cookies_analytics', granted: false, consent_version: '1.0' },
          { consent_type: 'cookies_marketing', granted: false, consent_version: '1.0' },
        ]);
      } else {
        setConsents(data as UserConsent[]);
      }
    } catch {
      // Failed to load consents - will use defaults
    }
  };

  /**
   * Update user consent
   */
  const handleConsentChange = async (consentType: string, granted: boolean) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc('record_consent', {
        p_user_id: user.id,
        p_consent_type: consentType,
        p_granted: granted,
        p_consent_version: '1.0',
      });

      if (error) throw error;

      // Update local state
      setConsents(prev =>
        prev.map(consent =>
          consent.consent_type === consentType
            ? { ...consent, granted, granted_at: granted ? new Date().toISOString() : undefined }
            : consent
        )
      );

      toast({
        title: 'Consent Updated',
        description: `${getConsentLabel(consentType)} ${granted ? 'granted' : 'revoked'}`,
      });
    } catch (error) {
      toast({
        title: 'Failed to Update Consent',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  /**
   * Request data export (GDPR Article 15 & 20)
   */
  const handleDataExport = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc('request_data_export', {
        p_user_id: user.id,
        p_format: 'json',
      });

      if (error) throw error;

      toast({
        title: 'Data Export Requested',
        description:
          "Your data export will be ready shortly. You will receive an email when it's available.",
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load and view encrypted PII
   */
  const handleViewPII = async () => {
    if (showPII) {
      setShowPII(false);
      setPiiData(null);
      return;
    }

    setLoading(true);
    try {
      const data = await piiService.getPII();
      setPiiData(data);
      setShowPII(true);

      toast({
        title: 'PII Access Logged',
        description: 'Access to your personal information has been recorded for security.',
      });
    } catch (error) {
      toast({
        title: 'Failed to Load PII',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Request account deletion (GDPR Article 17)
   */
  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc('request_data_deletion', {
        p_user_id: user.id,
        p_reason: deletionReason || 'User requested account deletion',
      });

      if (error) throw error;

      toast({
        title: 'Deletion Request Submitted',
        description:
          'Your account deletion request has been submitted and will be reviewed by an administrator.',
      });

      setDeletionDialogOpen(false);
      setDeletionReason('');
    } catch (error) {
      toast({
        title: 'Deletion Request Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get human-readable consent label
   */
  const getConsentLabel = (consentType: string): string => {
    const labels: Record<string, string> = {
      terms_of_service: 'Terms of Service',
      privacy_policy: 'Privacy Policy',
      marketing_emails: 'Marketing Emails',
      analytics: 'Analytics & Usage Data',
      third_party_sharing: 'Third-Party Data Sharing',
      cookies_functional: 'Functional Cookies',
      cookies_analytics: 'Analytics Cookies',
      cookies_marketing: 'Marketing Cookies',
    };
    return labels[consentType] || consentType;
  };

  /**
   * Check if consent is required (cannot be disabled)
   */
  const isRequiredConsent = (consentType: string): boolean => {
    return ['terms_of_service', 'privacy_policy', 'cookies_functional'].includes(consentType);
  };

  return (
    <div className="space-y-6">
      {/* Consent Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Consent Management
          </CardTitle>
          <CardDescription>
            Manage your privacy preferences and consent settings (GDPR Article 7)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {consents.map(consent => (
            <div key={consent.consent_type} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={consent.consent_type} className="text-base">
                  {getConsentLabel(consent.consent_type)}
                </Label>
                {consent.granted_at && (
                  <p className="text-sm text-muted-foreground">
                    Granted: {new Date(consent.granted_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Switch
                id={consent.consent_type}
                checked={consent.granted}
                onCheckedChange={granted => handleConsentChange(consent.consent_type, granted)}
                disabled={isRequiredConsent(consent.consent_type)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Access & Portability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Export
          </CardTitle>
          <CardDescription>
            Download your data in machine-readable format (GDPR Article 15 & 20)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              You have the right to receive a copy of all your personal data in a structured,
              commonly used format.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button
              onClick={handleDataExport}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {loading ? 'Requesting Export...' : 'Export My Data (JSON)'}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Your export will include: profile information, course enrollments, payment history,
            consent records, and encrypted personal information.
          </p>
        </CardContent>
      </Card>

      {/* Encrypted PII Viewer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Encrypted Personal Information
          </CardTitle>
          <CardDescription>
            View your encrypted personal data (access is logged for security)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleViewPII}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            {showPII ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Personal Information
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                View Personal Information
              </>
            )}
          </Button>

          {showPII && piiData && (
            <div className="mt-4 space-y-2 border rounded-lg p-4 bg-muted/50">
              {piiData.phone && (
                <div>
                  <strong>Phone:</strong> {piiData.phone}
                </div>
              )}
              {piiData.address && (
                <div>
                  <strong>Address:</strong> {piiData.address}
                </div>
              )}
              {piiData.date_of_birth && (
                <div>
                  <strong>Date of Birth:</strong> {piiData.date_of_birth}
                </div>
              )}
              {piiData.encrypted_at && (
                <p className="text-xs text-muted-foreground mt-4">
                  Encrypted: {new Date(piiData.encrypted_at).toLocaleString()}
                  {piiData.last_accessed_at && (
                    <> | Last Accessed: {new Date(piiData.last_accessed_at).toLocaleString()}</>
                  )}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Account Deletion */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data (GDPR Article 17)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning: This action cannot be undone</AlertTitle>
            <AlertDescription>
              Deleting your account will permanently remove all your data, including courses,
              enrollments, and payment history. This action requires administrator approval.
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => setDeletionDialogOpen(true)}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Request Account Deletion
          </Button>
        </CardContent>
      </Card>

      {/* Deletion Confirmation Dialog */}
      <Dialog open={deletionDialogOpen} onOpenChange={setDeletionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Account Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action will be reviewed by an
              administrator before being processed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deletion-reason">Reason for deletion (optional)</Label>
              <Textarea
                id="deletion-reason"
                placeholder="Please tell us why you're deleting your account..."
                value={deletionReason}
                onChange={e => setDeletionReason(e.target.value)}
                rows={4}
              />
            </div>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  <li>All your personal data will be permanently deleted</li>
                  <li>Your courses and enrollments will be removed</li>
                  <li>This action cannot be reversed</li>
                  <li>You will be logged out immediately after approval</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletionDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={loading}>
              {loading ? 'Submitting...' : 'Confirm Deletion Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
