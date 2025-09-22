import { useNavigate } from 'react-router-dom';
import { SmartForm, FormPresets } from '@/components/ui/smart-form';
import { CardSkeleton } from '@/components/ui/loading-states';
import { authSchemas } from '@/lib/validation-schemas';
import { useMutation } from '@/hooks/useApiCall';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Example of using the new developer experience utilities
 * This demonstrates:
 * 1. SmartForm with validation schema
 * 2. useMutation hook for API calls
 * 3. Standardized loading states
 * 4. Centralized error handling
 */
export function LoginFormExample() {
  const navigate = useNavigate();

  // Using the custom mutation hook with automatic error handling
  const loginMutation = useMutation({
    successMessage: 'Login successful! Redirecting...',
    errorMessage: 'Failed to login. Please check your credentials.',
    onSuccess: () => {
      navigate('/dashboard');
    },
  });

  const handleLogin = async (data: { email: string; password: string }) => {
    await loginMutation.execute(() =>
      supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
    );
  };

  // Show loading skeleton while checking auth
  if (loginMutation.loading) {
    return <CardSkeleton showHeader lines={4} />;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SmartForm
          schema={authSchemas.signIn}
          fields={FormPresets.login}
          onSubmit={handleLogin}
          submitLabel="Sign In"
          loading={loginMutation.loading}
        />

        {/* Error is automatically displayed via toast, but we can also show it inline */}
        {loginMutation.error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {loginMutation.error.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}