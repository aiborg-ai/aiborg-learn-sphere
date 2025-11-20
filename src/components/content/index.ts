/**
 * Content Components Exports
 *
 * Components for course content authoring
 */

// Video Embedding
export { VideoEmbed, VideoEmbedInput, parseVideoUrl } from './VideoEmbed';

// LaTeX/Math Rendering
export {
  LaTeXRenderer,
  LaTeXBlock,
  LaTeXInline,
  MixedContent,
  commonMacros,
} from './LaTeXRenderer';

// Content Block System
export {
  contentBlockDefinitions,
  blocksByCategory,
  getBlockDefinition,
  ContentBlockPalette,
  calloutVariants,
  type ContentBlockType,
  type ContentBlockDefinition,
} from './ContentBlockTypes';

// Course Templates
export {
  courseTemplates,
  templatesByCategory,
  CourseTemplateSelector,
  type CourseTemplate,
  type CourseTemplateBlock,
} from './CourseTemplates';
