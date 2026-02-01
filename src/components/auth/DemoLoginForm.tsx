/**
 * Demo Login Form
 * Provides password-free demo access within the auth page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Loader2, CheckCircle, GraduationCap, Shield, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface DemoCredential {
  email: string;
  password: string;
  type: string;
  role: 'learner' | 'admin';
  description: string;
  landingPage: string;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    email: 'demo-learner@aiborg.ai',
    password: 'DemoPass123',
    type: 'Demo Learner',
    role: 'learner',
    description: 'Experience the platform as a student exploring AI courses and resources',
    landingPage: '/dashboard',
    features: [
      'Browse courses & workshops',
      'Take AI assessments',
      'Access knowledgebase & summit',
      'View personalized content',
    ],
    icon: GraduationCap,
    gradient:
      'from-blue-500/20 to-cyan-500/20 border-blue-400/50 hover:border-blue-400 hover:from-blue-500/30 hover:to-cyan-500/30',
  },
  {
    email: 'demo-admin@aiborg.ai',
    password: 'DemoPass123',
    type: 'Demo Admin',
    role: 'admin',
    description: 'Explore full admin capabilities, CMS, and management features',
    landingPage: '/admin',
    features: [
      'Full admin dashboard',
      'Content management (CMS)',
      'User & enrollment management',
      'Analytics & reporting',
    ],
    icon: Shield,
    gradient:
      'from-purple-500/20 to-pink-500/20 border-purple-400/50 hover:border-purple-400 hover:from-purple-500/30 hover:to-pink-500/30',
  },
];

export function DemoLoginForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async (credential: DemoCredential) => {
    setIsLoading(true);
    setLoadingType(credential.type);
    setError(null);

    try {
      // Sign out any existing session first
      await supabase.auth.signOut();

      // Sign in with demo credentials
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: credential.email,
        password: credential.password,
      });

      if (authError) {
        logger.error('[DemoLogin] Auth error:', authError);
        setError('Demo login failed. Please try again or contact support.');
        setIsLoading(false);
        setLoadingType(null);
        return;
      }

      if (!data.user) {
        setError('Login failed. Please try again.');
        setIsLoading(false);
        setLoadingType(null);
        return;
      }

      // Set demo mode in localStorage
      localStorage.setItem('aiborg_demo_mode', 'true');
      localStorage.setItem(
        'aiborg_demo_user',
        JSON.stringify({
          id: data.user.id,
          email: credential.email,
          role: credential.role,
          displayName: credential.type,
        })
      );

      logger.info('[DemoLogin] Demo login successful:', credential.type);

      // Navigate to landing page
      navigate(credential.landingPage);
    } catch (err) {
      logger.error('[DemoLogin] Error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <Alert className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-400/50">
        <Sparkles className="h-4 w-4 text-purple-300" />
        <AlertDescription className="text-white/90">
          <strong>Try instantly!</strong> No signup required. Click below to explore the platform
          with full access.
        </AlertDescription>
      </Alert>

      {/* Error Display */}
      {error && (
        <Alert className="bg-red-500/20 border-red-500/50">
          <AlertDescription className="text-white">{error}</AlertDescription>
        </Alert>
      )}

      {/* Demo User Cards */}
      <div className="space-y-3">
        {DEMO_CREDENTIALS.map((credential, index) => {
          const IconComponent = credential.icon;
          const isCurrentLoading = isLoading && loadingType === credential.type;

          return (
            <button
              key={index}
              onClick={() => handleDemoLogin(credential)}
              disabled={isLoading}
              className={`w-full p-4 border rounded-xl bg-gradient-to-r ${credential.gradient} transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group`}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                  {isCurrentLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  ) : (
                    <IconComponent className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{credential.type}</h3>
                    <Badge
                      variant="outline"
                      className="text-xs border-white/30 text-white/80 bg-white/10"
                    >
                      {credential.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-white/70 mb-3">{credential.description}</p>
                  <ul className="grid grid-cols-2 gap-1">
                    {credential.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-xs text-white/60">
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                        <span className="truncate">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-white/40 group-hover:text-white/70 transition-colors">
                  <Play className="w-5 h-5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="text-center space-y-2">
        <p className="text-xs text-white/50">
          Demo accounts have full platform access with sample data.
        </p>
        <Button
          variant="link"
          className="text-xs text-white/60 hover:text-white p-0 h-auto"
          onClick={() => navigate('/demo')}
        >
          View detailed demo page →
        </Button>
      </div>
    </div>
  );
}
