import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, User, ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const { user, profile, updateProfile, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    
    if (profile) {
      setDisplayName(profile.display_name || '');
    }
  }, [user, profile, loading, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await updateProfile({
      display_name: displayName
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    }
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white hover:text-secondary transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center gap-2 mb-4">
            <User className="h-8 w-8 text-secondary" />
            <span className="text-3xl font-display font-bold text-white">Profile</span>
          </div>
          <p className="text-white/80">Manage your account settings</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">Account Information</CardTitle>
            <CardDescription className="text-white/80 text-center">
              Update your profile details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="bg-white/5 border-white/20 text-white/60"
                />
                <p className="text-xs text-white/60">Email cannot be changed</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-white">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Enter your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              {profile && (
                <div className="space-y-2">
                  <Label className="text-white">Role</Label>
                  <div className="p-2 bg-white/5 border border-white/20 rounded-md">
                    <span className="text-white/80 capitalize">{profile.role}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full btn-hero"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Update Profile
              </Button>
            </form>

            {profile && (
              <div className="mt-6 p-4 bg-white/5 rounded-lg">
                <h3 className="text-white font-medium mb-2">Account Details</h3>
                <div className="space-y-1 text-sm text-white/60">
                  <p>Member since: {new Date(profile.created_at).toLocaleDateString()}</p>
                  <p>Last updated: {new Date(profile.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}