/**
 * LaTeXRenderer Component
 *
 * Renders LaTeX/mathematical expressions using KaTeX
 * Supports both inline and block display modes
 */

import React, { useMemo, useEffect, useState } from 'react';
import { AlertCircle } from '@/components/ui/icons';

interface LaTeXRendererProps {
  children: string;
  displayMode?: boolean;
  className?: string;
  errorColor?: string;
  throwOnError?: boolean;
}

interface LaTeXBlockProps {
  children: string;
  className?: string;
}

interface LaTeXInlineProps {
  children: string;
  className?: string;
}

// Dynamically load KaTeX
let katexLoaded = false;
let katexPromise: Promise<void> | null = null;

async function loadKaTeX(): Promise<void> {
  if (katexLoaded) return;

  if (katexPromise) return katexPromise;

  katexPromise = new Promise((resolve, reject) => {
    // Load KaTeX CSS
    if (!document.querySelector('link[href*="katex"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      link.integrity = 'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }

    // Load KaTeX JS
    if (!window.katex) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
      script.integrity = 'sha384-XjKyOOlGwcjNTAIQHIpgOno0Ber8eFbPp6MCEohPKkVKd2xCZK0Ug0dI+P7Lff2L';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        katexLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load KaTeX'));
      document.head.appendChild(script);
    } else {
      katexLoaded = true;
      resolve();
    }
  });

  return katexPromise;
}

// Declare katex on window
declare global {
  interface Window {
    katex?: {
      renderToString: (
        tex: string,
        options?: {
          displayMode?: boolean;
          throwOnError?: boolean;
          errorColor?: string;
          trust?: boolean;
          strict?: boolean | string;
          macros?: Record<string, string>;
        }
      ) => string;
    };
  }
}

/**
 * LaTeXRenderer Component
 * Renders a single LaTeX expression
 */
export function LaTeXRenderer({
  children,
  displayMode = false,
  className = '',
  errorColor = '#cc0000',
  throwOnError = false,
}: LaTeXRendererProps) {
  const [isLoaded, setIsLoaded] = useState(katexLoaded);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      loadKaTeX()
        .then(() => setIsLoaded(true))
        .catch(err => setError(err.message));
    }
  }, [isLoaded]);

  const renderedHTML = useMemo(() => {
    if (!isLoaded || !window.katex) return null;

    try {
      return window.katex.renderToString(children, {
        displayMode,
        throwOnError,
        errorColor,
        trust: false,
        strict: 'warn',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid LaTeX';
      setError(errorMessage);
      return null;
    }
  }, [children, displayMode, throwOnError, errorColor, isLoaded]);

  if (error) {
    return (
      <span className={`inline-flex items-center gap-1 text-destructive text-sm ${className}`}>
        <AlertCircle className="h-3 w-3" />
        <code className="bg-destructive/10 px-1 rounded">{children}</code>
      </span>
    );
  }

  if (!isLoaded) {
    return (
      <span className={`animate-pulse bg-muted rounded px-2 py-0.5 ${className}`}>
        {displayMode ? '...' : children}
      </span>
    );
  }

  if (!renderedHTML) {
    return <span className={className}>{children}</span>;
  }

  return <span className={className} dangerouslySetInnerHTML={{ __html: renderedHTML }} />;
}

/**
 * LaTeXBlock Component
 * Renders LaTeX in display/block mode (centered, larger)
 */
export function LaTeXBlock({ children, className = '' }: LaTeXBlockProps) {
  return (
    <div className={`my-4 overflow-x-auto ${className}`}>
      <LaTeXRenderer displayMode>{children}</LaTeXRenderer>
    </div>
  );
}

/**
 * LaTeXInline Component
 * Renders LaTeX inline with text
 */
export function LaTeXInline({ children, className = '' }: LaTeXInlineProps) {
  return <LaTeXRenderer className={className}>{children}</LaTeXRenderer>;
}

/**
 * Parse text and render LaTeX expressions
 * Supports $...$ for inline and $$...$$ for block
 */
interface MixedContentProps {
  children: string;
  className?: string;
}

export function MixedContent({ children, className = '' }: MixedContentProps) {
  const parts = useMemo(() => {
    const result: Array<{ type: 'text' | 'inline' | 'block'; content: string }> = [];
    let remaining = children;

    // Process block math first ($$...$$)
    const blockPattern = /\$\$([\s\S]*?)\$\$/g;
    let blockMatch;
    let lastIndex = 0;

    while ((blockMatch = blockPattern.exec(children)) !== null) {
      // Add text before this match
      if (blockMatch.index > lastIndex) {
        const textBefore = children.slice(lastIndex, blockMatch.index);
        if (textBefore) {
          result.push({ type: 'text', content: textBefore });
        }
      }

      result.push({ type: 'block', content: blockMatch[1] });
      lastIndex = blockMatch.index + blockMatch[0].length;
    }

    // Process remaining text for inline math ($...$)
    remaining = children.slice(lastIndex);

    if (remaining) {
      const inlinePattern = /\$([^$]+)\$/g;
      let inlineMatch;
      lastIndex = 0;

      while ((inlineMatch = inlinePattern.exec(remaining)) !== null) {
        // Add text before this match
        if (inlineMatch.index > lastIndex) {
          const textBefore = remaining.slice(lastIndex, inlineMatch.index);
          if (textBefore) {
            result.push({ type: 'text', content: textBefore });
          }
        }

        result.push({ type: 'inline', content: inlineMatch[1] });
        lastIndex = inlineMatch.index + inlineMatch[0].length;
      }

      // Add remaining text
      if (lastIndex < remaining.length) {
        result.push({ type: 'text', content: remaining.slice(lastIndex) });
      }
    }

    return result.length > 0 ? result : [{ type: 'text' as const, content: children }];
  }, [children]);

  return (
    <div className={className}>
      {parts.map((part, index) => {
        switch (part.type) {
          case 'block':
            return <LaTeXBlock key={index}>{part.content}</LaTeXBlock>;
          case 'inline':
            return <LaTeXInline key={index}>{part.content}</LaTeXInline>;
          default:
            return <span key={index}>{part.content}</span>;
        }
      })}
    </div>
  );
}

/**
 * Common LaTeX macros for convenience
 */
export const commonMacros = {
  // Greek letters
  '\\R': '\\mathbb{R}',
  '\\N': '\\mathbb{N}',
  '\\Z': '\\mathbb{Z}',
  '\\Q': '\\mathbb{Q}',
  '\\C': '\\mathbb{C}',

  // Common operations
  '\\avg': '\\text{avg}',
  '\\diff': '\\,\\mathrm{d}',

  // Formatting
  '\\bold': '\\mathbf',
};

export default LaTeXRenderer;
