import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('auth');
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
          title: t('errors.tooManyRequests'),
          description: rateLimit.message || t('errors.tryAgainLater'),
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
        title: t('resetPassword.success'),
        description: t('resetPassword.checkEmail'),
      });
      setShowResetDialog(false);
      setResetEmail('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('errors.resetFailed');
      toast({
        title: t('errors.signInFailed'),
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
          <p className="text-white/80">{t('loading')}</p>
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
            {t('backToHome')}
          </Link>
          <div className="flex items-center justify-center mb-4">
            <picture>
              <source srcSet="/logo.webp" type="image/webp" />
              <img src="/logo.jpeg" alt="Aiborg" className="h-12 w-auto object-contain" />
            </picture>
          </div>
          <p className="text-white/80">{t('tagline')}</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">{t('welcome')}</CardTitle>
            <CardDescription className="text-white/80 text-center">
              {t('welcomeSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-white/10">
                <TabsTrigger value="signin" className="text-white data-[state=active]:bg-white/20">
                  {t('signIn.title')}
                </TabsTrigger>
                <TabsTrigger
                  value="magiclink"
                  className="text-white data-[state=active]:bg-white/20"
                >
                  {t('magicLink.title')}
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-white data-[state=active]:bg-white/20">
                  {t('signUp.title')}
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
                  {t('oauthNotice')}
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
                    {t('oauth.continueWithGoogle')}
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
                    {t('oauth.continueWithGitHub')}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-white/60">
                      {t('oauth.orContinueWithEmail')}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      {t('signIn.email')}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t('signIn.emailPlaceholder')}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-white">
                        {t('signIn.password')}
                      </Label>
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-xs text-white/80 hover:text-white"
                        onClick={() => setShowResetDialog(true)}
                      >
                        {t('signIn.forgotPassword')}
                      </Button>
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder={t('signIn.passwordPlaceholder')}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <Button type="submit" className="w-full btn-hero" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('signIn.button')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="magiclink" className="space-y-4">
                <MagicLinkAuth
                  onSuccess={() => {
                    toast({
                      title: t('magicLink.success'),
                      description: t('magicLink.checkEmail'),
                    });
                  }}
                  redirectTo={`${window.location.origin}/auth/callback`}
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
                    {t('oauth.continueWithGoogle')}
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
                    {t('oauth.continueWithGitHub')}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-white/60">
                      {t('oauth.orSignUpWithEmail')}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Account Type Selection */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-white">{t('accountType.label')}</div>
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
                          {t('accountType.individual')}
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
                          {t('accountType.companyAdmin')}
                        </Label>
                      </div>
                    </RadioGroup>
                    {accountType === 'company_admin' && (
                      <p className="text-xs text-white/60">
                        {t('accountType.companyAdminDescription')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-white">
                      {t('signUp.displayName')}
                    </Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      type="text"
                      placeholder={t('signUp.displayNamePlaceholder')}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>

                  {/* Company Admin Fields */}
                  {accountType === 'company_admin' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-white">
                          {t('company.name')} <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="companyName"
                          name="companyName"
                          type="text"
                          placeholder={t('company.namePlaceholder')}
                          required={accountType === 'company_admin'}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="industry" className="text-white">
                          {t('company.industry')} <span className="text-red-400">*</span>
                        </Label>
                        <Select value={industry} onValueChange={setIndustry}>
                          <SelectTrigger
                            id="industry"
                            className="bg-white/10 border-white/20 text-white"
                          >
                            <SelectValue placeholder={t('company.industryPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">
                              {t('company.industries.technology')}
                            </SelectItem>
                            <SelectItem value="healthcare">
                              {t('company.industries.healthcare')}
                            </SelectItem>
                            <SelectItem value="finance">
                              {t('company.industries.finance')}
                            </SelectItem>
                            <SelectItem value="education">
                              {t('company.industries.education')}
                            </SelectItem>
                            <SelectItem value="retail">{t('company.industries.retail')}</SelectItem>
                            <SelectItem value="manufacturing">
                              {t('company.industries.manufacturing')}
                            </SelectItem>
                            <SelectItem value="professional-services">
                              {t('company.industries.professionalServices')}
                            </SelectItem>
                            <SelectItem value="hospitality">
                              {t('company.industries.hospitality')}
                            </SelectItem>
                            <SelectItem value="other">{t('company.industries.other')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companySize" className="text-white">
                          {t('company.size')} <span className="text-red-400">*</span>
                        </Label>
                        <Select value={companySize} onValueChange={setCompanySize}>
                          <SelectTrigger
                            id="companySize"
                            className="bg-white/10 border-white/20 text-white"
                          >
                            <SelectValue placeholder={t('company.sizePlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-10">{t('company.sizes.1-10')}</SelectItem>
                            <SelectItem value="11-50">{t('company.sizes.11-50')}</SelectItem>
                            <SelectItem value="51-200">{t('company.sizes.51-200')}</SelectItem>
                            <SelectItem value="201-500">{t('company.sizes.201-500')}</SelectItem>
                            <SelectItem value="501-1000">{t('company.sizes.501-1000')}</SelectItem>
                            <SelectItem value="1000+">{t('company.sizes.1000+')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white">
                      {t('signUp.email')}
                    </Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder={t('signUp.emailPlaceholder')}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white">
                      {t('signUp.password')}
                    </Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder={t('signUp.passwordPlaceholder')}
                      required
                      minLength={12}
                      maxLength={128}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      title={t('signUp.passwordHint')}
                    />
                    <p className="text-xs text-white/60">{t('signUp.passwordHint')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">
                      {t('signUp.confirmPassword')}
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder={t('signUp.confirmPasswordPlaceholder')}
                      required
                      minLength={12}
                      maxLength={128}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <Button type="submit" className="w-full btn-hero" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('signUp.button')}
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
            <DialogTitle>{t('resetPassword.title')}</DialogTitle>
            <DialogDescription>{t('resetPassword.subtitle')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t('resetPassword.email')}</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder={t('resetPassword.emailPlaceholder')}
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
                {t('resetPassword.cancel')}
              </Button>
              <Button type="submit" disabled={isResetting} className="flex-1">
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('resetPassword.sending')}
                  </>
                ) : (
                  t('resetPassword.button')
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
