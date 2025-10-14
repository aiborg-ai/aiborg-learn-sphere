/**
 * Social Share Utilities
 * Helper functions for sharing content on social media platforms
 */

import { logger } from './logger';

export interface ShareData {
  title: string;
  text: string;
  url: string;
  hashtags?: string[];
}

/**
 * Generate Twitter/X share URL
 */
export function getTwitterShareUrl(data: ShareData): string {
  const params = new URLSearchParams({
    text: `${data.title}\n\n${data.text}`,
    url: data.url,
  });

  if (data.hashtags && data.hashtags.length > 0) {
    params.append('hashtags', data.hashtags.join(','));
  }

  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Generate LinkedIn share URL
 */
export function getLinkedInShareUrl(data: ShareData): string {
  const params = new URLSearchParams({
    url: data.url,
  });

  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

/**
 * Generate Facebook share URL
 */
export function getFacebookShareUrl(data: ShareData): string {
  const params = new URLSearchParams({
    u: data.url,
    quote: `${data.title} - ${data.text}`,
  });

  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_error) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackError) {
      logger.error('Failed to copy to clipboard', fallbackError);
      return false;
    }
  }
}

/**
 * Generate achievement share text
 */
export function generateAchievementShareText(
  achievementName: string,
  tier: string,
  points: number
): ShareData {
  const baseUrl = window.location.origin;

  return {
    title: `🏆 Achievement Unlocked!`,
    text: `I just unlocked the "${achievementName}" ${tier} achievement and earned ${points} points on AIBORG! 🎉`,
    url: `${baseUrl}/achievements`,
    hashtags: ['AIBORG', 'AILearning', 'Achievement', 'Gamification'],
  };
}

/**
 * Generate assessment completion share text
 */
export function generateAssessmentShareText(level: string, score: number): ShareData {
  const baseUrl = window.location.origin;

  return {
    title: `🎓 AI Assessment Complete!`,
    text: `I just completed my AI assessment on AIBORG and achieved ${level} level with a score of ${score.toFixed(2)}! Ready to level up your AI skills?`,
    url: `${baseUrl}/ai-assessment`,
    hashtags: ['AIBORG', 'AISkills', 'Learning', 'Technology'],
  };
}

/**
 * Generate level-up share text
 */
export function generateLevelUpShareText(level: number, totalPoints: number): ShareData {
  const baseUrl = window.location.origin;

  return {
    title: `⭐ Level Up!`,
    text: `Just reached Level ${level} on AIBORG with ${totalPoints.toLocaleString()} total points! 🚀`,
    url: `${baseUrl}/profile`,
    hashtags: ['AIBORG', 'LevelUp', 'AILearning', 'Milestone'],
  };
}

/**
 * Generate streak milestone share text
 */
export function generateStreakShareText(streakDays: number): ShareData {
  const baseUrl = window.location.origin;

  return {
    title: `🔥 ${streakDays}-Day Streak!`,
    text: `I've maintained a ${streakDays}-day learning streak on AIBORG! Consistency is key to mastering AI! 💪`,
    url: `${baseUrl}`,
    hashtags: ['AIBORG', 'LearningStreak', 'Consistency', 'AISkills'],
  };
}

/**
 * Open share dialog in new window
 */
export function openShareWindow(url: string, title: string = 'Share'): void {
  const width = 600;
  const height = 400;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  window.open(
    url,
    title,
    `width=${width},height=${height},left=${left},top=${top},toolbar=0,menubar=0,location=0,status=0`
  );
}

/**
 * Check if Web Share API is available
 */
export function canUseWebShare(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Use native Web Share API if available
 */
export async function nativeShare(data: ShareData): Promise<boolean> {
  if (!canUseWebShare()) {
    return false;
  }

  try {
    await navigator.share({
      title: data.title,
      text: data.text,
      url: data.url,
    });
    return true;
  } catch (error) {
    // User cancelled or error occurred (not necessarily an error - user may have cancelled)
    logger.debug('Native share dismissed or failed', { error });
    return false;
  }
}
