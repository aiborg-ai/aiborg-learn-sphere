import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn } from 'lucide-react';

interface RequireAuthProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

export function RequireAuth({ children, fallbackMessage = "Sign in to continue" }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignIn = () => {
    // Store current location to redirect back after login
    navigate('/auth', { state: { from: location.pathname } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-secondary/10 rounded-lg p-8 text-center">
        <LogIn className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg mb-4">{fallbackMessage}</p>
        <Button onClick={handleSignIn}>
          Sign In to Comment
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}