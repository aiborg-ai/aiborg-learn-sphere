import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Icon } from '@/utils/iconLoader';
import { PrefetchLink } from '@/components/navigation/PrefetchLink';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { FAQModal, TermsModal } from '@/components/modals';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/shared';
import { GlobalSearchEnhanced } from '@/components/search/GlobalSearchEnhanced';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { logger } from '@/utils/logger';

// Menu item component for navigation dropdowns
const MenuLink = ({
  href,
  icon,
  title,
  description,
  badge,
  onClick,
  external,
}: {
  href?: string;
  icon: string;
  title: string;
  description: string;
  badge?: string;
  onClick?: () => void;
  external?: boolean;
}) => {
  const content = (
    <div className="flex items-start gap-3 p-3 rounded-md hover:bg-accent transition-colors cursor-pointer">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon name={icon} size={20} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          {badge && (
            <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">{badge}</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link to={href || '/'}>
      <NavigationMenuLink asChild>{content}</NavigationMenuLink>
    </Link>
  );
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const { t } = useTranslation('navigation');
  const { user, profile, signOut, isAdmin } = useAuth();
  const { shouldShowTip } = useOnboardingContext();
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
      navigate('/');
    }
  };

  // Helper function to handle navigation to home page sections
  const handleNavClick = (sectionId: string) => {
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        const yOffset = -80;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        window.history.pushState(null, '', `#${sectionId}`);
      }
    } else {
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

  const adminPrefetchHandlers = isAdmin
    ? createPrefetchOnHoverWithDelay(async () => {
        prefetchRouteChunk('/admin');
      }, 300)
    : null;

  const studioPrefetchHandlers = isAdmin
    ? createPrefetchOnHoverWithDelay(async () => {
        prefetchRouteChunk('/studio');
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
          <div className="hidden md:flex items-center gap-2">
            <NavigationMenu>
              <NavigationMenuList>
                {/* Learn Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-foreground/80 hover:text-foreground hover:bg-accent/50">
                    <Icon name="GraduationCap" size={16} className="mr-1.5" />
                    Learn
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[400px] p-4 space-y-1">
                      <MenuLink
                        href="/ai-assessment"
                        icon="Sparkles"
                        title="AI Assessment"
                        description="Evaluate your AI knowledge and skills with our comprehensive assessment"
                        badge="NEW"
                      />
                      <MenuLink
                        icon="BookOpen"
                        title="Training Programs"
                        description="Explore our structured AI training courses and learning paths"
                        onClick={() => handleNavClick('training-programs')}
                      />
                      <MenuLink
                        href="/workshops"
                        icon="Users"
                        title="Workshops"
                        description="Join interactive workshops led by industry experts"
                      />
                      <MenuLink
                        href="/marketplace"
                        icon="Globe"
                        title="Marketplace"
                        description="Discover AI courses from global providers like Coursera, edX, and more"
                        badge="NEW"
                      />
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Discover Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-foreground/80 hover:text-foreground hover:bg-accent/50">
                    <Icon name="Compass" size={16} className="mr-1.5" />
                    Discover
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[400px] p-4 space-y-1">
                      <MenuLink
                        href="/blog"
                        icon="FileText"
                        title="Blog"
                        description="Read articles, insights, and updates on AI and technology"
                      />
                      <MenuLink
                        href="/knowledgebase"
                        icon="Library"
                        title="Knowledgebase"
                        description="Explore AI pioneers, companies, events, and research papers"
                      />
                      <MenuLink
                        href="/summit"
                        icon="Layers"
                        title="AI Impact Summit"
                        description="India AI Impact Summit 2026 - Seven Chakras Resource Hub"
                        badge="NEW"
                      />
                      <MenuLink
                        icon="Calendar"
                        title="Events"
                        description="Upcoming conferences, meetups, and community events"
                        onClick={() => handleNavClick('events')}
                      />
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* About Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-foreground/80 hover:text-foreground hover:bg-accent/50">
                    <Icon name="Info" size={16} className="mr-1.5" />
                    About
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[350px] p-4 space-y-1">
                      <MenuLink
                        icon="Building2"
                        title="About Us"
                        description="Learn about our mission to democratize AI education"
                        onClick={() => handleNavClick('about')}
                      />
                      <MenuLink
                        icon="Star"
                        title="Reviews"
                        description="See what our learners say about their experience"
                        onClick={() => handleNavClick('reviews')}
                      />
                      <MenuLink
                        icon="Mail"
                        title="Contact"
                        description="Get in touch with our team for support or inquiries"
                        onClick={() => handleNavClick('contact')}
                      />
                      <MenuLink
                        icon="HelpCircle"
                        title="FAQ"
                        description="Frequently asked questions and answers"
                        onClick={() => setIsFAQOpen(true)}
                      />
                      <MenuLink
                        icon="ScrollText"
                        title="Terms & Privacy"
                        description="Our terms of service and privacy policy"
                        onClick={() => setIsTermsOpen(true)}
                      />
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Utility Icons */}
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-border/50">
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
            </div>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-foreground hover:bg-muted/10 ml-2"
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
                  <DropdownMenuItem
                    onClick={() => navigate('/workshops')}
                    aria-label={t('aria.goToMyWorkshops')}
                  >
                    <Icon name="Users" size={16} className="mr-2" aria-hidden="true" />
                    {t('user.myWorkshops')}
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
                      <DropdownMenuItem
                        onClick={() => navigate('/studio')}
                        onMouseEnter={() => studioPrefetchHandlers?.onMouseEnter()}
                        onMouseLeave={() => studioPrefetchHandlers?.onMouseLeave()}
                        aria-label="Go to Content Studio"
                      >
                        <Icon name="Wand2" size={16} className="mr-2" aria-hidden="true" />
                        Content Studio
                        <Badge className="ml-2 bg-purple-500 text-white text-[10px] px-1.5 py-0.5">
                          New
                        </Badge>
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
              <div className="flex items-center gap-2 ml-2">
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
            className="md:hidden py-4 space-y-2 border-t border-white/20 animate-in slide-in-from-top duration-300"
            aria-label={t('aria.mobileMenu')}
          >
            {/* Learn Section */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                Learn
              </p>
              <PrefetchLink
                to="/ai-assessment"
                className="flex items-center gap-3 text-foreground/80 hover:text-foreground py-2 px-3 rounded-lg hover:bg-muted/10"
                onClick={() => setIsOpen(false)}
              >
                <Icon name="Sparkles" size={18} />
                AI Assessment
                <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">NEW</Badge>
              </PrefetchLink>
              <button
                className="flex items-center gap-3 w-full text-left text-foreground/80 hover:text-foreground py-2 px-3 rounded-lg hover:bg-muted/10"
                onClick={() => {
                  handleNavClick('training-programs');
                  setIsOpen(false);
                }}
              >
                <Icon name="BookOpen" size={18} />
                Programs
              </button>
              <PrefetchLink
                to="/workshops"
                className="flex items-center gap-3 text-foreground/80 hover:text-foreground py-2 px-3 rounded-lg hover:bg-muted/10"
                onClick={() => setIsOpen(false)}
              >
                <Icon name="Users" size={18} />
                Workshops
              </PrefetchLink>
              <PrefetchLink
                to="/marketplace"
                className="flex items-center gap-3 text-foreground/80 hover:text-foreground py-2 px-3 rounded-lg hover:bg-muted/10"
                onClick={() => setIsOpen(false)}
              >
                <Icon name="Globe" size={18} />
                Marketplace
                <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">NEW</Badge>
              </PrefetchLink>
            </div>

            {/* Discover Section */}
            <div className="space-y-1 pt-2 border-t border-muted/20">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                Discover
              </p>
              <PrefetchLink
                to="/blog"
                className="flex items-center gap-3 text-foreground/80 hover:text-foreground py-2 px-3 rounded-lg hover:bg-muted/10"
                onClick={() => setIsOpen(false)}
              >
                <Icon name="FileText" size={18} />
                Blog
              </PrefetchLink>
              <PrefetchLink
                to="/knowledgebase"
                className="flex items-center gap-3 text-foreground/80 hover:text-foreground py-2 px-3 rounded-lg hover:bg-muted/10"
                onClick={() => setIsOpen(false)}
              >
                <Icon name="Library" size={18} />
                Knowledgebase
              </PrefetchLink>
              <PrefetchLink
                to="/summit"
                className="flex items-center gap-3 text-foreground/80 hover:text-foreground py-2 px-3 rounded-lg hover:bg-muted/10"
                onClick={() => setIsOpen(false)}
              >
                <Icon name="Layers" size={18} />
                AI Impact Summit
                <Badge className="bg-purple-500 text-white text-[10px] px-1.5 py-0">NEW</Badge>
              </PrefetchLink>
              <button
                className="flex items-center gap-3 w-full text-left text-foreground/80 hover:text-foreground py-2 px-3 rounded-lg hover:bg-muted/10"
                onClick={() => {
                  handleNavClick('events');
                  setIsOpen(false);
                }}
              >
                <Icon name="Calendar" size={18} />
                Events
              </button>
            </div>

            {/* About Section */}
            <div className="space-y-1 pt-2 border-t border-muted/20">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                About
              </p>
              <button
                className="flex items-center gap-3 w-full text-left text-foreground/80 hover:text-foreground py-2 px-3 rounded-lg hover:bg-muted/10"
                onClick={() => {
                  handleNavClick('about');
                  setIsOpen(false);
                }}
              >
                <Icon name="Building2" size={18} />
                About Us
              </button>
              <button
                className="flex items-center gap-3 w-full text-left text-foreground/80 hover:text-foreground py-2 px-3 rounded-lg hover:bg-muted/10"
                onClick={() => {
                  handleNavClick('reviews');
                  setIsOpen(false);
                }}
              >
                <Icon name="Star" size={18} />
                Reviews
              </button>
              <button
                className="flex items-center gap-3 w-full text-left text-foreground/80 hover:text-foreground py-2 px-3 rounded-lg hover:bg-muted/10"
                onClick={() => {
                  handleNavClick('contact');
                  setIsOpen(false);
                }}
              >
                <Icon name="Mail" size={18} />
                Contact
              </button>
              <button
                onClick={() => {
                  setIsFAQOpen(true);
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 w-full text-left text-foreground/80 hover:text-foreground py-2 px-3 rounded-lg hover:bg-muted/10"
              >
                <Icon name="HelpCircle" size={18} />
                FAQ
              </button>
              <button
                onClick={() => {
                  setIsTermsOpen(true);
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 w-full text-left text-foreground/80 hover:text-foreground py-2 px-3 rounded-lg hover:bg-muted/10"
              >
                <Icon name="ScrollText" size={18} />
                Terms & Privacy
              </button>
            </div>

            {/* User Section */}
            {user ? (
              <section
                className="space-y-1 pt-4 border-t border-muted/20"
                aria-label={t('aria.userAccountMenu')}
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                  Account
                </p>
                <p className="text-foreground font-medium px-3 py-1">
                  {profile?.display_name || user.email}
                </p>
                <PrefetchLink
                  to="/dashboard"
                  prefetchFn={async () => user?.id && (await prefetchDashboard(user.id))}
                  prefetchDelay={300}
                  onClick={() => setIsOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-foreground hover:bg-muted/10"
                  >
                    <Icon name="LayoutDashboard" size={16} className="mr-2" />
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
                  onClick={() => setIsOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-foreground hover:bg-muted/10"
                  >
                    <Icon name="User" size={16} className="mr-2" />
                    {t('user.profile')}
                  </Button>
                </PrefetchLink>
                {isAdmin && (
                  <>
                    <PrefetchLink to="/admin" onClick={() => setIsOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-foreground hover:bg-muted/10"
                      >
                        <Icon name="Shield" size={16} className="mr-2" />
                        {t('user.adminDashboard')}
                      </Button>
                    </PrefetchLink>
                    <PrefetchLink to="/studio" onClick={() => setIsOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-foreground hover:bg-muted/10"
                      >
                        <Icon name="Wand2" size={16} className="mr-2" />
                        Content Studio
                        <Badge className="ml-2 bg-purple-500 text-white text-[10px] px-1.5 py-0.5">
                          New
                        </Badge>
                      </Button>
                    </PrefetchLink>
                  </>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-foreground hover:bg-muted/10"
                  onClick={handleSignOut}
                >
                  <Icon name="LogOut" size={16} className="mr-2" />
                  {t('user.signOut')}
                </Button>
              </section>
            ) : (
              <section className="space-y-2 pt-4 border-t border-muted/20">
                <PrefetchLink to="/auth" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full text-foreground hover:bg-muted/10">
                    {t('user.signIn')}
                  </Button>
                </PrefetchLink>
                <PrefetchLink to="/auth" onClick={() => setIsOpen(false)}>
                  <Button className="w-full btn-hero">{t('user.getStarted')}</Button>
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
