/**
 * Magic Link Authentication Component
 *
 * Provides passwordless authentication via email magic links.
 * Users receive a secure one-time link to sign in without a password.
 *
 * @module components/auth/MagicLinkAuth
 */

import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle, AlertCircle } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { checkSignInLimit, resetAuthLimit } from '@/utils/rateLimiter';

interface MagicLinkAuthProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export const MagicLinkAuth: React.FC<MagicLinkAuthProps> = ({
  onSuccess,
  redirectTo = window.location.origin,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Validate email format
   */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Handle magic link request
   */
  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate email
    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    // Check rate limit
    const rateLimit = checkSignInLimit(email);
    if (!rateLimit.allowed) {
      setError(rateLimit.message || 'Too many sign-in attempts. Please try again later.');
      setIsLoading(false);
      return;
    }

    try {
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true, // Create user if doesn't exist
        },
      });

      if (magicLinkError) {
        throw magicLinkError;
      }

      // Success - show confirmation
      setEmailSent(true);
      resetAuthLimit(email);

      toast({
        title: 'Magic Link Sent!',
        description: 'Check your email for a sign-in link.',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to send magic link. Please try again.');

      toast({
        title: 'Failed to Send Magic Link',
        description: error.message || 'Please try again or use another sign-in method.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend magic link
   */
  const handleResend = async () => {
    setEmailSent(false);
    await handleMagicLinkSignIn({ preventDefault: () => {} } as React.FormEvent);
  };

  if (emailSent) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-900">Check Your Email</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            We've sent a magic link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-300 bg-green-100">
            <Mail className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Magic Link Sent</AlertTitle>
            <AlertDescription className="text-green-700">
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Click the link in your email to sign in</li>
                <li>The link is valid for 1 hour</li>
                <li>You can close this window</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Resend Magic Link'}
            </Button>

            <Button variant="ghost" onClick={() => setEmailSent(false)} className="w-full">
              Use a Different Email
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Sign In with Magic Link
        </CardTitle>
        <CardDescription>
          No password needed. We'll send you a secure link to sign in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="magic-link-email">Email Address</Label>
            <Input
              id="magic-link-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="email"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              We'll email you a magic link for a password-free sign in.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !email}
            className="w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending Magic Link...
              </>
            ) : (
              <>
                Send Magic Link
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertTitle>How it works</AlertTitle>
            <AlertDescription>
              <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
                <li>Enter your email address</li>
                <li>Check your inbox for a magic link</li>
                <li>Click the link to sign in instantly</li>
                <li>No password required!</li>
              </ol>
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  );
};
