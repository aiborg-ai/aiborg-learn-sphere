import { describe, it, expect } from 'vitest';
import {
  sanitizeHTML,
  sanitizeText,
  escapeHTML,
  sanitizeJSON,
  sanitizeURL,
  sanitizeFileName,
  isValidEmail,
  isValidPhone,
  hasSQLInjectionPattern,
  sanitizeSearchQuery,
  generateCSP,
} from '../sanitizer';

describe('sanitizer', () => {
  describe('sanitizeHTML', () => {
    it('should remove script tags', () => {
      const dirty = '<script>alert("XSS")</script><p>Hello</p>';
      const clean = sanitizeHTML(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('<p>Hello</p>');
    });

    it('should allow safe HTML tags', () => {
      const dirty = '<p>Hello <strong>World</strong></p>';
      const clean = sanitizeHTML(dirty);
      expect(clean).toBe('<p>Hello <strong>World</strong></p>');
    });

    it('should remove dangerous event handlers', () => {
      const dirty = '<p onclick="alert(\'XSS\')">Click me</p>';
      const clean = sanitizeHTML(dirty);
      expect(clean).not.toContain('onclick');
      expect(clean).toContain('<p>Click me</p>');
    });

    it('should handle custom allowed tags', () => {
      const dirty = '<div><p>Hello</p></div>';
      const clean = sanitizeHTML(dirty, { allowedTags: ['div', 'p'] });
      expect(clean).toContain('<div>');
      expect(clean).toContain('<p>');
    });

    it('should strip data URIs by default', () => {
      const dirty = '<img src="data:image/png;base64,..." />';
      const clean = sanitizeHTML(dirty);
      expect(clean).not.toContain('data:');
    });
  });

  describe('sanitizeText', () => {
    it('should remove all HTML tags', () => {
      const text = '<script>alert("XSS")</script>Hello';
      const clean = sanitizeText(text);
      expect(clean).toBe('Hello');
    });

    it('should preserve plain text', () => {
      const text = 'Hello World';
      const clean = sanitizeText(text);
      expect(clean).toBe('Hello World');
    });

    it('should remove complex HTML structures', () => {
      const text = '<div><p>Text</p><script>alert(1)</script></div>';
      const clean = sanitizeText(text);
      expect(clean).toBe('Text');
    });
  });

  describe('escapeHTML', () => {
    it('should escape special characters', () => {
      const text = '<script>alert("XSS")</script>';
      const escaped = escapeHTML(text);
      expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('should escape quotes', () => {
      const text = '"Hello" & \'World\'';
      const escaped = escapeHTML(text);
      expect(escaped).toContain('&quot;');
    });

    it('should leave plain text unchanged', () => {
      const text = 'Hello World';
      const escaped = escapeHTML(text);
      expect(escaped).toBe('Hello World');
    });
  });

  describe('sanitizeJSON', () => {
    it('should parse valid JSON', () => {
      const json = '{"name":"John","age":30}';
      const result = sanitizeJSON(json);
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should return null for invalid JSON', () => {
      const json = '{invalid json}';
      const result = sanitizeJSON(json);
      expect(result).toBeNull();
    });

    it('should sanitize HTML in JSON values', () => {
      const json = '{"name":"<script>alert(1)</script>John"}';
      const result = sanitizeJSON(json) as { name: string };
      expect(result.name).toBe('John');
      expect(result.name).not.toContain('<script>');
    });

    it('should sanitize nested objects', () => {
      const json = '{"user":{"name":"<b>John</b>"}}';
      const result = sanitizeJSON(json) as { user: { name: string } };
      expect(result.user.name).toBe('John');
    });
  });

  describe('sanitizeURL', () => {
    it('should accept valid HTTP URLs', () => {
      const url = 'http://example.com';
      const result = sanitizeURL(url);
      expect(result).toBe('http://example.com/');
    });

    it('should accept valid HTTPS URLs', () => {
      const url = 'https://example.com/path';
      const result = sanitizeURL(url);
      expect(result).toBe('https://example.com/path');
    });

    it('should reject javascript: URLs', () => {
      const url = 'javascript:alert(1)';
      const result = sanitizeURL(url);
      expect(result).toBeNull();
    });

    it('should reject data: URIs by default', () => {
      const url = 'data:text/html,<script>alert(1)</script>';
      const result = sanitizeURL(url);
      expect(result).toBeNull();
    });

    it('should allow data: URIs when specified', () => {
      const url = 'data:image/png;base64,abc123';
      const result = sanitizeURL(url, true);
      expect(result).toBe(url);
    });

    it('should return null for invalid URLs', () => {
      const url = 'not a url';
      const result = sanitizeURL(url);
      expect(result).toBeNull();
    });

    it('should accept mailto: URLs', () => {
      const url = 'mailto:test@example.com';
      const result = sanitizeURL(url);
      expect(result).toBe('mailto:test@example.com');
    });
  });

  describe('sanitizeFileName', () => {
    it('should remove path traversal attempts', () => {
      const fileName = '../../../etc/passwd';
      const result = sanitizeFileName(fileName);
      expect(result).not.toContain('..');
      expect(result).toBe('etcpasswd');
    });

    it('should remove directory separators', () => {
      const fileName = 'path/to/file.txt';
      const result = sanitizeFileName(fileName);
      expect(result).not.toContain('/');
      expect(result).toBe('pathtofile.txt');
    });

    it('should preserve valid file names', () => {
      const fileName = 'document-2024.pdf';
      const result = sanitizeFileName(fileName);
      expect(result).toBe('document-2024.pdf');
    });

    it('should limit file name length', () => {
      const fileName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFileName(fileName);
      expect(result.length).toBeLessThanOrEqual(255);
      expect(result).toContain('.txt');
    });

    it('should return "unnamed" for empty names', () => {
      const fileName = '...';
      const result = sanitizeFileName(fileName);
      expect(result).toBe('unnamed');
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@example')).toBe(false);
    });

    it('should reject emails exceeding length limit', () => {
      const longEmail = 'a'.repeat(300) + '@example.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should accept valid phone numbers', () => {
      expect(isValidPhone('123-456-7890')).toBe(true);
      expect(isValidPhone('(123) 456-7890')).toBe(true);
      expect(isValidPhone('+1234567890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abc-def-ghij')).toBe(false);
    });
  });

  describe('hasSQLInjectionPattern', () => {
    it('should detect SQL keywords', () => {
      expect(hasSQLInjectionPattern('SELECT * FROM users')).toBe(true);
      expect(hasSQLInjectionPattern('DROP TABLE users')).toBe(true);
      expect(hasSQLInjectionPattern('UNION SELECT')).toBe(true);
    });

    it('should detect SQL injection patterns', () => {
      expect(hasSQLInjectionPattern("' OR '1'='1")).toBe(true);
      expect(hasSQLInjectionPattern('1; DROP TABLE users--')).toBe(true);
    });

    it('should not flag normal text', () => {
      expect(hasSQLInjectionPattern('Hello World')).toBe(false);
      expect(hasSQLInjectionPattern('search query')).toBe(false);
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should preserve valid search queries', () => {
      const query = 'hello world';
      const result = sanitizeSearchQuery(query);
      expect(result).toBe('hello world');
    });

    it('should remove HTML tags', () => {
      const query = '<script>alert(1)</script>search';
      const result = sanitizeSearchQuery(query);
      expect(result).not.toContain('<script>');
      expect(result).toContain('search');
    });

    it('should remove SQL injection patterns', () => {
      const query = "'; DROP TABLE users--";
      const result = sanitizeSearchQuery(query);
      expect(result).not.toContain('DROP');
    });

    it('should limit query length', () => {
      const query = 'a'.repeat(200);
      const result = sanitizeSearchQuery(query, 50);
      expect(result.length).toBe(50);
    });

    it('should trim whitespace', () => {
      const query = '  search query  ';
      const result = sanitizeSearchQuery(query);
      expect(result).toBe('search query');
    });
  });

  describe('generateCSP', () => {
    it('should generate valid CSP header', () => {
      const csp = generateCSP();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain('script-src');
      expect(csp).toContain('style-src');
    });

    it('should include Supabase domains', () => {
      const csp = generateCSP();
      expect(csp).toContain('supabase.co');
    });

    it('should include security directives', () => {
      const csp = generateCSP();
      expect(csp).toContain('frame-ancestors');
      expect(csp).toContain('upgrade-insecure-requests');
    });
  });
});
