/**
 * White-Label Settings Page (Tenant Admin Only)
 * Customize branding for tenant organizations
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Palette,
  Image,
  Type,
  Code,
  Eye,
  Save,
  AlertCircle,
  Sparkles,
} from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { logger } from '@/utils/logger';

const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Raleway',
  'Ubuntu',
  'Nunito',
  'Playfair Display',
];

export default function WhiteLabelSettings() {
  const { tenantId, branding, refreshBranding, isTenant } = useTenant();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    logo_url: '',
    favicon_url: '',
    primary_color: '#D4AF37',
    secondary_color: '#000000',
    accent_color: '#FFD700',
    background_color: '',
    text_color: '',
    font_family: 'Inter',
    theme_mode: 'system' as 'light' | 'dark' | 'system' | 'custom',
    custom_css: '',
    show_powered_by: true,
    custom_footer_text: '',
    custom_welcome_message: '',
  });

  useEffect(() => {
    if (branding) {
      setFormData({
        logo_url: branding.logo_url || '',
        favicon_url: branding.favicon_url || '',
        primary_color: branding.primary_color || '#D4AF37',
        secondary_color: branding.secondary_color || '#000000',
        accent_color: branding.accent_color || '#FFD700',
        background_color: branding.background_color || '',
        text_color: branding.text_color || '',
        font_family: branding.font_family || 'Inter',
        theme_mode: branding.theme_mode || 'system',
        custom_css: branding.custom_css || '',
        show_powered_by: branding.show_powered_by ?? true,
        custom_footer_text: branding.custom_footer_text || '',
        custom_welcome_message: branding.custom_welcome_message || '',
      });
    }
  }, [branding]);

  const handleSave = async () => {
    if (!tenantId) {
      toast({
        title: 'Error',
        description: 'No tenant context found',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          logo_url: formData.logo_url || null,
          favicon_url: formData.favicon_url || null,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          accent_color: formData.accent_color,
          background_color: formData.background_color || null,
          text_color: formData.text_color || null,
          font_family: formData.font_family,
          theme_mode: formData.theme_mode,
          custom_css: formData.custom_css || null,
          show_powered_by: formData.show_powered_by,
          custom_footer_text: formData.custom_footer_text || null,
          custom_welcome_message: formData.custom_welcome_message || null,
        })
        .eq('id', tenantId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Branding settings saved successfully',
      });

      // Refresh branding to apply changes
      await refreshBranding();
    } catch {
      logger.error('Failed to save branding', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save branding settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Only allow tenant admins to access this page
  if (!isTenant) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            This page is only accessible to tenant administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Palette className="h-8 w-8 text-primary" />
            White-Label Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Customize your organization's branding and appearance
          </p>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Preview Alert */}
      <Alert>
        <Eye className="h-4 w-4" />
        <AlertTitle>Live Preview</AlertTitle>
        <AlertDescription>
          Changes will be applied immediately after saving. Refresh the page to see the updated
          branding.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Scheme
              </CardTitle>
              <CardDescription>
                Define your brand colors that will be applied throughout the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData.primary_color}
                      onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.primary_color}
                      onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={e => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.secondary_color}
                      onChange={e => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent_color">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent_color"
                      type="color"
                      value={formData.accent_color}
                      onChange={e => setFormData({ ...formData, accent_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.accent_color}
                      onChange={e => setFormData({ ...formData, accent_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme_mode">Theme Mode</Label>
                  <Select
                    value={formData.theme_mode}
                    onValueChange={(value: 'light' | 'dark' | 'system' | 'custom') =>
                      setFormData({ ...formData, theme_mode: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.theme_mode === 'custom' && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="background_color">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="background_color"
                        type="color"
                        value={formData.background_color || '#ffffff'}
                        onChange={e =>
                          setFormData({ ...formData, background_color: e.target.value })
                        }
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.background_color}
                        onChange={e =>
                          setFormData({ ...formData, background_color: e.target.value })
                        }
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text_color">Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="text_color"
                        type="color"
                        value={formData.text_color || '#000000'}
                        onChange={e => setFormData({ ...formData, text_color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.text_color}
                        onChange={e => setFormData({ ...formData, text_color: e.target.value })}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Typography
              </CardTitle>
              <CardDescription>Select a font family for your platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="font_family">Font Family</Label>
                <Select
                  value={formData.font_family}
                  onValueChange={value => setFormData({ ...formData, font_family: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOOGLE_FONTS.map(font => (
                      <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Brand Assets
              </CardTitle>
              <CardDescription>Upload your logo and favicon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo_url}
                  onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                />
                {formData.logo_url && (
                  <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                    <img
                      src={formData.logo_url}
                      alt="Logo preview"
                      className="h-16 object-contain"
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="favicon_url">Favicon URL</Label>
                <Input
                  id="favicon_url"
                  type="url"
                  placeholder="https://example.com/favicon.ico"
                  value={formData.favicon_url}
                  onChange={e => setFormData({ ...formData, favicon_url: e.target.value })}
                />
                {formData.favicon_url && (
                  <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                    <img
                      src={formData.favicon_url}
                      alt="Favicon preview"
                      className="h-8 w-8 object-contain"
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Custom CSS
              </CardTitle>
              <CardDescription>
                Add custom CSS to further customize your platform's appearance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="custom_css">Custom CSS Code</Label>
                <Textarea
                  id="custom_css"
                  placeholder=".custom-class { color: red; }"
                  value={formData.custom_css}
                  onChange={e => setFormData({ ...formData, custom_css: e.target.value })}
                  className="font-mono text-sm"
                  rows={10}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Custom Content
              </CardTitle>
              <CardDescription>Customize text and messaging</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom_welcome_message">Welcome Message</Label>
                <Textarea
                  id="custom_welcome_message"
                  placeholder="Welcome to our learning platform!"
                  value={formData.custom_welcome_message}
                  onChange={e =>
                    setFormData({ ...formData, custom_welcome_message: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom_footer_text">Footer Text</Label>
                <Input
                  id="custom_footer_text"
                  placeholder="© 2024 Your Company. All rights reserved."
                  value={formData.custom_footer_text}
                  onChange={e => setFormData({ ...formData, custom_footer_text: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show_powered_by">Show "Powered by AiBorg"</Label>
                  <p className="text-sm text-muted-foreground">Display attribution in the footer</p>
                </div>
                <Switch
                  id="show_powered_by"
                  checked={formData.show_powered_by}
                  onCheckedChange={checked =>
                    setFormData({ ...formData, show_powered_by: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  );
}
