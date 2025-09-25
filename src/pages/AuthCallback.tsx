import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Shield, CheckCircle2, Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(20);
  const [statusMessage, setStatusMessage] = useState('Verifying your credentials...');

  useEffect(() => {
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    // Update status messages
    const messageTimeout1 = setTimeout(() => {
      setStatusMessage('Securing your session...');
    }, 800);

    const messageTimeout2 = setTimeout(() => {
      setStatusMessage('Preparing your learning dashboard...');
    }, 1600);

    // Handle the authentication callback
    const handleCallback = async () => {
      // Get the hash from the URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');

      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (accessToken) {
        setProgress(100);
        setStatusMessage('Success! Redirecting to your dashboard...');
        // Check if we have a stored redirect path
        const redirectPath = sessionStorage.getItem('authRedirect');
        sessionStorage.removeItem('authRedirect');

        // Small delay before redirect to show success state
        setTimeout(() => {
          navigate(redirectPath || '/', { replace: true });
        }, 500);
      } else {
        // No token, redirect to auth page
        setStatusMessage('Authentication failed. Redirecting...');
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 1000);
      }
    };

    handleCallback();

    return () => {
      clearInterval(progressInterval);
      clearTimeout(messageTimeout1);
      clearTimeout(messageTimeout2);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img
              src="/logo.jpeg"
              alt="AIBORG"
              className="h-16 w-auto object-contain animate-pulse"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to AIBORG™</h1>
          <p className="text-white/80">Your AI Learning Platform</p>
        </div>

        {/* Main Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8">
            {/* Status Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-secondary to-yellow-500 rounded-full p-4">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3 mb-6">
              <Progress value={progress} className="h-2 bg-white/20" />
              <p className="text-center text-white font-medium">{statusMessage}</p>
            </div>

            {/* Security Features */}
            <div className="space-y-3 border-t border-white/10 pt-6">
              <div className="flex items-center gap-3 text-white/60">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-sm">Secure authentication with OAuth 2.0</span>
              </div>
              <div className="flex items-center gap-3 text-white/60">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-sm">Your data is encrypted and protected</span>
              </div>
              <div className="flex items-center gap-3 text-white/60">
                <Brain className="h-4 w-4 text-green-400" />
                <span className="text-sm">Powered by advanced AI technology</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Text */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">© 2025 AIBORG™. All rights reserved.</p>
          <p className="text-white/40 text-xs mt-2">Trusted by thousands of learners worldwide</p>
        </div>
      </div>
    </div>
  );
}
