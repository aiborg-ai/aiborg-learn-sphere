import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Auto-redirect to home after 10 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

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
              Your payment has been processed successfully and you will receive a confirmation email shortly.
            </p>
            {sessionId && (
              <p className="text-sm text-muted-foreground">
                Transaction ID: {sessionId}
              </p>
            )}
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What's Next?</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 text-left">
              <li>• Check your email for course details and access instructions</li>
              <li>• You'll receive a WhatsApp message with your course schedule</li>
              <li>• Course materials will be available 24 hours before start date</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
            <p className="text-sm text-muted-foreground">
              Redirecting automatically in 10 seconds...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;