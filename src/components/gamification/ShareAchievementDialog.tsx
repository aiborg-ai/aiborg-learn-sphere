/**
 * Share Achievement Dialog
 * Modal for sharing achievements on social media
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AchievementShareCard } from './AchievementShareCard';
import { Share2, Twitter, Linkedin, Facebook, Link2, Check, Download } from '@/components/ui/icons';
import type { Achievement, UserAchievement } from '@/services/gamification';
import {
  generateAchievementShareText,
  getTwitterShareUrl,
  getLinkedInShareUrl,
  getFacebookShareUrl,
  copyToClipboard,
  openShareWindow,
  canUseWebShare,
  nativeShare,
} from '@/utils/socialShare';

interface ShareAchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  achievement: Achievement;
  userAchievement?: UserAchievement;
  userName?: string;
}

export function ShareAchievementDialog({
  open,
  onOpenChange,
  achievement,
  userAchievement,
  userName,
}: ShareAchievementDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareData = generateAchievementShareText(
    achievement.name,
    achievement.tier,
    achievement.points_value
  );

  const handleTwitterShare = () => {
    const url = getTwitterShareUrl(shareData);
    openShareWindow(url, 'Share on Twitter');
  };

  const handleLinkedInShare = () => {
    const url = getLinkedInShareUrl(shareData);
    openShareWindow(url, 'Share on LinkedIn');
  };

  const handleFacebookShare = () => {
    const url = getFacebookShareUrl(shareData);
    openShareWindow(url, 'Share on Facebook');
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareData.url);

    if (success) {
      setCopied(true);
      toast({
        title: 'Link Copied!',
        description: 'Achievement link copied to clipboard',
      });

      setTimeout(() => setCopied(false), 2000);
    } else {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleNativeShare = async () => {
    const success = await nativeShare(shareData);

    if (!success) {
      // Fallback to Twitter if native share fails
      handleTwitterShare();
    }
  };

  const handleDownloadImage = () => {
    // TODO: Implement download as image functionality
    toast({
      title: 'Coming Soon!',
      description: 'Download as image feature will be available soon',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Achievement
          </DialogTitle>
          <DialogDescription>Show off your accomplishment to your network!</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Card */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <AchievementShareCard
              achievement={achievement}
              userAchievement={userAchievement}
              userName={userName}
            />
          </div>

          {/* Share Buttons */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Share to:</p>

            <div className="grid grid-cols-2 gap-3">
              {/* Twitter */}
              <Button
                variant="outline"
                className="justify-start gap-2 hover:bg-blue-50 hover:border-blue-400"
                onClick={handleTwitterShare}
              >
                <Twitter className="h-4 w-4 text-blue-400" />
                <span>Twitter / X</span>
              </Button>

              {/* LinkedIn */}
              <Button
                variant="outline"
                className="justify-start gap-2 hover:bg-blue-50 hover:border-blue-600"
                onClick={handleLinkedInShare}
              >
                <Linkedin className="h-4 w-4 text-blue-600" />
                <span>LinkedIn</span>
              </Button>

              {/* Facebook */}
              <Button
                variant="outline"
                className="justify-start gap-2 hover:bg-blue-50 hover:border-blue-500"
                onClick={handleFacebookShare}
              >
                <Facebook className="h-4 w-4 text-blue-500" />
                <span>Facebook</span>
              </Button>

              {/* Copy Link */}
              <Button
                variant="outline"
                className="justify-start gap-2 hover:bg-green-50 hover:border-green-500"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 text-gray-600" />
                    <span>Copy Link</span>
                  </>
                )}
              </Button>
            </div>

            {/* Native Share (Mobile) */}
            {canUseWebShare() && (
              <Button variant="default" className="w-full gap-2" onClick={handleNativeShare}>
                <Share2 className="h-4 w-4" />
                Share...
              </Button>
            )}

            {/* Download Image */}
            <Button
              variant="outline"
              className="w-full gap-2 hover:bg-purple-50 hover:border-purple-400"
              onClick={handleDownloadImage}
            >
              <Download className="h-4 w-4 text-purple-600" />
              Download as Image
            </Button>
          </div>

          {/* Share Text Preview */}
          <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Share message:</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {shareData.title}
              <br />
              <br />
              {shareData.text}
            </p>
            {shareData.hashtags && (
              <p className="text-sm text-blue-600 mt-2">#{shareData.hashtags.join(' #')}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
