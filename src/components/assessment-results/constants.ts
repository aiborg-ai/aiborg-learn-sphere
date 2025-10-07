// Assessment constants

export const COLORS = {
  expert: '#10b981',
  advanced: '#3b82f6',
  intermediate: '#f59e0b',
  beginner: '#ef4444',
} as const;

export const LEVEL_DESCRIPTIONS = {
  expert: 'You are a power user of AI tools and highly augmented in your daily workflows.',
  advanced: 'You have strong AI adoption and regularly leverage AI for productivity.',
  intermediate: 'You are on your way to becoming AI-augmented with room for growth.',
  beginner: 'You are just starting your AI journey with lots of potential to explore.',
} as const;

export type AugmentationLevel = keyof typeof COLORS;
