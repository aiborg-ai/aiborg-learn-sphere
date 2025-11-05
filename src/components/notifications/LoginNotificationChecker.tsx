/**
 * LoginNotificationChecker Component
 *
 * Checks for pending review requests when user logs in
 * and displays a toast notification with a link to view them
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { usePendingReviewRequests } from '@/hooks/useReviewRequests';
import { Button } from '@/components/ui/button';

export function LoginNotificationChecker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch pending review requests for the logged-in user
  const { data: pendingRequests, isLoading } = usePendingReviewRequests(user?.id || '');

  useEffect(() => {
    // Only check when user is logged in and data has loaded
    if (!user || isLoading || !pendingRequests) return;

    // Check if there are any pending review requests
    if (pendingRequests.length > 0) {
      const count = pendingRequests.length;
      const isPlural = count > 1;

      toast({
        title: `Review Request${isPlural ? 's' : ''}`,
        description: `You have ${count} pending review request${isPlural ? 's' : ''}. Your feedback helps us improve and helps other learners make informed decisions.`,
        action: (
          <Button onClick={() => navigate('/notifications')} variant="default" size="sm">
            View {isPlural ? 'All' : ''}
          </Button>
        ),
        duration: 10000, // Show for 10 seconds
      });
    }
  }, [user, pendingRequests, isLoading, toast, navigate]);

  // This component doesn't render anything visible
  return null;
}
