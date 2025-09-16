import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Brain, Menu, X, User, Shield, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FAQModal } from '@/components/FAQModal';
import { TermsModal } from '@/components/TermsModal';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
    <nav className="sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/aiborg-logo.svg" alt="Aiborg" className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => handleNavClick('training-programs')}
              className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
            >
              Programs
            </button>
            <Link to="/blog" className="text-foreground/80 hover:text-foreground transition-colors">
              Blog
            </Link>
            <button
              onClick={() => handleNavClick('events')}
              className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
            >
              Events
            </button>
            <button
              onClick={() => handleNavClick('reviews')}
              className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
            >
              Reviews
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
            >
              Contact
            </button>
            <button 
              onClick={() => setIsFAQOpen(true)}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              FAQ
            </button>
            <button 
              onClick={() => setIsTermsOpen(true)}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Terms
            </button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-foreground hover:bg-muted/10">
                    <User className="h-4 w-4 mr-2" />
                    {profile?.display_name || user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white/90 backdrop-blur-md border-white/20">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/auth">
                  <Button variant="ghost" className="text-foreground hover:bg-muted/10">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="btn-hero">
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
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-white/20">
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
                <Link to="/profile">
                  <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted/10">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted/10">
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
                  <Button className="w-full btn-hero">
                    Get Started
                  </Button>
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