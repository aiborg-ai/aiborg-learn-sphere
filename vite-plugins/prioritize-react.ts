import type { Plugin } from 'vite';

/**
 * Vite plugin to ensure React chunks load before all other chunks
 * by reordering modulepreload links in the generated HTML
 */
export function prioritizeReactPlugin(): Plugin {
  return {
    name: 'prioritize-react',
    enforce: 'post',
    transformIndexHtml(html) {
      // Extract all modulepreload links
      const modulePreloadRegex = /<link rel="modulepreload"[^>]*>/g;
      const preloads = html.match(modulePreloadRegex) || [];

      // Separate React preloads from others
      const reactPreloads = preloads.filter(link => link.includes('react'));
      const otherPreloads = preloads.filter(link => !link.includes('react'));

      // Reorder: React first, then everything else
      const orderedPreloads = [...reactPreloads, ...otherPreloads];

      // Remove all existing modulepreload links
      let newHtml = html.replace(modulePreloadRegex, '');

      // Insert reordered preloads before the first script tag
      const scriptTagIndex = newHtml.indexOf('<script');
      if (scriptTagIndex !== -1) {
        const preloadHtml = orderedPreloads.join('\n    ');
        newHtml = newHtml.slice(0, scriptTagIndex) + preloadHtml + '\n    ' + newHtml.slice(scriptTagIndex);
      }

      return newHtml;
    },
  };
}
