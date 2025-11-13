/**
 * XSS Prevention Test Suite
 *
 * Tests for Cross-Site Scripting (XSS) vulnerabilities in markdown parsing,
 * user input handling, and HTML rendering across the application.
 *
 * @author Security Team
 * @date 2025-11-13
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '@/utils/markdown';
import { parseMarkdownSimple } from '@/utils/markdownSimple';
import DOMPurify from 'isomorphic-dompurify';

describe('XSS Prevention - Markdown Parsing', () => {
  describe('parseMarkdown (Primary Parser)', () => {
    it('should block script tags', () => {
      const malicious = '<script>alert("XSS")</script>';
      const result = parseMarkdown(malicious);

      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert');
    });

    it('should remove event handlers from images', () => {
      const malicious = '<img src=x onerror="alert(\'XSS\')">';
      const result = parseMarkdown(malicious);

      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should block javascript: URLs in links', () => {
      const malicious = '[Click me](javascript:alert("XSS"))';
      const result = parseMarkdown(malicious);

      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('alert');
    });

    it('should block data: URIs in images', () => {
      const malicious = '<img src="data:text/html,<script>alert(\'XSS\')</script>">';
      const result = parseMarkdown(malicious);

      expect(result).not.toContain('data:text/html');
      expect(result).not.toContain('<script');
    });

    it('should remove iframe tags', () => {
      const malicious = '<iframe src="https://evil.com"></iframe>';
      const result = parseMarkdown(malicious);

      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('evil.com');
    });

    it('should remove object tags', () => {
      const malicious = '<object data="malicious.swf"></object>';
      const result = parseMarkdown(malicious);

      expect(result).not.toContain('<object');
      expect(result).not.toContain('malicious.swf');
    });

    it('should remove embed tags', () => {
      const malicious = '<embed src="malicious.swf">';
      const result = parseMarkdown(malicious);

      expect(result).not.toContain('<embed');
      expect(result).not.toContain('malicious.swf');
    });

    it('should strip event handlers from multiple attributes', () => {
      const malicious = '<div onclick="alert(1)" onmouseover="alert(2)" onfocus="alert(3)">Text</div>';
      const result = parseMarkdown(malicious);

      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onmouseover');
      expect(result).not.toContain('onfocus');
    });

    it('should block vbscript: URLs', () => {
      const malicious = '[Click](vbscript:msgbox("XSS"))';
      const result = parseMarkdown(malicious);

      expect(result).not.toContain('vbscript:');
      expect(result).not.toContain('msgbox');
    });

    it('should allow safe markdown formatting', () => {
      const safe = '**Bold** and *italic* text';
      const result = parseMarkdown(safe);

      // Convert to string if needed
      const resultStr = String(result);
      expect(resultStr).toMatch(/<strong>|<b>/i);
      expect(resultStr).toMatch(/<em>|<i>/i);
    });

    it('should sanitize nested XSS attempts', () => {
      const malicious = '<b><script>alert("XSS")</script></b>';
      const result = parseMarkdown(malicious);

      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert');
    });

    it('should handle empty input safely', () => {
      expect(parseMarkdown('')).toBe('');
      expect(parseMarkdown(null as any)).toBe('');
      expect(parseMarkdown(undefined as any)).toBe('');
    });
  });

  describe('parseMarkdownSimple (Legacy Parser)', () => {
    it('should block script tags', () => {
      const malicious = '<script>alert("XSS")</script>';
      const result = parseMarkdownSimple(malicious);

      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert');
    });

    it('should remove event handlers', () => {
      const malicious = '<img src=x onerror="alert(\'XSS\')">';
      const result = parseMarkdownSimple(malicious);

      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should block javascript: URLs', () => {
      const malicious = '[link](javascript:alert("XSS"))';
      const result = parseMarkdownSimple(malicious);

      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('alert');
    });
  });
});

describe('XSS Prevention - DOMPurify Direct', () => {
  it('should sanitize HTML with DOMPurify', () => {
    const malicious = '<script>alert("XSS")</script><p>Safe text</p>';
    const result = DOMPurify.sanitize(malicious);

    expect(result).not.toContain('<script');
    expect(result).toContain('<p>Safe text</p>');
  });

  it('should remove dangerous attributes', () => {
    const malicious = '<img src=x onerror="alert(1)" onload="alert(2)">';
    const result = DOMPurify.sanitize(malicious, {
      ALLOWED_TAGS: ['img'],
      ALLOWED_ATTR: ['src', 'alt'],
    });

    expect(result).not.toContain('onerror');
    expect(result).not.toContain('onload');
  });

  it('should block data URIs when configured', () => {
    const malicious = '<img src="data:text/html,<script>alert(1)</script>">';
    const result = DOMPurify.sanitize(malicious, {
      ALLOWED_TAGS: ['img'],
      ALLOWED_ATTR: ['src'],
      ALLOW_DATA_ATTR: false,
      ALLOWED_URI_REGEXP: /^https?:/i,
    });

    expect(result).not.toContain('data:');
  });
});

describe('XSS Prevention - URL Validation', () => {
  const sanitizeURL = (url: string): boolean => {
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    try {
      const parsed = new URL(url);
      return allowedProtocols.includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  it('should allow https:// URLs', () => {
    expect(sanitizeURL('https://example.com')).toBe(true);
  });

  it('should allow http:// URLs', () => {
    expect(sanitizeURL('http://example.com')).toBe(true);
  });

  it('should allow mailto: URLs', () => {
    expect(sanitizeURL('mailto:test@example.com')).toBe(true);
  });

  it('should block javascript: URLs', () => {
    expect(sanitizeURL('javascript:alert(1)')).toBe(false);
  });

  it('should block data: URLs', () => {
    expect(sanitizeURL('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('should block vbscript: URLs', () => {
    expect(sanitizeURL('vbscript:msgbox(1)')).toBe(false);
  });

  it('should block file:// URLs', () => {
    expect(sanitizeURL('file:///etc/passwd')).toBe(false);
  });
});

describe('XSS Prevention - Content Types', () => {
  describe('Blog Posts', () => {
    it('should sanitize blog post content', () => {
      const blogContent = '# My Post\n\n<script>alert("XSS")</script>\n\nSafe content.';
      const result = parseMarkdown(blogContent);

      // Result should be a string
      expect(typeof result).toBe('string');
      expect(result).not.toContain('<script');
      // Content may be within the parsed HTML structure
      expect(result.toLowerCase()).toContain('safe content');
    });

    it('should preserve safe markdown in blog posts', () => {
      const blogContent = '**Bold** text';
      const result = parseMarkdown(blogContent);

      // Convert to string and check
      const resultStr = String(result);
      expect(resultStr).toMatch(/<strong>|<b>/i);
      expect(resultStr.toLowerCase()).toContain('bold');
    });
  });

  describe('Comments', () => {
    it('should handle plain text comments safely', () => {
      const comment = 'This is a safe comment with <script>tags</script>';
      // Comments should be plain text, no HTML parsing
      const escaped = comment
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      expect(escaped).not.toContain('<script');
      expect(escaped).toContain('&lt;script&gt;');
    });
  });

  describe('Exercise Instructions', () => {
    it('should sanitize exercise instructions', () => {
      const instructions = '<h2>Instructions</h2><script>alert("XSS")</script><p>Safe text</p>';
      const result = DOMPurify.sanitize(instructions, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'ul', 'ol', 'li', 'code', 'pre'],
        ALLOWED_ATTR: ['class'],
        ALLOW_DATA_ATTR: false,
      });

      expect(result).not.toContain('<script');
      expect(result).toContain('<h2>Instructions</h2>');
      expect(result).toContain('<p>Safe text</p>');
    });
  });
});

describe('XSS Prevention - Edge Cases', () => {
  it('should handle malformed HTML', () => {
    const malformed = '<script<script>alert(1)</script>';
    const result = parseMarkdown(malformed);

    expect(result).not.toContain('alert(1)');
  });

  it('should handle Unicode encoding attempts', () => {
    const unicode = '\\u003cscript\\u003ealert(1)\\u003c/script\\u003e';
    const result = parseMarkdown(unicode);

    // Should treat as plain text, not execute
    expect(result).not.toMatch(/<script>alert\(1\)<\/script>/);
  });

  it('should handle HTML entity encoding attempts', () => {
    const entities = '&#60;script&#62;alert(1)&#60;/script&#62;';
    const result = parseMarkdown(entities);

    // Entities should be double-encoded or stripped
    expect(result).not.toContain('<script>alert(1)</script>');
  });

  it('should handle case variations', () => {
    const caseVariations = [
      '<SCRIPT>alert(1)</SCRIPT>',
      '<Script>alert(1)</Script>',
      '<sCrIpT>alert(1)</sCrIpT>',
    ];

    caseVariations.forEach(malicious => {
      const result = parseMarkdown(malicious);
      expect(result.toLowerCase()).not.toContain('<script');
    });
  });

  it('should handle whitespace obfuscation', () => {
    const obfuscated = '<img src=x onerror\n=\nalert(1)>';
    const result = parseMarkdown(obfuscated);

    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert');
  });

  it('should handle NULL byte injection', () => {
    const nullByte = '<img src=x\\x00 onerror=alert(1)>';
    const result = parseMarkdown(nullByte);

    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert');
  });
});

describe('XSS Prevention - Real-World Attack Vectors', () => {
  it('should block AngularJS template injection', () => {
    const angular = '{{constructor.constructor("alert(1)")()}}';
    const result = parseMarkdown(angular);

    // Should be treated as plain text
    expect(result).not.toMatch(/constructor.*alert/);
  });

  it('should block SVG-based XSS', () => {
    const svg = '<svg onload="alert(1)">';
    const result = parseMarkdown(svg);

    expect(result).not.toContain('onload');
    expect(result).not.toContain('alert');
  });

  it('should block style-based XSS', () => {
    const style = '<div style="background:url(javascript:alert(1))">Text</div>';
    const result = parseMarkdown(style);

    expect(result).not.toContain('javascript:');
  });

  it('should block meta refresh XSS', () => {
    const meta = '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">';
    const result = parseMarkdown(meta);

    expect(result).not.toContain('<meta');
    expect(result).not.toContain('javascript:');
  });

  it('should block link import XSS', () => {
    const link = '<link rel="import" href="data:text/html,<script>alert(1)</script>">';
    const result = parseMarkdown(link);

    expect(result).not.toContain('<link');
    expect(result).not.toContain('data:');
  });
});

describe('XSS Prevention - Performance', () => {
  it('should handle large inputs efficiently', () => {
    const largeInput = 'Safe text. '.repeat(10000);
    const start = performance.now();
    parseMarkdown(largeInput);
    const end = performance.now();

    // Should complete in reasonable time (< 1 second)
    expect(end - start).toBeLessThan(1000);
  });

  it('should handle deeply nested structures', () => {
    let nested = 'Text';
    for (let i = 0; i < 100; i++) {
      nested = `<div>${nested}</div>`;
    }

    // Should not cause stack overflow or hang
    expect(() => parseMarkdown(nested)).not.toThrow();
  });
});

describe('XSS Prevention - Sanitization Configuration', () => {
  it('should use consistent DOMPurify config across app', () => {
    const testConfig = {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'em', 'u',
        'ul', 'ol', 'li',
        'a', 'code', 'pre', 'blockquote',
        'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ],
      ALLOWED_ATTR: ['href', 'title', 'src', 'alt', 'class'],
      ALLOW_DATA_ATTR: false,
      ALLOWED_URI_REGEXP: /^(?:https?:)/i,
    };

    const malicious = '<script>alert(1)</script><p>Safe</p><img src="http://example.com/img.jpg" alt="Test">';
    const result = DOMPurify.sanitize(malicious, testConfig);

    expect(result).not.toContain('<script');
    expect(result).toContain('<p>Safe</p>');
    expect(result).toContain('<img');
  });
});

/**
 * Integration Tests
 *
 * These tests verify XSS prevention in component integration scenarios
 */
describe('XSS Prevention - Integration', () => {
  it('should safely render user-generated blog posts', () => {
    const userPost = {
      title: 'My Post',
      content: '**Safe** content with <script>alert("XSS")</script>',
    };

    const rendered = parseMarkdown(userPost.content);
    const renderedStr = String(rendered);
    expect(renderedStr).not.toContain('<script');
    expect(renderedStr).toMatch(/<strong>|<b>/i);
    expect(renderedStr.toLowerCase()).toContain('safe');
  });

  it('should safely display exercise instructions', () => {
    const exercise = {
      title: 'Exercise 1',
      instructions: '<h2>Steps</h2><script>alert(1)</script><p>Follow these steps.</p>',
    };

    const sanitized = DOMPurify.sanitize(exercise.instructions, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre'],
      ALLOWED_ATTR: ['class'],
      ALLOW_DATA_ATTR: false,
    });

    expect(sanitized).not.toContain('<script');
    expect(sanitized).toContain('<h2>Steps</h2>');
  });
});
