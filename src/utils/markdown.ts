import { marked } from 'marked';

import { logger } from '@/utils/logger';
// Configure marked options for better formatting
marked.setOptions({
  async: false, // Force synchronous parsing
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert line breaks to <br>
  mangle: false, // Don't mangle email addresses
});

// Custom renderer for better styling
const renderer = new marked.Renderer();

// Custom heading renderer with better spacing
renderer.heading = function (text: string, level: number): string {
  const sizes = {
    1: 'text-4xl md:text-5xl font-bold mb-6 mt-8',
    2: 'text-3xl md:text-4xl font-semibold mb-4 mt-6',
    3: 'text-2xl md:text-3xl font-semibold mb-3 mt-4',
    4: 'text-xl md:text-2xl font-medium mb-2 mt-3',
    5: 'text-lg md:text-xl font-medium mb-2 mt-2',
    6: 'text-base md:text-lg font-medium mb-1 mt-2',
  };

  const className = sizes[level as keyof typeof sizes] || sizes[6];
  // Ensure text is a string before calling toLowerCase
  const textStr = typeof text === 'string' ? text : String(text || '');
  const id = textStr.toLowerCase().replace(/[^\w]+/g, '-');

  return `<h${level} id="${id}" class="${className}">${textStr}</h${level}>`;
};

// Custom paragraph renderer with better spacing
renderer.paragraph = (text: string) => {
  return `<p class="mb-4 text-base md:text-lg leading-relaxed text-foreground/90">${text}</p>`;
};

// Custom list renderer
renderer.list = (body: string, ordered: boolean) => {
  const tag = ordered ? 'ol' : 'ul';
  const className = ordered
    ? 'list-decimal list-inside mb-4 space-y-2 ml-4'
    : 'list-disc list-inside mb-4 space-y-2 ml-4';

  return `<${tag} class="${className}">${body}</${tag}>`;
};

// Custom list item renderer
renderer.listitem = (text: string) => {
  return `<li class="text-base md:text-lg leading-relaxed text-foreground/90">${text}</li>`;
};

// Custom blockquote renderer
renderer.blockquote = (text: string) => {
  return `<blockquote class="border-l-4 border-primary/50 pl-4 my-4 italic text-foreground/80">${text}</blockquote>`;
};

// Custom code block renderer
renderer.code = (code: string, _language?: string) => {
  return `<pre class="bg-secondary/10 rounded-lg p-4 mb-4 overflow-x-auto"><code class="text-sm md:text-base font-mono">${code}</code></pre>`;
};

// Custom inline code renderer
renderer.codespan = (text: string) => {
  return `<code class="bg-secondary/20 px-1.5 py-0.5 rounded text-sm font-mono">${text}</code>`;
};

// Custom link renderer
renderer.link = (href: string, title: string | null, text: string) => {
  const titleAttr = title ? `title="${title}"` : '';
  return `<a href="${href}" ${titleAttr} class="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors">${text}</a>`;
};

// Custom strong (bold) text renderer
renderer.strong = (text: string) => {
  return `<strong class="font-semibold text-foreground">${text}</strong>`;
};

// Custom emphasis (italic) text renderer
renderer.em = (text: string) => {
  return `<em class="italic">${text}</em>`;
};

// Custom horizontal rule renderer
renderer.hr = () => {
  return '<hr class="my-8 border-t border-border/50" />';
};

// Set the custom renderer
marked.use({ renderer });

/**
 * Convert markdown content to HTML with custom styling
 * @param markdown - The markdown content to convert
 * @returns HTML string with Tailwind classes
 */
export function parseMarkdown(markdown: string): string {
  if (!markdown) return '';

  try {
    // Process the markdown - marked v16+ returns a Promise or string
    let html: string;
    const result = marked.parse(markdown);

    // Handle both sync and async results
    if (typeof result === 'string') {
      html = result;
    } else if (result && typeof result === 'object') {
      // If it's an object or Promise, convert to string
      html = String(result);
    } else {
      // Fallback to basic parsing without custom renderer
      html = marked.parse(markdown, { async: false }) as string;
    }

    // Wrap the content in a container with proper styling
    return `<div class="prose-container">${html}</div>`;
  } catch (error) {
    logger.error('Error parsing markdown:', error);
    // Fallback: return escaped markdown in pre tags
    return `<div class="prose-container"><pre class="whitespace-pre-wrap">${markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></div>`;
  }
}

/**
 * Extract table of contents from markdown
 * @param markdown - The markdown content
 * @returns Array of heading objects for TOC
 */
export function extractTableOfContents(markdown: string) {
  const headings: { level: number; text: string; id: string }[] = [];
  const tokens = marked.lexer(markdown);

  tokens.forEach(token => {
    if (token.type === 'heading' && token.depth <= 3) {
      const textStr = String(token.text || '');
      const id = textStr.toLowerCase().replace(/[^\w]+/g, '-');
      headings.push({
        level: token.depth,
        text: textStr,
        id,
      });
    }
  });

  return headings;
}

/**
 * Calculate reading time from markdown content
 * @param markdown - The markdown content
 * @returns Estimated reading time in minutes
 */
export function calculateReadingTime(markdown: string): number {
  const wordsPerMinute = 200;
  const wordCount = markdown.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}
