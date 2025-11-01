/**
 * useStudioPublish Hook
 * Handles publishing/updating assets to database
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getWizardConfig } from '@/lib/studio/wizard-configs';
import { logger } from '@/utils/logger';
import type { AssetType, WizardMode } from '@/types/studio.types';

interface UseStudioPublishOptions {
  assetType: AssetType;
  mode: WizardMode;
  assetId?: string;
  onSuccess?: (assetId: string) => void;
  onError?: (error: Error) => void;
}

export function useStudioPublish({
  assetType,
  mode,
  assetId,
  onSuccess,
  onError,
}: UseStudioPublishOptions) {
  const { toast } = useToast();

  // Publish course
  const publishCourse = useCallback(
    async (data: Record<string, unknown>) => {
      const config = getWizardConfig('course');
      const finalData = config.finalizeData ? config.finalizeData(data) : data;

      if (mode === 'create') {
        // Create new course
        const { data: course, error } = await supabase
          .from('courses')
          .insert(finalData)
          .select()
          .single();

        if (error) throw error;

        // Insert course_audiences junction records
        if (data.audiences && data.audiences.length > 0 && course?.id) {
          const audienceRecords = data.audiences.map((audience: string) => ({
            course_id: course.id,
            audience,
          }));

          const { error: audienceError } = await supabase
            .from('course_audiences')
            .insert(audienceRecords);

          if (audienceError) {
            logger.error('Failed to insert course audiences:', audienceError);
          }
        }

        return course;
      } else {
        // Update existing course
        if (!assetId) throw new Error('Asset ID required for update');

        const { data: course, error } = await supabase
          .from('courses')
          .update(finalData)
          .eq('id', assetId)
          .select()
          .single();

        if (error) throw error;

        // Update course_audiences
        if (data.audiences && course?.id) {
          // Delete existing
          await supabase.from('course_audiences').delete().eq('course_id', course.id);

          // Insert new
          const audienceRecords = data.audiences.map((audience: string) => ({
            course_id: course.id,
            audience,
          }));

          await supabase.from('course_audiences').insert(audienceRecords);
        }

        return course;
      }
    },
    [mode, assetId]
  );

  // Publish event
  const publishEvent = useCallback(
    async (data: Record<string, unknown>) => {
      const config = getWizardConfig('event');
      const finalData = config.finalizeData ? config.finalizeData(data) : data;

      if (mode === 'create') {
        const { data: event, error } = await supabase
          .from('events')
          .insert(finalData)
          .select()
          .single();

        if (error) throw error;
        return event;
      } else {
        if (!assetId) throw new Error('Asset ID required for update');

        const { data: event, error } = await supabase
          .from('events')
          .update(finalData)
          .eq('id', assetId)
          .select()
          .single();

        if (error) throw error;
        return event;
      }
    },
    [mode, assetId]
  );

  // Publish blog post
  const publishBlog = useCallback(
    async (data: Record<string, unknown>) => {
      const config = getWizardConfig('blog');
      const finalData = config.finalizeData ? config.finalizeData(data) : data;

      if (mode === 'create') {
        const { data: post, error } = await supabase
          .from('blog_posts')
          .insert(finalData)
          .select()
          .single();

        if (error) throw error;
        return post;
      } else {
        if (!assetId) throw new Error('Asset ID required for update');

        const { data: post, error } = await supabase
          .from('blog_posts')
          .update(finalData)
          .eq('id', assetId)
          .select()
          .single();

        if (error) throw error;
        return post;
      }
    },
    [mode, assetId]
  );

  // Publish announcement
  const publishAnnouncement = useCallback(
    async (data: Record<string, unknown>) => {
      const config = getWizardConfig('announcement');
      const finalData = config.finalizeData ? config.finalizeData(data) : data;

      if (mode === 'create') {
        const { data: announcement, error } = await supabase
          .from('announcements')
          .insert(finalData)
          .select()
          .single();

        if (error) throw error;
        return announcement;
      } else {
        if (!assetId) throw new Error('Asset ID required for update');

        const { data: announcement, error } = await supabase
          .from('announcements')
          .update(finalData)
          .eq('id', assetId)
          .select()
          .single();

        if (error) throw error;
        return announcement;
      }
    },
    [mode, assetId]
  );

  // Main publish function
  const publish = useCallback(
    async (data: Record<string, unknown>): Promise<string> => {
      try {
        let result;

        switch (assetType) {
          case 'course':
            result = await publishCourse(data);
            break;
          case 'event':
            result = await publishEvent(data);
            break;
          case 'blog':
            result = await publishBlog(data);
            break;
          case 'announcement':
            result = await publishAnnouncement(data);
            break;
          default:
            throw new Error(`Unsupported asset type: ${assetType}`);
        }

        const resultId = result?.id?.toString() || '';

        toast({
          title: mode === 'create' ? 'Published!' : 'Updated!',
          description: `Your ${assetType} has been ${mode === 'create' ? 'published' : 'updated'} successfully.`,
        });

        onSuccess?.(resultId);
        return resultId;
      } catch (error) {
        logger.error('Publish failed:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        toast({
          title: 'Publish failed',
          description: `Failed to ${mode === 'create' ? 'publish' : 'update'} ${assetType}: ${errorMessage}`,
          variant: 'destructive',
        });

        onError?.(error instanceof Error ? error : new Error(errorMessage));
        throw error;
      }
    },
    [
      assetType,
      mode,
      publishCourse,
      publishEvent,
      publishBlog,
      publishAnnouncement,
      toast,
      onSuccess,
      onError,
    ]
  );

  return { publish };
}
