/**
 * useAssessmentRecommendations Hook
 * Provides personalized recommendations based on assessment results
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Course } from '@/hooks/useCourses';
import type { BlogPost } from '@/types/blog';
import type { AssessmentResults } from '@/types/assessmentTools';

interface AssessmentRecommendations {
  courses: Course[];
  blogPosts: BlogPost[];
  quizzes: unknown[]; // Add proper type when quiz feature is implemented
  learningPath: LearningPathStep[];
}

interface LearningPathStep {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'blog' | 'quiz' | 'practice';
  priority: number;
  estimatedTime: string;
  resourceId?: number;
  resourceSlug?: string;
}

/**
 * Generate personalized recommendations based on assessment results
 */
async function fetchRecommendations(
  results: AssessmentResults,
  _toolSlug: string
): Promise<AssessmentRecommendations> {
  try {
    // Identify weak areas (categories with < 70% score)
    const weakCategories = results.performance_by_category
      .filter(cat => cat.score_percentage < 70)
      .map(cat => cat.category_name.toLowerCase());

    // Identify strong areas (categories with >= 80% score)
    const strongCategories = results.performance_by_category
      .filter(cat => cat.score_percentage >= 80)
      .map(cat => cat.category_name.toLowerCase());

    // Fetch recommended courses based on weak areas
    const coursesPromise = fetchRecommendedCourses(weakCategories, results.score_percentage);

    // Fetch recommended blog posts
    const blogPostsPromise = fetchRecommendedBlogPosts(weakCategories);

    // Fetch recommended quizzes/practice (placeholder for now)
    const quizzesPromise = fetchRecommendedQuizzes(weakCategories);

    const [courses, blogPosts, quizzes] = await Promise.all([
      coursesPromise,
      blogPostsPromise,
      quizzesPromise,
    ]);

    // Generate learning path
    const learningPath = generateLearningPath(
      results,
      courses,
      blogPosts,
      weakCategories,
      strongCategories
    );

    return {
      courses,
      blogPosts,
      quizzes,
      learningPath,
    };
  } catch (_error) {
    logger._error('Error fetching recommendations:', _error);
    throw error;
  }
}

/**
 * Fetch courses matching weak areas
 */
async function fetchRecommendedCourses(
  weakCategories: string[],
  scorePercentage: number
): Promise<Course[]> {
  try {
    // Determine skill level based on score
    let targetLevel: string;
    if (scorePercentage < 40) {
      targetLevel = 'Beginner';
    } else if (scorePercentage < 70) {
      targetLevel = 'Intermediate';
    } else {
      targetLevel = 'Advanced';
    }

    // Fetch courses
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .eq('display', true)
      .eq('level', targetLevel)
      .order('sort_order', { ascending: true })
      .limit(6);

    if (error) throw error;

    // Process courses to match the expected type
    const courses = (data || []).map((course: Record<string, unknown>) => ({
      ...course,
      audiences: course.audiences || (course.audience ? [course.audience] : []),
    }));

    // If we have weak categories, try to match by keywords
    if (weakCategories.length > 0 && courses.length > 0) {
      const scoredCourses = courses.map(course => {
        const keywordMatch = course.keywords.some((keyword: string) =>
          weakCategories.some(cat => keyword.toLowerCase().includes(cat))
        );
        const categoryMatch = weakCategories.some(cat =>
          course.category.toLowerCase().includes(cat)
        );
        const titleMatch = weakCategories.some(cat => course.title.toLowerCase().includes(cat));

        const relevanceScore =
          (keywordMatch ? 3 : 0) + (categoryMatch ? 2 : 0) + (titleMatch ? 1 : 0);

        return { course, relevanceScore };
      });

      // Sort by relevance and return top courses
      return scoredCourses
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 4)
        .map(item => item.course);
    }

    return courses.slice(0, 4);
  } catch (_error) {
    logger._error('Error fetching recommended courses:', _error);
    return [];
  }
}

/**
 * Fetch blog posts related to weak areas
 */
async function fetchRecommendedBlogPosts(weakCategories: string[]): Promise<BlogPost[]> {
  try {
    // Build search query from weak categories
    const _searchTerms = weakCategories.join(' OR ');

    // Fetch blog posts matching categories or tags
    const { data, error } = await supabase
      .from('blog_posts')
      .select(
        `
        *,
        blog_categories(name, slug)
      `
      )
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(15);

    if (error) throw error;

    if (!data || data.length === 0) return [];

    // Score posts based on relevance to weak categories
    const scoredPosts = data.map((post: Record<string, unknown>) => {
      const titleMatch = weakCategories.some(cat => post.title.toLowerCase().includes(cat));
      const excerptMatch = weakCategories.some(cat => post.excerpt?.toLowerCase().includes(cat));
      const categoryMatch = weakCategories.some(
        cat =>
          post.blog_categories &&
          post.blog_categories.name &&
          post.blog_categories.name.toLowerCase().includes(cat)
      );
      const tagMatch =
        post.tags &&
        post.tags.some((tag: string) =>
          weakCategories.some(cat => tag.toLowerCase().includes(cat))
        );

      const relevanceScore =
        (titleMatch ? 4 : 0) +
        (categoryMatch ? 3 : 0) +
        (excerptMatch ? 2 : 0) +
        (tagMatch ? 1 : 0);

      return { post, relevanceScore };
    });

    // Sort by relevance and return top posts
    return scoredPosts
      .filter(item => item.relevanceScore > 0) // Only return relevant posts
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 6)
      .map(item => item.post);
  } catch (_error) {
    logger._error('Error fetching recommended blog posts:', _error);
    return [];
  }
}

/**
 * Fetch recommended quizzes (placeholder for future implementation)
 */
async function fetchRecommendedQuizzes(_weakCategories: string[]): Promise<unknown[]> {
  // Placeholder: Will be implemented when quiz feature is added
  return [];
}

/**
 * Generate a personalized learning path
 */
function generateLearningPath(
  results: AssessmentResults,
  courses: Course[],
  blogPosts: BlogPost[],
  weakCategories: string[],
  _strongCategories: string[]
): LearningPathStep[] {
  const path: LearningPathStep[] = [];
  let stepId = 1;

  // Step 1: Quick wins - Read blog posts on weak areas
  if (blogPosts.length > 0 && weakCategories.length > 0) {
    path.push({
      id: `step-${stepId++}`,
      title: `Read: ${blogPosts[0].title}`,
      description: `Start by understanding ${weakCategories[0]} fundamentals`,
      type: 'blog',
      priority: 1,
      estimatedTime: '10-15 min',
      resourceSlug: blogPosts[0].slug,
    });
  }

  // Step 2: Deep dive - Enroll in recommended course
  if (courses.length > 0 && weakCategories.length > 0) {
    path.push({
      id: `step-${stepId++}`,
      title: `Enroll: ${courses[0].title}`,
      description: `Strengthen your ${weakCategories[0]} skills with structured learning`,
      type: 'course',
      priority: 2,
      estimatedTime: courses[0].duration || '4-6 weeks',
      resourceId: courses[0].id,
    });
  }

  // Step 3: More reading
  if (blogPosts.length > 1) {
    path.push({
      id: `step-${stepId++}`,
      title: `Explore: ${blogPosts[1].title}`,
      description: 'Expand your knowledge with additional resources',
      type: 'blog',
      priority: 3,
      estimatedTime: '10-15 min',
      resourceSlug: blogPosts[1].slug,
    });
  }

  // Step 4: Practice with quizzes (when available)
  if (weakCategories.length > 0) {
    path.push({
      id: `step-${stepId++}`,
      title: `Practice: ${weakCategories[0].charAt(0).toUpperCase() + weakCategories[0].slice(1)} Exercises`,
      description: 'Apply what you learned with hands-on practice',
      type: 'practice',
      priority: 4,
      estimatedTime: '30-45 min',
    });
  }

  // Step 5: Advanced course (if they scored well overall)
  if (courses.length > 1 && results.score_percentage >= 60) {
    path.push({
      id: `step-${stepId++}`,
      title: `Advance: ${courses[1].title}`,
      description: 'Build on your foundation with advanced topics',
      type: 'course',
      priority: 5,
      estimatedTime: courses[1].duration || '4-6 weeks',
      resourceId: courses[1].id,
    });
  }

  // Step 6: Retake assessment
  path.push({
    id: `step-${stepId++}`,
    title: 'Retake Assessment',
    description: "Measure your progress and see how much you've improved",
    type: 'quiz',
    priority: 6,
    estimatedTime: '30-40 min',
  });

  return path;
}

/**
 * Hook to get recommendations for assessment results
 */
export function useAssessmentRecommendations(results: AssessmentResults | null, toolSlug: string) {
  return useQuery({
    queryKey: ['assessment-recommendations', toolSlug, results?.score_percentage],
    queryFn: () => {
      if (!results) throw new Error('No results available');
      return fetchRecommendations(results, toolSlug);
    },
    enabled: !!results,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
