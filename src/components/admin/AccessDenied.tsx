import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Home } from '@/components/ui/icons';
import { useAuth } from '@/hooks/useAuth';
import type { DenialReason } from '@/hooks/useAdminAccess';

interface AccessDeniedProps {
  reason: DenialReason | '';
}

interface AccessMessage {
  title: string;
  description: string;
  action: string;
  actionLink: string;
}

export function AccessDenied({ reason }: AccessDeniedProps) {
  const { user, profile, profileError } = useAuth();

  const getMessage = (): AccessMessage => {
    switch (reason) {
      case 'not_authenticated':
        return {
          title: 'Authentication Required',
          description: 'You must be signed in to access the admin dashboard.',
          action: 'Sign In',
          actionLink: '/auth',
        };
      case 'no_profile':
        return {
          title: 'Profile Not Found',
          description:
            'Your user profile could not be loaded. Please try signing out and signing in again.',
          action: 'Go to Home',
          actionLink: '/',
        };
      case 'not_admin':
        return {
          title: 'Admin Access Required',
          description: `Your account (${user?.email}) does not have administrator privileges. Current role: ${
            profile?.role || 'none'
          }. Please contact the system administrator if you believe this is an error.`,
          action: 'Go to Home',
          actionLink: '/',
        };
      default:
        return {
          title: 'Access Denied',
          description: 'You do not have permission to access this page.',
          action: 'Go to Home',
          actionLink: '/',
        };
    }
  };

  const message = getMessage();

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Alert className="bg-white/95 backdrop-blur border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-lg font-semibold text-gray-900">{message.title}</AlertTitle>
          <AlertDescription className="mt-2 text-gray-700">{message.description}</AlertDescription>
          <div className="mt-4 flex gap-2">
            <Link to={message.actionLink} className="flex-1">
              <Button className="w-full" variant="default">
                <Home className="h-4 w-4 mr-2" />
                {message.action}
              </Button>
            </Link>
            {reason === 'no_profile' && (
              <Button variant="outline" onClick={() => window.location.reload()} className="flex-1">
                Retry
              </Button>
            )}
          </div>
        </Alert>

        {/* Debug info in development */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-4 bg-black/80 rounded-lg text-white text-xs font-mono">
            <p className="font-bold mb-2">Debug Info:</p>
            <p>User ID: {user?.id || 'none'}</p>
            <p>Email: {user?.email || 'none'}</p>
            <p>Profile ID: {profile?.id || 'none'}</p>
            <p>Role: {profile?.role || 'none'}</p>
            <p>Denial Reason: {reason}</p>
            {profileError && <p className="text-red-400">Profile Error: {profileError}</p>}
            <p className="mt-2 text-yellow-400">Check browser console for detailed logs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
