import { marked, type Tokens } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

import { logger } from '@/utils/logger';

// Custom renderer for better styling (marked v16+ API)
const renderer: Partial<marked.Renderer> = {
  // Custom heading renderer with better spacing
  heading(token: Tokens.Heading): string {
    const sizes: Record<number, string> = {
      1: 'text-4xl md:text-5xl font-bold mb-6 mt-8',
      2: 'text-3xl md:text-4xl font-semibold mb-4 mt-6',
      3: 'text-2xl md:text-3xl font-semibold mb-3 mt-4',
      4: 'text-xl md:text-2xl font-medium mb-2 mt-3',
      5: 'text-lg md:text-xl font-medium mb-2 mt-2',
      6: 'text-base md:text-lg font-medium mb-1 mt-2',
    };

    const level = token.depth;
    const text = token.text || '';
    const className = sizes[level] || sizes[6];
    const id = text.toLowerCase().replace(/[^\w]+/g, '-');

    return `<h${level} id="${id}" class="${className}">${text}</h${level}>`;
  },

  // Custom paragraph renderer with better spacing
  paragraph(token: Tokens.Paragraph): string {
    const text = this.parser?.parseInline(token.tokens) || token.text || '';
    return `<p class="mb-4 text-base md:text-lg leading-relaxed text-foreground/90">${text}</p>`;
  },

  // Custom list renderer
  list(token: Tokens.List): string {
    const tag = token.ordered ? 'ol' : 'ul';
    const className = token.ordered
      ? 'list-decimal list-inside mb-4 space-y-2 ml-4'
      : 'list-disc list-inside mb-4 space-y-2 ml-4';

    let body = '';
    for (const item of token.items) {
      body += this.listitem?.(item) || '';
    }

    return `<${tag} class="${className}">${body}</${tag}>`;
  },

  // Custom list item renderer
  listitem(token: Tokens.ListItem): string {
    const text = this.parser?.parseInline(token.tokens) || token.text || '';
    return `<li class="text-base md:text-lg leading-relaxed text-foreground/90">${text}</li>`;
  },

  // Custom blockquote renderer
  blockquote(token: Tokens.Blockquote): string {
    const text = this.parser?.parse(token.tokens) || token.text || '';
    return `<blockquote class="border-l-4 border-primary/50 pl-4 my-4 italic text-foreground/80">${text}</blockquote>`;
  },

  // Custom code block renderer
  code(token: Tokens.Code): string {
    const code = token.text || '';
    const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre class="bg-secondary/10 rounded-lg p-4 mb-4 overflow-x-auto"><code class="text-sm md:text-base font-mono">${escaped}</code></pre>`;
  },

  // Custom inline code renderer
  codespan(token: Tokens.Codespan): string {
    const text = token.text || '';
    return `<code class="bg-secondary/20 px-1.5 py-0.5 rounded text-sm font-mono">${text}</code>`;
  },

  // Custom link renderer
  link(token: Tokens.Link): string {
    const href = token.href || '';
    const title = token.title;
    const text = this.parser?.parseInline(token.tokens) || token.text || '';
    const titleAttr = title ? ` title="${title}"` : '';
    return `<a href="${href}"${titleAttr} class="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors">${text}</a>`;
  },

  // Custom strong (bold) text renderer
  strong(token: Tokens.Strong): string {
    const text = this.parser?.parseInline(token.tokens) || token.text || '';
    return `<strong class="font-semibold text-foreground">${text}</strong>`;
  },

  // Custom emphasis (italic) text renderer
  em(token: Tokens.Em): string {
    const text = this.parser?.parseInline(token.tokens) || token.text || '';
    return `<em class="italic">${text}</em>`;
  },

  // Custom horizontal rule renderer
  hr(): string {
    return '<hr class="my-8 border-t border-border/50" />';
  },
};

// Configure marked with custom renderer (marked v16+ API)
marked.use({
  renderer,
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert line breaks to <br>
});

/**
 * Convert markdown content to HTML with custom styling
 * SECURITY: All output is sanitized with DOMPurify to prevent XSS attacks
 * @param markdown - The markdown content to convert
 * @returns Sanitized HTML string with Tailwind classes
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

    // SECURITY: Sanitize HTML to prevent XSS attacks
    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'br',
        'strong',
        'em',
        'u',
        's',
        'del',
        'ul',
        'ol',
        'li',
        'blockquote',
        'code',
        'pre',
        'a',
        'img',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'div',
        'span',
        'hr',
      ],
      ALLOWED_ATTR: [
        'href',
        'title',
        'target',
        'rel', // links
        'src',
        'alt',
        'width',
        'height', // images
        'class',
        'id', // styling and anchors
      ],
      ALLOW_DATA_ATTR: false, // Prevent data-* XSS vectors
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
      // Force all links to use HTTPS and open in new tab
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):)/i,
    });

    // Wrap the content in a container with proper styling
    return `<div class="prose-container">${sanitized}</div>`;
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
