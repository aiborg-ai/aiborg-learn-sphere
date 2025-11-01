import { marked } from 'marked';

import { logger } from '@/utils/logger';
// Configure marked for synchronous operation
marked.use({
  async: false,
  gfm: true,
  breaks: true,
});

/**
 * Simple markdown to HTML conversion without custom renderers
 * @param markdown - The markdown content to convert
 * @returns HTML string
 */
export function parseMarkdownSimple(markdown: string): string {
  if (!markdown) return '';

  try {
    // Use marked without custom renderers first
    const html = marked.parse(markdown) as string;

    // Add wrapper div with Tailwind typography classes
    return `
      <div class="prose prose-lg dark:prose-invert max-w-none
        prose-headings:font-semibold
        prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8
        prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-6
        prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-4
        prose-p:text-base prose-p:md:text-lg prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-primary prose-a:hover:text-primary/80
        prose-strong:font-semibold prose-strong:text-foreground
        prose-code:bg-secondary/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
        prose-pre:bg-secondary/10 prose-pre:border prose-pre:border-border/20
        prose-blockquote:border-l-primary/50 prose-blockquote:italic
        prose-ul:list-disc prose-ul:list-inside prose-ul:my-6
        prose-ol:list-decimal prose-ol:list-inside prose-ol:my-6
        prose-li:my-2">
        ${html}
      </div>
    `;
  } catch (error) {
    logger.error('Error parsing markdown:', error);
    // Fallback: display as preformatted text
    const escaped = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return `<div class="prose prose-lg dark:prose-invert max-w-none"><pre class="whitespace-pre-wrap font-sans">${escaped}</pre></div>`;
  }
}

/**
 * Extract headings for table of contents
 * @param markdown - The markdown content
 * @returns Array of heading objects
 */
export function extractHeadings(markdown: string) {
  const headings: { level: number; text: string; id: string }[] = [];

  try {
    // Use regex to extract headings
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

      if (level <= 3) {
        // Only include h1, h2, h3
        headings.push({ level, text, id });
      }
    }
  } catch (error) {
    logger.error('Error extracting headings:', error);
  }

  return headings;
}
