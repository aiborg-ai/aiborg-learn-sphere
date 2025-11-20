import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Building2, User } from '@/components/ui/icons';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ArrowLeft } from '@/components/ui/icons';
import { Link } from 'react-router-dom';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { GitHubIcon } from '@/components/icons/GitHubIcon';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { validatePassword } from '@/utils/passwordValidation';
import {
  checkSignInLimit,
  checkSignUpLimit,
  checkPasswordResetLimit,
  checkOAuthLimit,
  resetAuthLimit,
} from '@/utils/rateLimiter';
import { MagicLinkAuth } from '@/components/auth/MagicLinkAuth';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('signin');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [accountType, setAccountType] = useState<'individual' | 'company_admin'>('individual');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const {
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    user,
    loading: authLoading,
  } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if user is already logged in
  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) return;

    if (user) {
      navigate('/');
    }
  }, [authLoading, user, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Check rate limit
    const rateLimit = checkSignInLimit(email);
    if (!rateLimit.allowed) {
      setError(rateLimit.message || 'Too many sign-in attempts. Please try again later.');
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    } else {
      // Reset rate limit on successful sign in
      resetAuthLimit(email);
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    // Check rate limit for OAuth
    const rateLimit = checkOAuthLimit('google');
    if (!rateLimit.allowed) {
      setError(rateLimit.message || 'Too many OAuth attempts. Please try again later.');
      setIsGoogleLoading(false);
      return;
    }

    const { error } = await signInWithGoogle();

    if (error) {
      setError(error.message);
      setIsGoogleLoading(false);
    }
    // Navigation will happen automatically via auth state change listener
  };

  const handleGitHubSignIn = async () => {
    setIsGitHubLoading(true);
    setError(null);

    // Check rate limit for OAuth
    const rateLimit = checkOAuthLimit('github');
    if (!rateLimit.allowed) {
      setError(rateLimit.message || 'Too many OAuth attempts. Please try again later.');
      setIsGitHubLoading(false);
      return;
    }

    const { error } = await signInWithGitHub();

    if (error) {
      setError(error.message);
      setIsGitHubLoading(false);
    }
    // Navigation will happen automatically via auth state change listener
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const displayName = formData.get('displayName') as string;

    // Company admin specific fields
    const companyName = formData.get('companyName') as string;

    // Check rate limit
    const rateLimit = checkSignUpLimit(email);
    if (!rateLimit.allowed) {
      setError(rateLimit.message || 'Too many sign-up attempts. Please try again later.');
      setIsLoading(false);
      return;
    }

    // Validate display name
    if (!displayName || displayName.trim().length < 2) {
      setError('Display name must be at least 2 characters long');
      setIsLoading(false);
      return;
    }

    if (displayName.length > 50) {
      setError('Display name must be less than 50 characters');
      setIsLoading(false);
      return;
    }

    // Check for invalid characters in display name
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(displayName)) {
      setError('Display name can only contain letters, numbers, spaces, hyphens, and underscores');
      setIsLoading(false);
      return;
    }

    // Validate company admin specific fields
    if (accountType === 'company_admin') {
      if (!companyName || companyName.trim().length < 2) {
        setError('Company name is required and must be at least 2 characters long');
        setIsLoading(false);
        return;
      }

      if (!industry) {
        setError('Please select an industry');
        setIsLoading(false);
        return;
      }

      if (!companySize) {
        setError('Please select company size');
        setIsLoading(false);
        return;
      }
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message);
      setIsLoading(false);
      return;
    }

    // Prepare company data if company admin
    const companyData =
      accountType === 'company_admin'
        ? {
            company_name: companyName.trim(),
            industry,
            company_size: companySize,
          }
        : undefined;

    const { error } = await signUp(email, password, displayName.trim(), accountType, companyData);

    if (error) {
      if (error.message.includes('already registered')) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(error.message);
      }
    } else {
      setError(null);
      // Show success message
      setActiveTab('signin');
      const successMessage =
        accountType === 'company_admin'
          ? 'Company admin account created successfully! Please check your email and then sign in.'
          : 'Account created successfully! Please check your email and then sign in.';
      setError(successMessage);
    }
    setIsLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);

    try {
      // Check rate limit
      const rateLimit = checkPasswordResetLimit(resetEmail);
      if (!rateLimit.allowed) {
        toast({
          title: 'Too many requests',
          description: rateLimit.message || 'Please try again later.',
          variant: 'destructive',
        });
        setIsResetting(false);
        return;
      }

      // Use environment variable for redirect URL (security improvement)
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const redirectUrl = `${appUrl}/auth/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast({
        title: 'Password reset email sent',
        description: 'Please check your email for the password reset link.',
      });
      setShowResetDialog(false);
      setResetEmail('');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send password reset email';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white hover:text-secondary transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.jpeg" alt="Aiborg" className="h-12 w-auto object-contain" />
          </div>
          <p className="text-white/80">Join the AI learning revolution</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">Welcome</CardTitle>
            <CardDescription className="text-white/80 text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-white/10">
                <TabsTrigger value="signin" className="text-white data-[state=active]:bg-white/20">
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="magiclink"
                  className="text-white data-[state=active]:bg-white/20"
                >
                  Magic Link
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-white data-[state=active]:bg-white/20">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert className="mt-4 bg-red-500/20 border-red-500/50">
                  <AlertDescription className="text-white">{error}</AlertDescription>
                </Alert>
              )}

              {/* Temporary notice about OAuth redirect */}
              <Alert className="mt-4 bg-blue-500/10 border-blue-500/30">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-white/80 text-xs">
                  Note: You'll be securely redirected to our authentication provider for sign-in.
                </AlertDescription>
              </Alert>

              <TabsContent value="signin" className="space-y-4">
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-white text-gray-900 hover:bg-gray-100 border-gray-300"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isLoading || isGitHubLoading}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <GoogleIcon className="mr-2 h-4 w-4" />
                    )}
                    Continue with Google
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-gray-900 text-white hover:bg-gray-800 border-gray-700"
                    onClick={handleGitHubSignIn}
                    disabled={isGitHubLoading || isLoading || isGoogleLoading}
                  >
                    {isGitHubLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <GitHubIcon className="mr-2 h-4 w-4" />
                    )}
                    Continue with GitHub
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-white/60">
                      Or continue with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-white">
                        Password
                      </Label>
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-xs text-white/80 hover:text-white"
                        onClick={() => setShowResetDialog(true)}
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <Button type="submit" className="w-full btn-hero" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="magiclink" className="space-y-4">
                <MagicLinkAuth
                  onSuccess={() => {
                    toast({
                      title: 'Magic Link Sent!',
                      description: 'Check your email for a sign-in link.',
                    });
                  }}
                  redirectTo={window.location.origin}
                />
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-white text-gray-900 hover:bg-gray-100 border-gray-300"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isLoading || isGitHubLoading}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <GoogleIcon className="mr-2 h-4 w-4" />
                    )}
                    Continue with Google
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-gray-900 text-white hover:bg-gray-800 border-gray-700"
                    onClick={handleGitHubSignIn}
                    disabled={isGitHubLoading || isLoading || isGoogleLoading}
                  >
                    {isGitHubLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <GitHubIcon className="mr-2 h-4 w-4" />
                    )}
                    Continue with GitHub
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-white/60">Or sign up with email</span>
                  </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Account Type Selection */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-white">Account Type</div>
                    <RadioGroup
                      value={accountType}
                      onValueChange={value =>
                        setAccountType(value as 'individual' | 'company_admin')
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-3 flex-1 cursor-pointer hover:bg-white/20">
                        <RadioGroupItem value="individual" id="individual" className="text-white" />
                        <Label
                          htmlFor="individual"
                          className="text-white cursor-pointer flex items-center gap-2"
                        >
                          <User className="h-4 w-4" />
                          Individual
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-3 flex-1 cursor-pointer hover:bg-white/20">
                        <RadioGroupItem
                          value="company_admin"
                          id="company_admin"
                          className="text-white"
                        />
                        <Label
                          htmlFor="company_admin"
                          className="text-white cursor-pointer flex items-center gap-2"
                        >
                          <Building2 className="h-4 w-4" />
                          Company Admin
                        </Label>
                      </div>
                    </RadioGroup>
                    {accountType === 'company_admin' && (
                      <p className="text-xs text-white/60">
                        As a company admin, you can create your company profile and take AI
                        readiness assessments for your organization.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-white">
                      Display Name
                    </Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      type="text"
                      placeholder="Enter your display name"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>

                  {/* Company Admin Fields */}
                  {accountType === 'company_admin' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-white">
                          Company Name <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="companyName"
                          name="companyName"
                          type="text"
                          placeholder="Enter your company name"
                          required={accountType === 'company_admin'}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="industry" className="text-white">
                          Industry <span className="text-red-400">*</span>
                        </Label>
                        <Select value={industry} onValueChange={setIndustry}>
                          <SelectTrigger
                            id="industry"
                            className="bg-white/10 border-white/20 text-white"
                          >
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="professional-services">
                              Professional Services
                            </SelectItem>
                            <SelectItem value="hospitality">Hospitality</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companySize" className="text-white">
                          Company Size <span className="text-red-400">*</span>
                        </Label>
                        <Select value={companySize} onValueChange={setCompanySize}>
                          <SelectTrigger
                            id="companySize"
                            className="bg-white/10 border-white/20 text-white"
                          >
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 employees</SelectItem>
                            <SelectItem value="11-50">11-50 employees</SelectItem>
                            <SelectItem value="51-200">51-200 employees</SelectItem>
                            <SelectItem value="201-500">201-500 employees</SelectItem>
                            <SelectItem value="501-1000">501-1000 employees</SelectItem>
                            <SelectItem value="1000+">1000+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white">
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white">
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      required
                      minLength={12}
                      maxLength={128}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      title="Password must be at least 12 characters with uppercase, lowercase, numbers, and special characters"
                    />
                    <p className="text-xs text-white/60">
                      Must be 12+ characters with uppercase, lowercase, numbers, and special
                      characters
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      required
                      minLength={12}
                      maxLength={128}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <Button type="submit" className="w-full btn-hero" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                required
                disabled={isResetting}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowResetDialog(false)}
                disabled={isResetting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isResetting} className="flex-1">
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Email'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
