import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { User } from '@supabase/supabase-js';

interface Profile {
  user_id: string;
  display_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface ProfileTabProps {
  user: User;
  profile: Profile | null;
  onUpdate: (updates: { display_name: string }) => Promise<{ error: Error | null }>;
}

export function ProfileTab({ user, profile, onUpdate }: ProfileTabProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await onUpdate({
      display_name: displayName,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    }
    setIsLoading(false);
  };

  return (
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
            <Label htmlFor="email" className="text-white">
              Email
            </Label>
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
            <Label htmlFor="displayName" className="text-white">
              Display Name
            </Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Enter your display name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
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

          <Button type="submit" className="w-full btn-hero" disabled={isLoading}>
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
  );
}
