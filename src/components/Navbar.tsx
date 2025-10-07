import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Menu, X, User, Shield, LogOut, LayoutDashboard, Sparkles, Keyboard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FAQModal } from '@/components/FAQModal';
import { TermsModal } from '@/components/TermsModal';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { logger } from '@/utils/logger';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      logger.error('Sign out error:', error);
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

  return (
    <nav
      className="sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" aria-label="Aiborg home">
            <img src="/logo.jpeg" alt="Aiborg logo" className="h-10 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <div
            className="hidden md:flex items-center gap-6"
            role="navigation"
            aria-label="Primary menu"
          >
            <Link to="/ai-assessment" className="relative" aria-label="AI Assessment - New feature">
              <Button
                variant="ghost"
                className="text-foreground/80 hover:text-foreground transition-colors gap-2"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                AI Assessment
                <Badge
                  className="absolute -top-2 -right-6 bg-red-500 text-white text-[10px] px-1.5 py-0.5"
                  aria-label="New feature"
                >
                  NEW
                </Badge>
              </Button>
            </Link>
            <button
              onClick={() => handleNavClick('training-programs')}
              className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
              aria-label="Navigate to training programs section"
            >
              Programs
            </button>
            <Link
              to="/blog"
              className="text-foreground/80 hover:text-foreground transition-colors"
              aria-label="Go to blog"
            >
              Blog
            </Link>
            <button
              onClick={() => handleNavClick('events')}
              className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
              aria-label="Navigate to events section"
            >
              Events
            </button>
            <button
              onClick={() => handleNavClick('reviews')}
              className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
              aria-label="Navigate to reviews section"
            >
              Reviews
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
              aria-label="Navigate to about section"
            >
              About
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
              aria-label="Navigate to contact section"
            >
              Contact
            </button>
            <button
              onClick={() => setIsFAQOpen(true)}
              className="text-foreground/80 hover:text-foreground transition-colors"
              aria-label="Open frequently asked questions"
            >
              FAQ
            </button>
            <button
              onClick={() => setIsTermsOpen(true)}
              className="text-foreground/80 hover:text-foreground transition-colors"
              aria-label="Open terms and conditions"
            >
              Terms
            </button>

            {/* Global Search */}
            {user && <GlobalSearch />}

            {/* Keyboard Shortcuts Help */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.dispatchEvent(new CustomEvent('show-shortcuts-help'))}
                  aria-label="Show keyboard shortcuts (Shift+?)"
                >
                  <Keyboard className="h-5 w-5" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Keyboard Shortcuts (Shift+?)</p>
              </TooltipContent>
            </Tooltip>

            {/* Theme Toggle */}
            <ThemeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-foreground hover:bg-muted/10"
                    aria-label="User account menu"
                  >
                    <User className="h-4 w-4 mr-2" aria-hidden="true" />
                    {profile?.display_name || user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-white/90 backdrop-blur-md border-white/20"
                  aria-label="User menu options"
                >
                  <DropdownMenuItem
                    onClick={() => navigate('/dashboard')}
                    aria-label="Go to my dashboard"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" aria-hidden="true" />
                    My Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate('/profile')}
                    aria-label="Go to my profile"
                  >
                    <User className="h-4 w-4 mr-2" aria-hidden="true" />
                    Profile
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => navigate('/admin')}
                        aria-label="Go to admin dashboard"
                      >
                        <Shield className="h-4 w-4 mr-2" aria-hidden="true" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} aria-label="Sign out of your account">
                    <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/auth">
                  <Button
                    variant="ghost"
                    className="text-foreground hover:bg-muted/10"
                    aria-label="Sign in to your account"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="btn-hero" aria-label="Get started with Aiborg">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div
            id="mobile-menu"
            className="md:hidden py-4 space-y-4 border-t border-white/20"
            role="navigation"
            aria-label="Mobile navigation menu"
          >
            <button
              className="block w-full text-left text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => {
                handleNavClick('training-programs');
                setIsOpen(false);
              }}
            >
              Programs
            </button>
            <Link
              to="/blog"
              className="block text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Blog
            </Link>
            <button
              className="block w-full text-left text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => {
                handleNavClick('events');
                setIsOpen(false);
              }}
            >
              Events
            </button>
            <button
              className="block w-full text-left text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => {
                handleNavClick('reviews');
                setIsOpen(false);
              }}
            >
              Reviews
            </button>
            <button
              className="block w-full text-left text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => {
                handleNavClick('about');
                setIsOpen(false);
              }}
            >
              About
            </button>
            <button
              className="block w-full text-left text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => {
                handleNavClick('contact');
                setIsOpen(false);
              }}
            >
              Contact
            </button>
            <button
              onClick={() => {
                setIsFAQOpen(true);
                setIsOpen(false);
              }}
              className="block text-foreground/80 hover:text-foreground transition-colors text-left"
            >
              FAQ
            </button>
            <button
              onClick={() => {
                setIsTermsOpen(true);
                setIsOpen(false);
              }}
              className="block text-foreground/80 hover:text-foreground transition-colors text-left"
            >
              Terms
            </button>

            {user ? (
              <div className="space-y-2 pt-4 border-t border-muted/20">
                <p className="text-foreground font-medium">{profile?.display_name || user.email}</p>
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-foreground hover:bg-muted/10"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    My Dashboard
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-foreground hover:bg-muted/10"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-foreground hover:bg-muted/10"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-foreground hover:bg-muted/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-2 pt-4 border-t border-muted/20">
                <Link to="/auth">
                  <Button variant="ghost" className="w-full text-foreground hover:bg-muted/10">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="w-full btn-hero">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAQ and Terms Modals */}
      <FAQModal isOpen={isFAQOpen} onClose={() => setIsFAQOpen(false)} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </nav>
  );
}
