/**
 * Multi-Factor Authentication Settings Component
 *
 * Allows users to:
 * - Enable 2FA with TOTP authenticator apps
 * - View QR code for enrollment
 * - Verify setup with test code
 * - Manage enrolled factors
 * - Disable 2FA
 *
 * @module components/settings/MFASettings
 */

import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Trash2, AlertCircle } from '@/components/ui/icons';
import { mfaService, type MFAFactor } from '@/services/auth/mfa-service';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

type EnrollmentStep = 'initial' | 'qr-code' | 'verify' | 'complete';

export const MFASettings = () => {
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentStep, setEnrollmentStep] = useState<EnrollmentStep>('initial');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load existing MFA factors
  useEffect(() => {
    loadFactors();
  }, []);

  const loadFactors = async () => {
    try {
      setLoading(true);
      const enrolledFactors = await mfaService.listFactors();
      setFactors(enrolledFactors);
      logger.info('Loaded MFA factors', { count: enrolledFactors.length });
    } catch (_error) {
      logger._error('Failed to load MFA factors', _error);
      toast.error('Failed to load 2FA settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollStart = async () => {
    try {
      setIsProcessing(true);
      logger.info('Starting MFA enrollment');

      const enrollment = await mfaService.enrollMFA('Authenticator App');

      setQrCode(enrollment.qrCode);
      setSecret(enrollment.secret);
      setFactorId(enrollment.factorId);
      setEnrollmentStep('qr-code');

      toast.success('Scan the QR code with your authenticator app');
    } catch (_error) {
      logger._error('MFA enrollment start failed', _error);
      toast.error('Failed to start 2FA enrollment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerify = async () => {
    if (!factorId || !verificationCode) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    if (!/^\d{6}$/.test(verificationCode)) {
      toast.error('Code must be 6 digits');
      return;
    }

    try {
      setIsProcessing(true);
      logger.info('Verifying MFA enrollment');

      await mfaService.completeEnrollment(factorId, verificationCode);

      setEnrollmentStep('complete');
      toast.success('Two-factor authentication enabled!');

      // Reload factors
      await loadFactors();

      // Reset state after short delay
      setTimeout(() => {
        resetEnrollmentState();
      }, 2000);
    } catch (_error) {
      logger._error('MFA verification failed', _error);
      toast.error('Invalid code. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnenroll = async (factorIdToRemove: string) => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }

    try {
      setIsProcessing(true);
      logger.info('Unenrolling MFA factor', { factorId: factorIdToRemove });

      await mfaService.unenrollMFA(factorIdToRemove);

      toast.success('Two-factor authentication disabled');
      await loadFactors();
    } catch (_error) {
      logger._error('MFA unenrollment failed', _error);
      toast.error('Failed to disable 2FA');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetEnrollmentState = () => {
    setEnrollmentStep('initial');
    setQrCode(null);
    setSecret(null);
    setFactorId(null);
    setVerificationCode('');
  };

  const handleCancelEnrollment = () => {
    if (factorId) {
      // Optionally unenroll the incomplete factor
      mfaService.unenrollMFA(factorId).catch(error => {
        logger.error('Failed to cleanup incomplete enrollment', error);
      });
    }
    resetEnrollmentState();
  };

  const copySecretToClipboard = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      toast.success('Secret key copied to clipboard');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasMFA = factors.some(f => f.status === 'verified');

  return (
    <div className="space-y-4">
      {/* Main MFA Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {hasMFA ? (
              <ShieldCheck className="h-6 w-6 text-green-600" />
            ) : (
              <Shield className="h-6 w-6 text-muted-foreground" />
            )}
            <div>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Security Notice */}
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Enhanced Security</AlertTitle>
            <AlertDescription>
              Two-factor authentication (2FA) requires you to enter a code from your authenticator
              app in addition to your password when signing in.
            </AlertDescription>
          </Alert>

          {/* Enrollment Flow */}
          {enrollmentStep === 'initial' && !hasMFA && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                2FA is currently disabled for your account.
              </p>
              <Button onClick={handleEnrollStart} disabled={isProcessing}>
                <Shield className="mr-2 h-4 w-4" />
                Enable Two-Factor Authentication
              </Button>
            </div>
          )}

          {enrollmentStep === 'qr-code' && qrCode && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium mb-2">Step 1: Scan QR Code</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Use your authenticator app (Google Authenticator, Authy, etc.) to scan this QR
                  code:
                </p>
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img src={qrCode} alt="QR Code for 2FA setup" className="w-64 h-64" />
                  </div>
                </div>

                {/* Manual Entry Option */}
                {secret && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      Can't scan? Enter this code manually:
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="bg-muted px-3 py-1 rounded text-sm font-mono">{secret}</code>
                      <Button size="sm" variant="outline" onClick={copySecretToClipboard}>
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-center">
                <Button onClick={() => setEnrollmentStep('verify')} disabled={isProcessing}>
                  Next: Verify Code
                </Button>
                <Button variant="outline" onClick={handleCancelEnrollment} disabled={isProcessing}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {enrollmentStep === 'verify' && (
            <div className="space-y-4 max-w-sm mx-auto">
              <div>
                <h3 className="font-medium mb-2 text-center">Step 2: Verify Setup</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Enter the 6-digit code from your authenticator app:
                </p>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="verification-code">Verification Code</Label>
                    <Input
                      id="verification-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={verificationCode}
                      onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="text-center text-2xl tracking-widest font-mono"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && verificationCode.length === 6) {
                          handleVerify();
                        }
                      }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleVerify}
                      disabled={isProcessing || verificationCode.length !== 6}
                      className="flex-1"
                    >
                      Verify & Enable
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEnrollmentStep('qr-code')}
                      disabled={isProcessing}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {enrollmentStep === 'complete' && (
            <div className="text-center py-8">
              <ShieldCheck className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Two-Factor Authentication Enabled!</h3>
              <p className="text-sm text-muted-foreground">
                Your account is now protected with 2FA
              </p>
            </div>
          )}

          {/* Active Factors List */}
          {factors.length > 0 && enrollmentStep === 'initial' && (
            <div className="mt-6">
              <h3 className="font-medium mb-3">Active Authenticators</h3>
              <div className="space-y-2">
                {factors.map(factor => (
                  <div
                    key={factor.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{factor.friendlyName}</p>
                        <p className="text-xs text-muted-foreground">
                          Added {new Date(factor.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnenroll(factor.id)}
                      disabled={isProcessing}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        {hasMFA && enrollmentStep === 'initial' && (
          <CardFooter>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Backup codes coming soon:</strong> Save backup codes in case you lose access
                to your authenticator app.
              </AlertDescription>
            </Alert>
          </CardFooter>
        )}
      </Card>

      {/* Recommended Apps */}
      {!hasMFA && enrollmentStep === 'initial' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommended Authenticator Apps</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Google Authenticator (iOS, Android)</li>
              <li>• Authy (iOS, Android, Desktop)</li>
              <li>• Microsoft Authenticator (iOS, Android)</li>
              <li>• 1Password (iOS, Android, Desktop)</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
