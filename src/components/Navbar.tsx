import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-secondary" />
            <span className="text-2xl font-display font-bold text-white">aiborg</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/#training-programs" className="text-white/80 hover:text-white transition-colors">
              Programs
            </Link>
            <button 
              onClick={() => setIsFAQOpen(true)}
              className="text-white/80 hover:text-white transition-colors"
            >
              FAQ
            </button>
            <button 
              onClick={() => setIsTermsOpen(true)}
              className="text-white/80 hover:text-white transition-colors"
            >
              Terms
            </button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/10">
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
                  <Button variant="ghost" className="text-white hover:bg-white/10">
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
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-white/20">
            <Link 
              to="/#training-programs" 
              className="block text-white/80 hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Programs
            </Link>
            <button 
              onClick={() => {
                setIsFAQOpen(true);
                setIsOpen(false);
              }}
              className="block text-white/80 hover:text-white transition-colors text-left"
            >
              FAQ
            </button>
            <button 
              onClick={() => {
                setIsTermsOpen(true);
                setIsOpen(false);
              }}
              className="block text-white/80 hover:text-white transition-colors text-left"
            >
              Terms
            </button>
            
            {user ? (
              <div className="space-y-2 pt-4 border-t border-white/20">
                <p className="text-white font-medium">{profile?.display_name || user.email}</p>
                <Link to="/profile">
                  <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-white hover:bg-white/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-2 pt-4 border-t border-white/20">
                <Link to="/auth">
                  <Button variant="ghost" className="w-full text-white hover:bg-white/10">
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