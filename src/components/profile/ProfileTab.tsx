import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, Globe } from '@/components/ui/icons';
import { useToast } from '@/components/ui/use-toast';
import type { User } from '@supabase/supabase-js';

interface Profile {
  user_id: string;
  display_name: string | null;
  role: string;
  preferred_language?: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileTabProps {
  user: User;
  profile: Profile | null;
  onUpdate: (updates: {
    display_name: string;
    preferred_language?: string;
  }) => Promise<{ error: Error | null }>;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
];

export function ProfileTab({ user, profile, onUpdate }: ProfileTabProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferred_language || 'en');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { i18n } = useTranslation();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await onUpdate({
      display_name: displayName,
      preferred_language: preferredLanguage,
    });

    // If language was changed and update succeeded, also update i18n
    if (!error && preferredLanguage !== i18n.language) {
      i18n.changeLanguage(preferredLanguage);
    }

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

          <div className="space-y-2">
            <Label htmlFor="preferredLanguage" className="text-white flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Preferred Language
            </Label>
            <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
              <SelectTrigger
                id="preferredLanguage"
                className="bg-white/10 border-white/20 text-white"
              >
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-white/60">
              Choose your preferred language for the user interface
            </p>
          </div>

          {profile && (
            <div className="space-y-2">
              <div className="text-white text-sm font-medium">Role</div>
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
