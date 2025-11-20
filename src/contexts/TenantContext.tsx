/**
 * TenantContext
 *
 * Provides tenant information and branding throughout the application.
 * Handles multi-tenancy with white-label support.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { TenantResolver } from '@/lib/tenant/TenantResolver';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface TenantBranding {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color?: string;
  text_color?: string;
  font_family: string;
  theme_mode: 'light' | 'dark' | 'system' | 'custom';
  custom_css?: string;
  show_powered_by: boolean;
  custom_footer_text?: string;
  custom_welcome_message?: string;
}

export interface TenantInfo {
  id: string;
  slug: string;
  display_name: string;
  tier: string;
  status: string;
  subdomain: string;
  custom_domain?: string;
}

interface TenantContextType {
  // Tenant Information
  tenantId: string | null;
  tenantSlug: string | null;
  tenantInfo: TenantInfo | null;
  branding: TenantBranding | null;

  // Loading State
  isLoading: boolean;
  error: Error | null;

  // Tenant Status
  isTenant: boolean; // false for platform, true for actual tenant
  isPlatform: boolean; // Convenience: !isTenant

  // Actions
  refreshBranding: () => Promise<void>;
  clearCache: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load tenant information based on current domain/subdomain
   */
  const loadTenant = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const resolver = TenantResolver.getInstance();
      const identifier = resolver.resolveTenant();

      logger.info('Tenant resolver', identifier);

      // If platform (no tenant), set defaults and exit
      if (identifier.type === 'platform') {
        setTenantId(null);
        setTenantSlug(null);
        setTenantInfo(null);
        setBranding(null);
        setIsLoading(false);
        return;
      }

      // Fetch tenant by domain or subdomain
      const { data, error: fetchError } = await supabase
        .rpc('get_tenant_by_domain', {
          p_domain: identifier.identifier,
        })
        .single();

      if (fetchError) {
        logger.error('Failed to fetch tenant:', fetchError);
        throw new Error(`Tenant not found: ${identifier.identifier}`);
      }

      if (!data) {
        throw new Error(`Tenant not found: ${identifier.identifier}`);
      }

      // Set tenant information
      setTenantId(data.id);
      setTenantSlug(data.slug);
      setTenantInfo({
        id: data.id,
        slug: data.slug,
        display_name: data.display_name,
        tier: data.tier,
        status: data.status,
        subdomain: data.slug, // Assuming slug is used as subdomain
        custom_domain: identifier.type === 'custom_domain' ? identifier.identifier : undefined,
      });

      // Parse and set branding
      const brandingData = data.branding as any;
      const tenantBranding: TenantBranding = {
        id: data.id,
        name: data.display_name,
        slug: data.slug,
        logo_url: brandingData.logo_url,
        favicon_url: brandingData.favicon_url,
        primary_color: brandingData.primary_color || '#D4AF37',
        secondary_color: brandingData.secondary_color || '#000000',
        accent_color: brandingData.accent_color || '#FFD700',
        background_color: brandingData.background_color,
        text_color: brandingData.text_color,
        font_family: brandingData.font_family || 'Inter',
        theme_mode: brandingData.theme_mode || 'system',
        custom_css: brandingData.custom_css,
        show_powered_by: brandingData.show_powered_by ?? true,
        custom_footer_text: brandingData.custom_footer_text,
        custom_welcome_message: brandingData.custom_welcome_message,
      };

      setBranding(tenantBranding);

      // Apply branding to DOM
      applyBranding(tenantBranding);
    } catch (err) {
      const error = err as Error;
      logger.error('Error loading tenant:', error);
      setError(error);

      // Set to platform mode on error (graceful degradation)
      setTenantId(null);
      setTenantSlug(null);
      setTenantInfo(null);
      setBranding(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Apply tenant branding to the DOM
   */
  const applyBranding = useCallback((branding: TenantBranding) => {
    const root = document.documentElement;

    // Apply CSS custom properties
    root.style.setProperty('--primary', branding.primary_color);
    root.style.setProperty('--secondary', branding.secondary_color);
    root.style.setProperty('--accent', branding.accent_color);

    if (branding.background_color) {
      root.style.setProperty('--background', branding.background_color);
    }

    if (branding.text_color) {
      root.style.setProperty('--foreground', branding.text_color);
    }

    // Apply font family
    if (branding.font_family && branding.font_family !== 'Inter') {
      loadCustomFont(branding.font_family);
    }

    // Update favicon
    if (branding.favicon_url) {
      updateFavicon(branding.favicon_url);
    }

    // Update page title
    updatePageTitle(branding.name);

    // Inject custom CSS
    if (branding.custom_css) {
      injectCustomCSS(branding.custom_css);
    }
  }, []);

  /**
   * Load custom Google Font
   */
  const loadCustomFont = (fontFamily: string) => {
    const fontName = fontFamily.replace(/\s+/g, '+');
    const existingLink = document.getElementById('custom-font');

    if (existingLink) {
      existingLink.remove();
    }

    const link = document.createElement('link');
    link.id = 'custom-font';
    link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    document.documentElement.style.setProperty('--font-sans', fontFamily);
  };

  /**
   * Update favicon
   */
  const updateFavicon = (faviconUrl: string) => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;

    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.href = faviconUrl;
  };

  /**
   * Update page title
   */
  const updatePageTitle = (tenantName: string) => {
    const baseTitle = 'Learn';
    document.title = `${tenantName} - ${baseTitle}`;
  };

  /**
   * Inject custom CSS
   */
  const injectCustomCSS = (css: string) => {
    const existingStyle = document.getElementById('tenant-custom-css');

    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'tenant-custom-css';
    style.textContent = css;
    document.head.appendChild(style);
  };

  /**
   * Refresh branding from server
   */
  const refreshBranding = useCallback(async () => {
    await loadTenant();
  }, [loadTenant]);

  /**
   * Clear cached tenant information
   */
  const clearCache = useCallback(() => {
    TenantResolver.getInstance().clearCache();
    setTenantId(null);
    setTenantSlug(null);
    setTenantInfo(null);
    setBranding(null);
  }, []);

  // Load tenant on mount
  useEffect(() => {
    loadTenant();
  }, [loadTenant]);

  // Context value
  const value: TenantContextType = {
    tenantId,
    tenantSlug,
    tenantInfo,
    branding,
    isLoading,
    error,
    isTenant: tenantId !== null,
    isPlatform: tenantId === null,
    refreshBranding,
    clearCache,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access tenant context
 */
export const useTenant = () => {
  const context = useContext(TenantContext);

  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }

  return context;
};

/**
 * Hook to access tenant branding (convenience)
 */
export const useTenantBranding = () => {
  const { branding, isLoading } = useTenant();
  return { branding, isLoading };
};

/**
 * Hook to check if current context is a tenant
 */
export const useIsTenant = () => {
  const { isTenant, isLoading } = useTenant();
  return { isTenant, isLoading };
};
