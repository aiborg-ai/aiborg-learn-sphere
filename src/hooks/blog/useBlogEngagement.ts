import { useState, useCallback } from 'react';
import { BlogService } from '@/services/blog/BlogService';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

import { logger } from '@/utils/logger';
export const useBlogLike = (postId: string, initialLiked = false, initialCount = 0) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleLike = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to like posts',
      });
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }

    try {
      setLoading(true);
      if (isLiked) {
        await BlogService.unlikePost(postId);
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await BlogService.likePost(postId);
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (err) {
      logger.error('Error toggling like:', err);
      toast({
        title: 'Error',
        description: isLiked ? 'Failed to unlike post' : 'Failed to like post',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [postId, isLiked, toast, user, navigate, location]);

  return { isLiked, likeCount, toggleLike, loading };
};

export const useBlogBookmark = (postId: string, initialBookmarked = false) => {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleBookmark = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to bookmark posts',
      });
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }

    try {
      setLoading(true);
      if (isBookmarked) {
        await BlogService.unbookmarkPost(postId);
        setIsBookmarked(false);
        toast({
          title: 'Removed',
          description: 'Post removed from bookmarks',
        });
      } else {
        await BlogService.bookmarkPost(postId);
        setIsBookmarked(true);
        toast({
          title: 'Saved',
          description: 'Post added to bookmarks',
        });
      }
    } catch (err) {
      logger.error('Error toggling bookmark:', err);
      toast({
        title: 'Error',
        description: 'Failed to update bookmark',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [postId, isBookmarked, toast, user, navigate, location]);

  return { isBookmarked, toggleBookmark, loading };
};

export const useBlogShare = (postId: string, postTitle: string, postUrl: string) => {
  const { toast } = useToast();

  const share = useCallback(
    async (platform: string) => {
      try {
        // Track the share
        await BlogService.sharePost(postId, platform);

        // Perform the actual share
        const shareText = `Check out this article: ${postTitle}`;

        switch (platform) {
          case 'twitter':
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`,
              '_blank'
            );
            break;
          case 'facebook':
            window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
              '_blank'
            );
            break;
          case 'linkedin':
            window.open(
              `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
              '_blank'
            );
            break;
          case 'whatsapp':
            window.open(
              `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + postUrl)}`,
              '_blank'
            );
            break;
          case 'email':
            window.location.href = `mailto:?subject=${encodeURIComponent(postTitle)}&body=${encodeURIComponent(shareText + '\n\n' + postUrl)}`;
            break;
          case 'copy_link':
            await navigator.clipboard.writeText(postUrl);
            toast({
              title: 'Link copied!',
              description: 'The link has been copied to your clipboard',
            });
            break;
        }
      } catch (err) {
        logger.error('Error sharing:', err);
        toast({
          title: 'Error',
          description: 'Failed to share post',
          variant: 'destructive',
        });
      }
    },
    [postId, postTitle, postUrl, toast]
  );

  return { share };
};
