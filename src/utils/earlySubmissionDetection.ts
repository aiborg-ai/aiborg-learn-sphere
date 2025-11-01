/**
 * Early Submission Detection Utility
 *
 * Detects and rewards early submissions for assignments and assessments.
 * Provides incentives for students to submit work ahead of deadlines.
 */

export interface EarlySubmissionConfig {
  /** Due date of the assignment/assessment */
  dueDate: Date;
  /** Date when the assignment/assessment was posted */
  postedDate?: Date;
  /** Custom thresholds for early submission detection (in days before due date) */
  customThresholds?: {
    veryEarly?: number; // Default: 7 days
    early?: number; // Default: 3 days
    onTime?: number; // Default: 1 day
  };
  /** Bonus points configuration */
  bonusPoints?: {
    enabled: boolean;
    veryEarly?: number; // Default: 5% bonus
    early?: number; // Default: 3% bonus
    onTime?: number; // Default: 1% bonus
  };
}

export interface EarlySubmissionResult {
  /** Whether the submission is early */
  isEarly: boolean;
  /** Category of early submission */
  category: 'very-early' | 'early' | 'on-time' | 'late' | 'overdue';
  /** Days before/after due date (negative = late) */
  daysBeforeDue: number;
  /** Hours before/after due date (negative = late) */
  hoursBeforeDue: number;
  /** Percentage of time period used (0-100%) */
  timePercentageUsed: number;
  /** Bonus percentage earned (0-100) */
  bonusPercentage: number;
  /** Human-readable message */
  message: string;
  /** Badge/icon recommendation */
  badge: 'trophy' | 'star' | 'checkmark' | 'clock' | 'warning';
  /** Color scheme for UI */
  colorScheme: 'green' | 'blue' | 'yellow' | 'orange' | 'red';
}

const DEFAULT_THRESHOLDS = {
  veryEarly: 7, // 7 days before due date
  early: 3, // 3 days before due date
  onTime: 1, // 1 day before due date
};

const DEFAULT_BONUS = {
  veryEarly: 5, // 5% bonus
  early: 3, // 3% bonus
  onTime: 1, // 1% bonus
};

/**
 * Calculate days between two dates
 */
function calculateDaysDifference(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = date1.getTime() - date2.getTime();
  return Math.floor(diffMs / msPerDay);
}

/**
 * Calculate hours between two dates
 */
function calculateHoursDifference(date1: Date, date2: Date): number {
  const msPerHour = 1000 * 60 * 60;
  const diffMs = date1.getTime() - date2.getTime();
  return Math.floor(diffMs / msPerHour);
}

/**
 * Detect if a submission is early and provide detailed analysis
 */
export function detectEarlySubmission(
  submissionDate: Date,
  config: EarlySubmissionConfig
): EarlySubmissionResult {
  const { dueDate, postedDate, customThresholds, bonusPoints } = config;

  // Use custom thresholds or defaults
  const thresholds = {
    veryEarly: customThresholds?.veryEarly ?? DEFAULT_THRESHOLDS.veryEarly,
    early: customThresholds?.early ?? DEFAULT_THRESHOLDS.early,
    onTime: customThresholds?.onTime ?? DEFAULT_THRESHOLDS.onTime,
  };

  // Calculate time differences
  const daysBeforeDue = calculateDaysDifference(dueDate, submissionDate);
  const hoursBeforeDue = calculateHoursDifference(dueDate, submissionDate);

  // Calculate percentage of time period used
  let timePercentageUsed = 0;
  if (postedDate) {
    const totalTime = dueDate.getTime() - postedDate.getTime();
    const timeUsed = submissionDate.getTime() - postedDate.getTime();
    timePercentageUsed = Math.min(100, Math.max(0, (timeUsed / totalTime) * 100));
  }

  // Determine category and bonus
  let category: EarlySubmissionResult['category'];
  let bonusPercentage = 0;
  let message: string;
  let badge: EarlySubmissionResult['badge'];
  let colorScheme: EarlySubmissionResult['colorScheme'];

  if (daysBeforeDue >= thresholds.veryEarly) {
    category = 'very-early';
    bonusPercentage = bonusPoints?.enabled ? (bonusPoints.veryEarly ?? DEFAULT_BONUS.veryEarly) : 0;
    message = `Excellent! Submitted ${daysBeforeDue} days early`;
    badge = 'trophy';
    colorScheme = 'green';
  } else if (daysBeforeDue >= thresholds.early) {
    category = 'early';
    bonusPercentage = bonusPoints?.enabled ? (bonusPoints.early ?? DEFAULT_BONUS.early) : 0;
    message = `Great! Submitted ${daysBeforeDue} days early`;
    badge = 'star';
    colorScheme = 'blue';
  } else if (daysBeforeDue >= thresholds.onTime) {
    category = 'on-time';
    bonusPercentage = bonusPoints?.enabled ? (bonusPoints.onTime ?? DEFAULT_BONUS.onTime) : 0;
    message = `Good! Submitted ${daysBeforeDue} day${daysBeforeDue === 1 ? '' : 's'} early`;
    badge = 'checkmark';
    colorScheme = 'blue';
  } else if (daysBeforeDue >= 0) {
    category = 'on-time';
    bonusPercentage = 0;
    if (hoursBeforeDue > 0) {
      message = `Submitted ${hoursBeforeDue} hour${hoursBeforeDue === 1 ? '' : 's'} before deadline`;
    } else {
      message = 'Submitted on time';
    }
    badge = 'checkmark';
    colorScheme = 'yellow';
  } else if (daysBeforeDue >= -1) {
    category = 'late';
    bonusPercentage = 0;
    message = `Submitted ${Math.abs(hoursBeforeDue)} hour${Math.abs(hoursBeforeDue) === 1 ? '' : 's'} late`;
    badge = 'clock';
    colorScheme = 'orange';
  } else {
    category = 'overdue';
    bonusPercentage = 0;
    message = `Submitted ${Math.abs(daysBeforeDue)} day${Math.abs(daysBeforeDue) === 1 ? '' : 's'} late`;
    badge = 'warning';
    colorScheme = 'red';
  }

  return {
    isEarly: daysBeforeDue >= thresholds.onTime,
    category,
    daysBeforeDue,
    hoursBeforeDue,
    timePercentageUsed,
    bonusPercentage,
    message,
    badge,
    colorScheme,
  };
}

/**
 * Calculate bonus points based on early submission
 */
export function calculateBonusPoints(
  baseScore: number,
  submissionResult: EarlySubmissionResult
): number {
  if (submissionResult.bonusPercentage === 0) {
    return 0;
  }
  return Math.round((baseScore * submissionResult.bonusPercentage) / 100);
}

/**
 * Get days until due date
 */
export function getDaysUntilDue(dueDate: Date): number {
  return calculateDaysDifference(dueDate, new Date());
}

/**
 * Get hours until due date
 */
export function getHoursUntilDue(dueDate: Date): number {
  return calculateHoursDifference(dueDate, new Date());
}

/**
 * Check if submission window is still open
 */
export function isSubmissionWindowOpen(
  dueDate: Date,
  allowLateSubmission: boolean,
  lateSubmissionDeadline?: Date
): boolean {
  const now = new Date();

  if (now <= dueDate) {
    return true;
  }

  if (allowLateSubmission) {
    if (lateSubmissionDeadline) {
      return now <= lateSubmissionDeadline;
    }
    return true; // No late deadline specified
  }

  return false;
}

/**
 * Get urgency level based on time remaining
 */
export function getSubmissionUrgency(dueDate: Date): {
  level: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  colorScheme: 'red' | 'orange' | 'yellow' | 'green';
} {
  const hoursUntilDue = getHoursUntilDue(dueDate);
  const daysUntilDue = getDaysUntilDue(dueDate);

  if (hoursUntilDue < 0) {
    return {
      level: 'critical',
      message: 'Past due!',
      colorScheme: 'red',
    };
  }

  if (hoursUntilDue <= 24) {
    return {
      level: 'critical',
      message: `Due in ${hoursUntilDue} hour${hoursUntilDue === 1 ? '' : 's'}!`,
      colorScheme: 'red',
    };
  }

  if (daysUntilDue <= 3) {
    return {
      level: 'high',
      message: `Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`,
      colorScheme: 'orange',
    };
  }

  if (daysUntilDue <= 7) {
    return {
      level: 'medium',
      message: `${daysUntilDue} days remaining`,
      colorScheme: 'yellow',
    };
  }

  return {
    level: 'low',
    message: `${daysUntilDue} days remaining`,
    colorScheme: 'green',
  };
}

/**
 * Format time remaining in human-readable format
 */
export function formatTimeRemaining(dueDate: Date): string {
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();

  if (diffMs < 0) {
    const pastDiffMs = Math.abs(diffMs);
    const days = Math.floor(pastDiffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((pastDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} day${days === 1 ? '' : 's'} overdue`;
    }
    return `${hours} hour${hours === 1 ? '' : 's'} overdue`;
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}
