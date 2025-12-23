import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Icon } from '@/utils/iconLoader';
import { PrefetchLink } from '@/components/navigation/PrefetchLink';
import {
  prefetchDashboard,
  prefetchUserProfile,
  prefetchUserEnrollments,
  prefetchUserAchievements,
  createPrefetchOnHoverWithDelay,
  prefetchRouteChunk,
} from '@/utils/prefetch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FAQModal, TermsModal } from '@/components/modals';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/shared';
import { GlobalSearchEnhanced } from '@/components/search/GlobalSearchEnhanced';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { logger } from '@/utils/logger';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const { t } = useTranslation('navigation');
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();

      if (error) {
        logger.error('Sign out error:', error);
      }

      navigate('/');
    } catch (error) {
      logger.error('Sign out exception:', error);
      // Still navigate to home even if sign out fails
      navigate('/');
    }
  };

  // Helper function to handle navigation to home page sections
  const handleNavClick = (sectionId: string) => {
    if (location.pathname === '/') {
      // If on home page, scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        const yOffset = -80; // Account for fixed navbar height
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        // Update the URL hash without triggering navigation
        window.history.pushState(null, '', `#${sectionId}`);
      }
    } else {
      // If on another page, navigate to home page with hash
      navigate(`/#${sectionId}`);
    }
  };

  // Prefetch handlers for desktop dropdown menu
  const dashboardPrefetchHandlers = user?.id
    ? createPrefetchOnHoverWithDelay(async () => {
        prefetchRouteChunk('/dashboard');
        await prefetchDashboard(user.id);
      }, 300)
    : null;

  const profilePrefetchHandlers = user?.id
    ? createPrefetchOnHoverWithDelay(async () => {
        prefetchRouteChunk('/profile');
        await Promise.all([
          prefetchUserProfile(user.id),
          prefetchUserEnrollments(user.id),
          prefetchUserAchievements(user.id),
        ]);
      }, 300)
    : null;

  // Admin prefetch handler
  const adminPrefetchHandlers = isAdmin
    ? createPrefetchOnHoverWithDelay(async () => {
        prefetchRouteChunk('/admin');
      }, 300)
    : null;

  return (
    <nav
      className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl backdrop-saturate-150 border-b border-border/50 shadow-soft"
      aria-label={t('aria.mainNavigation')}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 transition-transform duration-200 hover:scale-105"
            aria-label={t('aria.aiborgHome')}
          >
            <picture>
              <source srcSet="/logo.webp" type="image/webp" />
              <img
                src="/logo.jpeg"
                alt="Aiborg logo"
                className="h-10 w-auto object-contain drop-shadow-sm"
              />
            </picture>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <PrefetchLink
              to="/ai-assessment"
              className="relative"
              aria-label={t('aria.aiAssessmentNewFeature')}
            >
              <Button
                variant="ghost"
                className="text-foreground/80 hover:text-foreground transition-colors gap-2"
              >
                <Icon name="Sparkles" size={16} aria-hidden="true" />
                {t('aiAssessment.title')}
                <Badge
                  className="absolute -top-2 -right-6 bg-red-500 text-white text-[10px] px-1.5 py-0.5"
                  aria-label={t('aiAssessment.badge')}
                >
                  {t('aiAssessment.badge')}
                </Badge>
              </Button>
            </PrefetchLink>
            <button
              onClick={() => handleNavClick('training-programs')}
              className="relative px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors cursor-pointer link-animated"
              aria-label={t('aria.navigateToPrograms')}
            >
              {t('menu.programs')}
            </button>
            <PrefetchLink
              to="/blog"
              className="relative px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors link-animated"
              aria-label={t('aria.goToBlog')}
            >
              {t('menu.blog')}
            </PrefetchLink>
            <button
              onClick={() => handleNavClick('events')}
              className="relative px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors cursor-pointer link-animated"
              aria-label={t('aria.navigateToEvents')}
            >
              {t('menu.events')}
            </button>
            <button
              onClick={() => handleNavClick('reviews')}
              className="relative px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors cursor-pointer link-animated"
              aria-label={t('aria.navigateToReviews')}
            >
              {t('menu.reviews')}
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className="relative px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors cursor-pointer link-animated"
              aria-label={t('aria.navigateToAbout')}
            >
              {t('menu.about')}
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="relative px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors cursor-pointer link-animated"
              aria-label={t('aria.navigateToContact')}
            >
              {t('menu.contact')}
            </button>
            <button
              onClick={() => setIsFAQOpen(true)}
              className="relative px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors link-animated"
              aria-label={t('aria.openFaq')}
            >
              {t('menu.faq')}
            </button>
            <button
              onClick={() => setIsTermsOpen(true)}
              className="relative px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors link-animated"
              aria-label={t('aria.openTerms')}
            >
              {t('menu.terms')}
            </button>

            {/* Global Search - AI-Powered */}
            {user && <GlobalSearchEnhanced />}

            {/* Keyboard Shortcuts Help */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.dispatchEvent(new CustomEvent('show-shortcuts-help'))}
                  aria-label={t('features.keyboardShortcuts')}
                >
                  <Icon name="Keyboard" size={20} aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('features.keyboardShortcutsHint')}</p>
              </TooltipContent>
            </Tooltip>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Language Switcher */}
            <LanguageSwitcher variant="ghost" showLabel={false} />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-foreground hover:bg-muted/10"
                    aria-label={t('aria.userAccountMenu')}
                  >
                    <Icon name="User" size={16} className="mr-2" aria-hidden="true" />
                    {profile?.display_name || user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-white/90 backdrop-blur-md border-white/20"
                  aria-label={t('user.menu')}
                >
                  <DropdownMenuItem
                    onClick={() => navigate('/dashboard')}
                    onMouseEnter={() => dashboardPrefetchHandlers?.onMouseEnter()}
                    onMouseLeave={() => dashboardPrefetchHandlers?.onMouseLeave()}
                    aria-label={t('aria.goToDashboard')}
                  >
                    <Icon name="LayoutDashboard" size={16} className="mr-2" aria-hidden="true" />
                    {t('user.dashboard')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate('/profile')}
                    onMouseEnter={() => profilePrefetchHandlers?.onMouseEnter()}
                    onMouseLeave={() => profilePrefetchHandlers?.onMouseLeave()}
                    aria-label={t('aria.goToProfile')}
                  >
                    <Icon name="User" size={16} className="mr-2" aria-hidden="true" />
                    {t('user.profile')}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => navigate('/admin')}
                        onMouseEnter={() => adminPrefetchHandlers?.onMouseEnter()}
                        onMouseLeave={() => adminPrefetchHandlers?.onMouseLeave()}
                        aria-label={t('aria.goToAdmin')}
                      >
                        <Icon name="Shield" size={16} className="mr-2" aria-hidden="true" />
                        {t('user.adminDashboard')}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} aria-label={t('aria.signOutOfAccount')}>
                    <Icon name="LogOut" size={16} className="mr-2" aria-hidden="true" />
                    {t('user.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-4">
                <PrefetchLink to="/auth">
                  <Button
                    variant="ghost"
                    className="text-foreground hover:bg-muted/10"
                    aria-label={t('aria.signInToAccount')}
                  >
                    {t('user.signIn')}
                  </Button>
                </PrefetchLink>
                <PrefetchLink to="/auth">
                  <Button className="btn-hero" aria-label={t('aria.getStartedWithAiborg')}>
                    {t('user.getStarted')}
                  </Button>
                </PrefetchLink>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-foreground active:scale-95 transition-transform"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? t('mobile.closeMenu') : t('mobile.openMenu')}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? (
              <Icon
                name="X"
                size={24}
                aria-hidden="true"
                className="rotate-90 transition-transform duration-300"
              />
            ) : (
              <Icon name="Menu" size={24} aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav
            id="mobile-menu"
            className="md:hidden py-4 space-y-4 border-t border-white/20 animate-in slide-in-from-top duration-300"
            aria-label={t('aria.mobileMenu')}
          >
            <button
              className="block w-full text-left text-foreground/80 hover:text-foreground active:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-muted/10 active:bg-muted/20"
              onClick={() => {
                handleNavClick('training-programs');
                setIsOpen(false);
              }}
              aria-label={t('aria.navigateToPrograms')}
            >
              {t('menu.programs')}
            </button>
            <PrefetchLink
              to="/blog"
              className="block text-foreground/80 hover:text-foreground active:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-muted/10 active:bg-muted/20"
              onClick={() => setIsOpen(false)}
              aria-label={t('aria.goToBlog')}
            >
              {t('menu.blog')}
            </PrefetchLink>
            <button
              className="block w-full text-left text-foreground/80 hover:text-foreground active:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-muted/10 active:bg-muted/20"
              onClick={() => {
                handleNavClick('events');
                setIsOpen(false);
              }}
              aria-label={t('aria.navigateToEvents')}
            >
              {t('menu.events')}
            </button>
            <button
              className="block w-full text-left text-foreground/80 hover:text-foreground active:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-muted/10 active:bg-muted/20"
              onClick={() => {
                handleNavClick('reviews');
                setIsOpen(false);
              }}
              aria-label={t('aria.navigateToReviews')}
            >
              {t('menu.reviews')}
            </button>
            <button
              className="block w-full text-left text-foreground/80 hover:text-foreground active:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-muted/10 active:bg-muted/20"
              onClick={() => {
                handleNavClick('about');
                setIsOpen(false);
              }}
              aria-label={t('aria.navigateToAbout')}
            >
              {t('menu.about')}
            </button>
            <button
              className="block w-full text-left text-foreground/80 hover:text-foreground active:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-muted/10 active:bg-muted/20"
              onClick={() => {
                handleNavClick('contact');
                setIsOpen(false);
              }}
              aria-label={t('aria.navigateToContact')}
            >
              {t('menu.contact')}
            </button>
            <button
              onClick={() => {
                setIsFAQOpen(true);
                setIsOpen(false);
              }}
              className="block w-full text-left text-foreground/80 hover:text-foreground active:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-muted/10 active:bg-muted/20"
              aria-label={t('aria.openFaq')}
            >
              {t('menu.faq')}
            </button>
            <button
              onClick={() => {
                setIsTermsOpen(true);
                setIsOpen(false);
              }}
              className="block w-full text-left text-foreground/80 hover:text-foreground active:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-muted/10 active:bg-muted/20"
              aria-label={t('aria.openTerms')}
            >
              {t('menu.terms')}
            </button>

            {user ? (
              <section
                className="space-y-2 pt-4 border-t border-muted/20"
                aria-label={t('aria.userAccountMenu')}
              >
                <p
                  className="text-foreground font-medium"
                  aria-label={t('aria.loggedInAs', { name: profile?.display_name || user.email })}
                >
                  {profile?.display_name || user.email}
                </p>
                <PrefetchLink
                  to="/dashboard"
                  prefetchFn={async () => user?.id && (await prefetchDashboard(user.id))}
                  prefetchDelay={300}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-foreground hover:bg-muted/10"
                    aria-label={t('aria.goToDashboard')}
                  >
                    <Icon name="LayoutDashboard" size={16} className="mr-2" aria-hidden="true" />
                    {t('user.dashboard')}
                  </Button>
                </PrefetchLink>
                <PrefetchLink
                  to="/profile"
                  prefetchFn={async () => {
                    if (user?.id) {
                      await Promise.all([
                        prefetchUserProfile(user.id),
                        prefetchUserEnrollments(user.id),
                        prefetchUserAchievements(user.id),
                      ]);
                    }
                  }}
                  prefetchDelay={300}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-foreground hover:bg-muted/10"
                    aria-label={t('aria.goToProfile')}
                  >
                    <Icon name="User" size={16} className="mr-2" aria-hidden="true" />
                    {t('user.profile')}
                  </Button>
                </PrefetchLink>
                {isAdmin && (
                  <PrefetchLink to="/admin">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-foreground hover:bg-muted/10"
                      aria-label={t('aria.goToAdmin')}
                    >
                      <Icon name="Shield" size={16} className="mr-2" aria-hidden="true" />
                      {t('user.adminDashboard')}
                    </Button>
                  </PrefetchLink>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-foreground hover:bg-muted/10"
                  onClick={handleSignOut}
                  aria-label={t('aria.signOutOfAccount')}
                >
                  <Icon name="LogOut" size={16} className="mr-2" aria-hidden="true" />
                  {t('user.signOut')}
                </Button>
              </section>
            ) : (
              <section
                className="space-y-2 pt-4 border-t border-muted/20"
                aria-label={t('aria.userAccountMenu')}
              >
                <PrefetchLink to="/auth">
                  <Button
                    variant="ghost"
                    className="w-full text-foreground hover:bg-muted/10"
                    aria-label={t('aria.signInToAccount')}
                  >
                    {t('user.signIn')}
                  </Button>
                </PrefetchLink>
                <PrefetchLink to="/auth">
                  <Button className="w-full btn-hero" aria-label={t('aria.getStartedWithAiborg')}>
                    {t('user.getStarted')}
                  </Button>
                </PrefetchLink>
              </section>
            )}
          </nav>
        )}
      </div>

      {/* FAQ and Terms Modals */}
      <FAQModal isOpen={isFAQOpen} onClose={() => setIsFAQOpen(false)} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </nav>
  );
}
