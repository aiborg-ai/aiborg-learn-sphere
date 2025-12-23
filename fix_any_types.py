#!/usr/bin/env python3
"""Fix @typescript-eslint/no-explicit-any warnings in TypeScript files."""

import re

def fix_embedding_service():
    """Fix EmbeddingService.ts"""
    file_path = 'src/services/ai/EmbeddingService.ts'

    with open(file_path, 'r') as f:
        content = f.read()

    # Line 220: Fix item: any
    content = content.replace(
        'data.data.forEach((item: any, i: number)',
        'data.data.forEach((item: { embedding: number[] }, i: number)'
    )

    # Line 354: Fix course: any in updateCourseEmbeddings
    content = content.replace(
        'courses.map((course: any) =>',
        'courses.map((course: { title: string; description?: string | null; keywords?: string[] | null; category?: string | null }) =>'
    )

    # Lines 381-382: Fix (courses[i] as any)
    # First, find and replace the section with proper type assertion
    old_pattern = r'''        try \{
          await this\.saveContentEmbedding\(\{
            content_id: courses\[i\]\.id,
            content_type: 'course',
            embedding: embeddingResult\.embedding,
            title: courses\[i\]\.title,
            description: courses\[i\]\.description,
            tags: \(courses\[i\] as any\)\.keywords \|\| \[\],
            difficulty_level: \(courses\[i\] as any\)\.level,'''

    new_pattern = '''        try {
          const course = courses[i] as { id: string; title: string; description: string | null; keywords?: string[] | null; level?: string | null };
          await this.saveContentEmbedding({
            content_id: course.id,
            content_type: 'course',
            embedding: embeddingResult.embedding,
            title: course.title,
            description: course.description,
            tags: course.keywords || [],
            difficulty_level: course.level || undefined,'''

    content = re.sub(old_pattern, new_pattern, content)

    # Line 491: Fix post: any
    content = content.replace(
        'posts.map((post: any) =>',
        'posts.map((post: { title: string; excerpt?: string | null; content?: string | null; tags?: string[] | null; category?: string | null }) =>'
    )

    # Line 553: Fix error: any
    content = content.replace(
        '} catch (error: any) {\n      logger.info(\'Skipping learning paths:\', error.message);',
        '} catch (error) {\n      logger.info(\'Skipping learning paths:\', error instanceof Error ? error.message : \'Unknown error\');'
    )

    # Line 583: Fix return type any[]
    content = content.replace(
        '): Promise<any[]> {',
        '): Promise<Array<{ content_id: string; similarity: number; content_type: string }>> {'
    )

    with open(file_path, 'w') as f:
        f.write(content)

    print(f'Fixed {file_path}')


def fix_recommendation_engine_service():
    """Fix RecommendationEngineService.ts"""
    file_path = 'src/services/ai/RecommendationEngineService.ts'

    with open(file_path, 'r') as f:
        content = f.read()

    # Line 27: Fix metadata?: Record<string, any>
    content = content.replace(
        'metadata?: Record<string, any>;',
        'metadata?: Record<string, unknown>;'
    )

    # Line 362: Fix two instances of (h: any)
    content = content.replace(
        'history?.filter((h: any) => h.completion_percentage === 100).map((h: any) => h.course_id)',
        'history?.filter((h: { completion_percentage: number; course_id: string }) => h.completion_percentage === 100).map((h) => h.course_id)'
    )

    # Line 368: Fix reduce with (h: any)
    content = content.replace(
        'history?.reduce((sum: number, h: any) => sum + (h.avg_assessment_score || 0), 0)',
        'history?.reduce((sum: number, h: { avg_assessment_score?: number }) => sum + (h.avg_assessment_score || 0), 0)'
    )

    # Line 431: Fix (attempt.assessment_tools as any)
    content = content.replace(
        '(attempt.assessment_tools as any)?.category',
        '(attempt.assessment_tools as { category?: string } | null)?.category'
    )

    # Line 463: Fix preferences: any
    content = content.replace(
        'private static buildUserQueryText(profile: UserLearningProfile, preferences: any): string {',
        'private static buildUserQueryText(profile: UserLearningProfile, preferences: { interested_topics?: string[]; learning_goals?: string[]; target_skills?: string[] } | null): string {'
    )

    # Line 489: Fix course: any
    content = content.replace(
        'private static calculateSkillMatch(course: any, profile: UserLearningProfile): number {',
        'private static calculateSkillMatch(course: { tags?: string[] | null; keywords?: string[] | null; category?: string | null; level?: string | null; difficulty_level?: string | null; prerequisites?: string[] }, profile: UserLearningProfile): number {'
    )

    # Line 559: Fix path: any, preferences: any
    content = content.replace(
        'private static calculateSkillMatchForPath(path: any, preferences: any): number {',
        'private static calculateSkillMatchForPath(path: { tags?: string[] | null }, preferences: { target_skills?: string[] } | null): number {'
    )

    # Line 578: Fix content: any
    content = content.replace(
        'private static calculateDifficultyMatch(content: any, profile: UserLearningProfile): number {',
        'private static calculateDifficultyMatch(content: { difficulty_level?: string | null }, profile: UserLearningProfile): number {'
    )

    # Line 642: Fix course: any in buildRecommendationReason
    content = re.sub(
        r'course: any,\n    profile: UserLearningProfile',
        'course: { difficulty_level?: string | null; category?: string | null; tags?: string[] | null },\n    profile: UserLearningProfile',
        content
    )

    with open(file_path, 'w') as f:
        f.write(content)

    print(f'Fixed {file_path}')


def fix_ability_trajectory_service():
    """Fix AbilityTrajectoryService.ts"""
    file_path = 'src/services/analytics/AbilityTrajectoryService.ts'

    with open(file_path, 'r') as f:
        content = f.read()

    # Line 262: Fix snapshots: any[]
    content = content.replace(
        'snapshots: any[]',
        'snapshots: Array<{ id: string; user_id: string; category_id: string | null; ability_estimate: number; standard_error: number; confidence_lower: number; confidence_upper: number; source_assessment_id?: string; recorded_at: string }>'
    )

    with open(file_path, 'w') as f:
        f.write(content)

    print(f'Fixed {file_path}')


if __name__ == '__main__':
    fix_embedding_service()
    fix_recommendation_engine_service()
    fix_ability_trajectory_service()
    print('\nAll @typescript-eslint/no-explicit-any warnings fixed!')
