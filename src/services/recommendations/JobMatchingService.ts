/**
 * Job Matching Service
 * Matches user skills with job opportunities and identifies skill gaps
 */

import { supabase } from '@/integrations/supabase/client';
import type { JobMatch, UserProfile, JobListing, UserSkill } from './types';

export class JobMatchingService {
  /**
   * Match user skills with job opportunities
   */
  static async matchJobs(userId: string, limit: number = 20): Promise<JobMatch[]> {
    const profile = await this.getUserProfile(userId);
    const userSkills = await this.getUserSkills(userId);
    const jobListings = await this.getJobListings();

    const matches: JobMatch[] = [];

    for (const job of jobListings) {
      const matchScore = this.calculateJobMatchScore(userSkills, job.requiredSkills);
      const skillGaps = job.requiredSkills.filter((skill) => !userSkills.includes(skill));
      const estimatedTime = this.estimateTimeToAcquireSkills(skillGaps, profile);

      matches.push({
        id: job.id,
        title: job.title,
        company: job.company,
        requiredSkills: job.requiredSkills,
        matchScore,
        skillGaps,
        estimatedTimeToQualify: estimatedTime,
      });
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
  }

  private static async getUserProfile(userId: string): Promise<UserProfile> {
    const { data: user } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return {
      id: userId,
      currentSkillLevel: user?.skill_level || 50,
      learningGoals: user?.learning_goals || [],
      completedCourses: [],
      assessmentScores: {},
      learningPace: user?.learning_pace || 'moderate',
      preferredTopics: user?.preferred_topics || [],
      timeCommitment: user?.time_commitment || 5,
    };
  }

  private static async getUserSkills(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('user_skills')
      .select('skill_name')
      .eq('user_id', userId);

    return data?.map((s: UserSkill) => s.skill_name) || [];
  }

  private static async getJobListings(): Promise<JobListing[]> {
    const { data } = await supabase.from('job_listings').select('*').eq('is_active', true);
    return (data as JobListing[]) || [];
  }

  private static calculateJobMatchScore(userSkills: string[], requiredSkills: string[]): number {
    const matchedSkills = requiredSkills.filter((skill) => userSkills.includes(skill));
    return Math.round((matchedSkills.length / requiredSkills.length) * 100);
  }

  private static estimateTimeToAcquireSkills(skills: string[], profile: UserProfile): number {
    // Estimate 2-4 weeks per skill based on learning pace
    const weeksPerSkill = { slow: 4, moderate: 3, fast: 2 };
    const weeks = weeksPerSkill[profile.learningPace] || 3;
    return skills.length * weeks;
  }
}
