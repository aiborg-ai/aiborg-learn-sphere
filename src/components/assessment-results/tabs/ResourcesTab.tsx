/**
 * Resources Tab Component
 * Learning path roadmap and recommended resources
 */

import React from 'react';
import { LearningPathRoadmap } from '@/components/assessment/LearningPathRoadmap';
import { RecommendedResources } from '@/components/assessment/RecommendedResources';
import { EmptyStateCard } from '../common/EmptyStateCard';
import { Lightbulb } from '@/components/ui/icons';
import type { CategoryPerformance } from '@/types/assessmentTools';

interface RecommendationsData {
  learningPath?: Array<{
    step: number;
    title: string;
    description: string;
    estimatedTime?: string;
    resources?: string[];
  }>;
  courses?: Array<{
    title: string;
    provider: string;
    url: string;
    level: string;
  }>;
  blogPosts?: Array<{
    title: string;
    url: string;
    author: string;
  }>;
}

interface ResourcesTabProps {
  recommendations?: RecommendationsData;
  performanceByCategory: CategoryPerformance[];
  recommendationsLoading?: boolean;
}

export function ResourcesTab({
  recommendations,
  performanceByCategory,
  recommendationsLoading = false,
}: ResourcesTabProps) {
  // Identify weak categories (< 70%)
  const weakCategories = performanceByCategory
    .filter(cat => cat.score_percentage < 70)
    .map(cat => cat.category_name.toLowerCase());

  // Show loading state
  if (recommendationsLoading) {
    return (
      <div className="space-y-8">
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">Loading resources...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no recommendations
  if (
    !recommendations ||
    (!recommendations.learningPath && !recommendations.courses && !recommendations.blogPosts)
  ) {
    return (
      <EmptyStateCard
        config={{
          icon: Lightbulb,
          title: 'No Resources Available',
          description: 'Personalized learning resources are being generated. Check back soon!',
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Learning Path Roadmap */}
      {recommendations.learningPath && recommendations.learningPath.length > 0 && (
        <LearningPathRoadmap steps={recommendations.learningPath} />
      )}

      {/* Recommended Resources */}
      <RecommendedResources
        courses={recommendations.courses || []}
        blogPosts={recommendations.blogPosts || []}
        weakCategories={weakCategories}
      />
    </div>
  );
}
