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

      // Separate vendor/React preloads from others (must load first to avoid circular deps)
      // react-core-chunk must load FIRST, then other chunks that depend on React
      const reactCorePreloads = preloads.filter(link => link.includes('react-core-chunk'));
      const reactRelatedPreloads = preloads.filter(link =>
        !link.includes('react-core-chunk') &&
        (link.includes('react') || link.includes('radix'))
      );
      const vendorPreloads = preloads.filter(link =>
        !link.includes('react-core-chunk') &&
        !link.includes('react') &&
        !link.includes('radix') &&
        (link.includes('vendor') || link.includes('supabase') || link.includes('tanstack'))
      );
      const otherPreloads = preloads.filter(link =>
        !link.includes('react-core-chunk') &&
        !link.includes('react') &&
        !link.includes('radix') &&
        !link.includes('vendor') &&
        !link.includes('supabase') &&
        !link.includes('tanstack')
      );

      // Reorder: React core FIRST, then React-related, then vendors, then everything else
      const orderedPreloads = [...reactCorePreloads, ...reactRelatedPreloads, ...vendorPreloads, ...otherPreloads];

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
