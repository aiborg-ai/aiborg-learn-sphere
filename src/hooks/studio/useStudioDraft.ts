/**
 * useStudioDraft Hook
 * Handles auto-saving drafts to database and localStorage
 */

import { useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { AssetType, WizardMode } from '@/types/studio.types';

interface UseStudioDraftOptions {
  userId?: string;
  assetType: AssetType;
  mode: WizardMode;
  assetId?: string;
  data: Record<string, unknown>;
  currentStep: number;
  isDirty: boolean;
  autoSaveInterval?: number; // milliseconds
  onSaved?: (draftId: string) => void;
}

export function useStudioDraft({
  userId,
  assetType,
  mode: _mode,
  assetId,
  data,
  currentStep,
  isDirty,
  autoSaveInterval = 2000, // 2 seconds
  onSaved,
}: UseStudioDraftOptions) {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const draftIdRef = useRef<string | null>(null);
  const lastSavedDataRef = useRef<string>('');

  // Save draft to database
  const saveDraft = useCallback(async (): Promise<string | null> => {
    if (!userId) {
      logger.warn('Cannot save draft: No user ID');
      return null;
    }

    try {
      const draftData = JSON.stringify(data);

      // Skip if data hasn't changed
      if (draftData === lastSavedDataRef.current) {
        return draftIdRef.current;
      }

      const draftPayload = {
        user_id: userId,
        asset_type: assetType,
        asset_id: assetId || null,
        draft_data: data,
        current_step: currentStep,
        updated_at: new Date().toISOString(),
      };

      let result;

      if (draftIdRef.current) {
        // Update existing draft
        const { data: updated, error } = await supabase
          .from('studio_drafts')
          .update(draftPayload)
          .eq('id', draftIdRef.current)
          .select()
          .single();

        if (error) throw error;
        result = updated;
      } else {
        // Create new draft
        const { data: created, error } = await supabase
          .from('studio_drafts')
          .insert(draftPayload)
          .select()
          .single();

        if (error) throw error;
        result = created;
        draftIdRef.current = created.id;
      }

      // Update last saved data
      lastSavedDataRef.current = draftData;

      // Also save to localStorage as backup
      const localKey = `studio-draft-${assetType}${assetId ? `-${assetId}` : ''}`;
      localStorage.setItem(localKey, draftData);

      // Call callback
      if (result?.id) {
        onSaved?.(result.id);
      }

      return result?.id || null;
    } catch (error) {
      logger.error('Failed to save draft:', error);
      toast({
        title: 'Auto-save failed',
        description: 'Your changes could not be saved. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  }, [userId, assetType, assetId, data, currentStep, onSaved, toast]);

  // Manual save (for Save Draft button)
  const saveDraftManually = useCallback(async () => {
    const draftId = await saveDraft();
    if (draftId) {
      toast({
        title: 'Draft saved',
        description: 'Your progress has been saved.',
      });
    }
    return draftId;
  }, [saveDraft, toast]);

  // Load draft from database
  const loadDraft = useCallback(async (): Promise<{
    data: Record<string, unknown>;
    currentStep: number;
    draftId: string;
  } | null> => {
    if (!userId) return null;

    try {
      const { data: drafts, error } = await supabase
        .from('studio_drafts')
        .select('*')
        .eq('user_id', userId)
        .eq('asset_type', assetType)
        .eq('asset_id', assetId || null)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (drafts && drafts.length > 0) {
        const draft = drafts[0];
        draftIdRef.current = draft.id;
        lastSavedDataRef.current = JSON.stringify(draft.draft_data);
        return {
          data: draft.draft_data,
          currentStep: draft.current_step,
          draftId: draft.id,
        };
      }

      // Try localStorage backup
      const localKey = `studio-draft-${assetType}${assetId ? `-${assetId}` : ''}`;
      const localData = localStorage.getItem(localKey);
      if (localData) {
        return {
          data: JSON.parse(localData),
          currentStep: 0,
          draftId: '',
        };
      }

      return null;
    } catch (error) {
      logger.error('Failed to load draft:', error);
      return null;
    }
  }, [userId, assetType, assetId]);

  // Delete draft
  const deleteDraft = useCallback(async () => {
    if (!draftIdRef.current) return;

    try {
      const { error } = await supabase.from('studio_drafts').delete().eq('id', draftIdRef.current);

      if (error) throw error;

      // Clear localStorage
      const localKey = `studio-draft-${assetType}${assetId ? `-${assetId}` : ''}`;
      localStorage.removeItem(localKey);

      draftIdRef.current = null;
      lastSavedDataRef.current = '';
    } catch (error) {
      logger.error('Failed to delete draft:', error);
    }
  }, [assetType, assetId]);

  // Auto-save effect
  useEffect(() => {
    if (!isDirty || !userId) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      saveDraft();
    }, autoSaveInterval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDirty, userId, saveDraft, autoSaveInterval]);

  return {
    saveDraft: saveDraftManually,
    loadDraft,
    deleteDraft,
    draftId: draftIdRef.current,
  };
}
