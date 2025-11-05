/**
 * Image Search Utility
 *
 * Searches for free stock photos from Pexels API based on keywords
 * Pexels API is free with generous rate limits (no API key required for basic usage)
 *
 * Alternative: Unsplash API (requires API key)
 */

export interface StockImage {
  url: string;
  thumbnail: string;
  photographer: string;
  photographerUrl?: string;
  source: 'pexels' | 'unsplash';
}

/**
 * Search for images using Pexels API
 *
 * @param query - Search keywords
 * @param count - Number of images to return (default: 5)
 * @returns Array of stock images
 */
export async function searchImages(query: string, count: number = 5): Promise<StockImage[]> {
  try {
    // Use Pexels API
    const pexelsApiKey = import.meta.env.VITE_PEXELS_API_KEY;

    if (pexelsApiKey) {
      return await searchPexels(query, count, pexelsApiKey);
    }

    // Fallback: Return placeholder images if no API key
    return getFallbackImages(query, count);
  } catch (error) {
    // Fallback to placeholder images on error
    return getFallbackImages(query, count);
  }
}

/**
 * Search Pexels for stock photos
 */
async function searchPexels(query: string, count: number, apiKey: string): Promise<StockImage[]> {
  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
    {
      headers: {
        Authorization: apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status}`);
  }

  const data = await response.json();

  return data.photos.map((photo: any) => ({
    url: photo.src.large,
    thumbnail: photo.src.medium,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    source: 'pexels' as const,
  }));
}

/**
 * Fallback: Generate placeholder images using Lorem Picsum
 */
function getFallbackImages(query: string, count: number): StockImage[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = `${query}-${index}`;
    const encodedSeed = encodeURIComponent(seed);

    return {
      url: `https://picsum.photos/seed/${encodedSeed}/1200/630`,
      thumbnail: `https://picsum.photos/seed/${encodedSeed}/600/315`,
      photographer: 'Lorem Picsum',
      photographerUrl: 'https://picsum.photos',
      source: 'pexels' as const, // Use pexels as default source
    };
  });
}

/**
 * Extract keywords from topic for better image search
 *
 * @param topic - Blog post topic
 * @returns Cleaned search query
 */
export function extractImageSearchKeywords(topic: string): string {
  // Remove common words and focus on nouns
  const stopWords = [
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'how',
    'what',
    'when',
    'where',
    'why',
    'which',
    'who',
  ];

  const words = topic
    .toLowerCase()
    .split(/\s+/)
    .filter(word => !stopWords.includes(word) && word.length > 2);

  // Take first 3-4 meaningful words
  return words.slice(0, 4).join(' ');
}
