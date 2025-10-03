/**
 * Content Selection Service
 * Selects appropriate learning content based on gap analysis
 */

import type {
  LearningResources,
  GapAnalysis,
  PathItem,
  AssessmentData,
  Course,
  Exercise,
  PriorityCategory
} from './types';

export class ContentSelectionService {
  /**
   * Select foundational content for weak areas
   */
  selectFoundationalContent(
    resources: LearningResources,
    gapAnalysis: GapAnalysis,
    _assessment: AssessmentData
  ): PathItem[] {
    const items: PathItem[] = [];
    const weakestCategories = gapAnalysis.priorityCategories.slice(0, 2);

    weakestCategories.forEach(category => {
      const relevantCourses = this.findFoundationalCourses(resources.courses, category);

      relevantCourses.forEach((course: Course) => {
        items.push({
          item_type: 'course',
          item_id: course.id.toString(),
          item_title: course.title,
          item_description: course.description,
          difficulty_level: 'foundational',
          irt_difficulty: -1.0,
          estimated_hours: 3,
          is_required: true,
          skill_tags: [category.name],
          reason_for_inclusion: `Builds foundation in ${category.name} (current score: ${Math.round(category.score)}%)`,
          addresses_weaknesses: [category.name],
          confidence_score: 0.9
        });
      });
    });

    return items;
  }

  /**
   * Select core learning content
   */
  selectCoreContent(
    resources: LearningResources,
    gapAnalysis: GapAnalysis,
    _goal: unknown,
    _assessment: AssessmentData
  ): PathItem[] {
    const items: PathItem[] = [];

    gapAnalysis.priorityCategories.forEach((category: PriorityCategory) => {
      const courses = this.findCategoryRelatedCourses(resources.courses, category.name);

      courses.forEach((course: Course) => {
        items.push({
          item_type: 'course',
          item_id: course.id.toString(),
          item_title: course.title,
          item_description: course.description,
          difficulty_level: 'applied',
          irt_difficulty: 0.0,
          estimated_hours: 5,
          is_required: true,
          skill_tags: [category.name],
          reason_for_inclusion: `Core learning for ${category.name}`,
          addresses_weaknesses: [category.name],
          confidence_score: 0.85
        });

        const exercises = this.findRelatedExercises(resources.exercises, course.id);

        exercises.forEach((exercise: Exercise) => {
          items.push({
            item_type: 'exercise',
            item_id: exercise.id,
            item_title: exercise.title,
            item_description: exercise.description,
            difficulty_level: 'applied',
            estimated_hours: 2,
            is_required: true,
            skill_tags: [category.name],
            reason_for_inclusion: 'Reinforce learning with hands-on practice',
            addresses_weaknesses: [category.name],
            confidence_score: 0.8
          });
        });
      });
    });

    return items.slice(0, 6);
  }

  /**
   * Select practical application content (workshops, events)
   */
  selectPracticalContent(
    resources: LearningResources,
    _gapAnalysis: GapAnalysis,
    _goal: unknown
  ): PathItem[] {
    const items: PathItem[] = [];
    const workshops = resources.workshops.slice(0, 2);

    workshops.forEach((workshop) => {
      items.push({
        item_type: 'workshop',
        item_id: workshop.id.toString(),
        item_title: workshop.title,
        item_description: workshop.description,
        difficulty_level: 'advanced',
        irt_difficulty: 1.0,
        estimated_hours: 4,
        is_required: false,
        reason_for_inclusion: 'Apply learning in practical, hands-on workshop',
        confidence_score: 0.75
      });
    });

    return items;
  }

  private findFoundationalCourses(courses: Course[], category: PriorityCategory): Course[] {
    return courses
      .filter((c: Course) => {
        const title = (c.title ?? '').toLowerCase();
        const desc = (c.description ?? '').toLowerCase();
        const categoryName = category.name.toLowerCase();
        return (title.includes(categoryName) || desc.includes(categoryName)) &&
               (c.difficulty_level === 'beginner' || c.difficulty_level === 'foundational');
      })
      .slice(0, 1);
  }

  private findCategoryRelatedCourses(courses: Course[], categoryName: string): Course[] {
    return courses
      .filter((c: Course) => {
        const title = (c.title ?? '').toLowerCase();
        const desc = (c.description ?? '').toLowerCase();
        const name = categoryName.toLowerCase();
        return title.includes(name) || desc.includes(name);
      })
      .slice(0, 1);
  }

  private findRelatedExercises(exercises: Exercise[], courseId: string | number): Exercise[] {
    return exercises
      .filter((e: Exercise) => e.course_id === courseId)
      .slice(0, 1);
  }
}

export const contentSelectionService = new ContentSelectionService();
