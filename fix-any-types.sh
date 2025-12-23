#!/bin/bash

# Fix @typescript-eslint/no-explicit-any warnings

# File 1: EmbeddingService.ts

# Line 220: Fix item: any
sed -i 's/data\.data\.forEach((item: any, i: number)/data.data.forEach((item: { embedding: number[] }, i: number)/' src/services/ai/EmbeddingService.ts

# Line 354: Fix course: any
sed -i 's/courses\.map((course: any) =>/courses.map((course: { title: string; description?: string | null; keywords?: string[] | null; category?: string | null }) =>/' src/services/ai/EmbeddingService.ts

# Lines 381-382: Fix (courses[i] as any)
sed -i 's/tags: (courses\[i\] as any)\.keywords/const course = courses[i] as { id: string; title: string; description: string | null; keywords?: string[] | null; level?: string | null };\n          await this.saveContentEmbedding({\n            content_id: course.id,\n            content_type: '\''course'\'',\n            embedding: embeddingResult.embedding,\n            title: course.title,\n            description: course.description,\n            tags: course.keywords/' src/services/ai/EmbeddingService.ts

sed -i 's/difficulty_level: (courses\[i\] as any)\.level,/difficulty_level: course.level || undefined,/' src/services/ai/EmbeddingService.ts

# Line 491: Fix post: any
sed -i 's/posts\.map((post: any) =>/posts.map((post: { title: string; excerpt?: string | null; content?: string | null; tags?: string[] | null; category?: string | null }) =>/' src/services/ai/EmbeddingService.ts

# Line 553: Fix error: any
sed -i 's/} catch (error: any) {/} catch (error) {/' src/services/ai/EmbeddingService.ts
sed -i 's/logger\.info('\''Skipping learning paths:'\'', error\.message);/logger.info('\''Skipping learning paths:'\'', error instanceof Error ? error.message : '\''Unknown error'\'');/' src/services/ai/EmbeddingService.ts

# Line 583: Fix return type any[]
sed -i 's/): Promise<any\[\]> {/): Promise<Array<{ content_id: string; similarity: number; content_type: string }>> {/' src/services/ai/EmbeddingService.ts

# File 2: RecommendationEngineService.ts

# Line 27: Fix metadata?: Record<string, any>
sed -i 's/metadata?: Record<string, any>;/metadata?: Record<string, unknown>;/' src/services/ai/RecommendationEngineService.ts

# Line 362: Fix (h: any)
sed -i 's/history?\.filter((h: any) => h\.completion_percentage === 100)\.map((h: any) => h\.course_id)/history?.filter((h: { completion_percentage: number; course_id: string }) => h.completion_percentage === 100).map((h) => h.course_id)/' src/services/ai/RecommendationEngineService.ts

# Line 368: Fix reduce((sum: number, h: any)
sed -i 's/history?\.reduce((sum: number, h: any) => sum + (h\.avg_assessment_score || 0), 0)/history?.reduce((sum: number, h: { avg_assessment_score?: number }) => sum + (h.avg_assessment_score || 0), 0)/' src/services/ai/RecommendationEngineService.ts

# Line 431: Fix (attempt.assessment_tools as any)
sed -i 's/(attempt\.assessment_tools as any)?\.category/(attempt.assessment_tools as { category?: string } | null)?.category/' src/services/ai/RecommendationEngineService.ts

# Line 463: Fix preferences: any
sed -i 's/private static buildUserQueryText(profile: UserLearningProfile, preferences: any): string {/private static buildUserQueryText(profile: UserLearningProfile, preferences: { interested_topics?: string[]; learning_goals?: string[]; target_skills?: string[] } | null): string {/' src/services/ai/RecommendationEngineService.ts

# Line 489: Fix course: any
sed -i 's/private static calculateSkillMatch(course: any, profile: UserLearningProfile): number {/private static calculateSkillMatch(course: { tags?: string[] | null; keywords?: string[] | null; category?: string | null; level?: string | null; difficulty_level?: string | null; prerequisites?: string[] }, profile: UserLearningProfile): number {/' src/services/ai/RecommendationEngineService.ts

# Line 559: Fix path: any, preferences: any
sed -i 's/private static calculateSkillMatchForPath(path: any, preferences: any): number {/private static calculateSkillMatchForPath(path: { tags?: string[] | null }, preferences: { target_skills?: string[] } | null): number {/' src/services/ai/RecommendationEngineService.ts

# Line 578: Fix content: any
sed -i 's/private static calculateDifficultyMatch(content: any, profile: UserLearningProfile): number {/private static calculateDifficultyMatch(content: { difficulty_level?: string | null }, profile: UserLearningProfile): number {/' src/services/ai/RecommendationEngineService.ts

# Line 642: Fix course: any
sed -i 's/course: any,$/course: { difficulty_level?: string | null; category?: string | null; tags?: string[] | null },/' src/services/ai/RecommendationEngineService.ts

# File 3: AbilityTrajectoryService.ts

# Line 262: Fix snapshots: any[]
sed -i 's/snapshots: any\[\]/snapshots: Array<{ id: string; user_id: string; category_id: string | null; ability_estimate: number; standard_error: number; confidence_lower: number; confidence_upper: number; source_assessment_id?: string; recorded_at: string }>/' src/services/analytics/AbilityTrajectoryService.ts

echo "Fixed all @typescript-eslint/no-explicit-any warnings"
