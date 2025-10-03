/**
 * Shared Types for Recommendation Services
 */

export interface UserProfile {
  id: string;
  currentSkillLevel: number; // 1-100
  learningGoals: string[];
  completedCourses: string[];
  assessmentScores: Record<string, number>;
  learningPace: 'slow' | 'moderate' | 'fast';
  preferredTopics: string[];
  timeCommitment: number; // hours per week
}

export interface Course {
  id: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  topics: string[];
  estimatedHours: number;
  prerequisites: string[];
  skills: string[];
  completionRate: number;
  averageRating: number;
}

export interface Recommendation {
  courseId: string;
  score: number; // 0-100
  reasons: string[];
  estimatedCompletionTime: number; // days
  skillGapFilled: string[];
  confidence: number; // 0-1
}

export interface LearningPath {
  id: string;
  name: string;
  courses: string[];
  estimatedDuration: number; // weeks
  targetSkillLevel: number;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  name: string;
  courseId: string;
  targetDate: Date;
  skillsAcquired: string[];
}

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  requiredSkills: string[];
  matchScore: number; // 0-100
  skillGaps: string[];
  estimatedTimeToQualify: number; // weeks
}

export interface ProgressForecast {
  currentLevel: number;
  targetLevel: number;
  estimatedWeeks: number;
  milestones: {
    week: number;
    level: number;
    achievement: string;
  }[];
  confidenceInterval: { min: number; max: number };
}

export interface HistoricalProgress {
  created_at: string;
  skill_level: number;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  requiredSkills: string[];
  is_active: boolean;
}

export interface DatabaseUserProfile {
  skill_level?: number;
  learning_goals?: string[];
  learning_pace?: 'slow' | 'moderate' | 'fast';
  preferred_topics?: string[];
  time_commitment?: number;
}

export interface DatabaseCourse {
  id: string;
  title: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  topics?: string[];
  estimated_hours?: number;
  prerequisites?: string[];
  skills?: string[];
  completion_rate?: number;
  average_rating?: number;
}

export interface CourseEnrollment {
  course_id: string;
  progress: number;
  rating?: number;
}

export interface Assessment {
  category: string;
  score: number;
}

export interface UserSkill {
  skill_name: string;
}

export interface SimilarUser {
  id: string;
}
