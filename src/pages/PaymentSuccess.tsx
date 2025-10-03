import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    // Auto-redirect to dashboard after 8 seconds
    const timer = setTimeout(() => {
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    }, 8000);

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [navigate, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-400">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-lg font-medium">Thank you for your enrollment!</p>
            <p className="text-muted-foreground">
              Your payment has been processed successfully. Your course is now available!
            </p>
            {sessionId && (
              <p className="text-sm text-muted-foreground">
                Transaction ID: {sessionId}
              </p>
            )}
          </div>

          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">🎉 Course Access Granted!</h4>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 text-left">
              <li>• Your course is now available in your dashboard</li>
              <li>• Access all course materials immediately</li>
              <li>• Confirmation email sent with details</li>
              <li>• WhatsApp notification with schedule</li>
            </ul>
          </div>

          <div className="space-y-3">
            {user ? (
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full"
                size="lg"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Go to My Dashboard
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                className="w-full"
                size="lg"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Login to Access Course
              </Button>
            )}
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
            <p className="text-sm text-muted-foreground">
              {user ? `Redirecting to dashboard in ${countdown} seconds...` : 'Redirecting to home in ' + countdown + ' seconds...'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;