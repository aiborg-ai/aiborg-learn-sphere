import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ChevronDown, ChevronUp, X } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import { getDocument } from 'pdfjs-dist';
import { logger } from '@/utils/logger';

interface PDFSearchProps {
  fileUrl: string;
  numPages: number;
  onResultClick: (page: number) => void;
}

interface SearchResult {
  page: number;
  text: string;
  matchIndex: number;
}

export function PDFSearch({ fileUrl, numPages, onResultClick }: PDFSearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState<number>(0);

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setSearching(true);
      const foundResults: SearchResult[] = [];

      try {
        const pdf = await getDocument(fileUrl).promise;

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: { str: string }) => item.str).join(' ');

          // Find all matches in the page
          const lowerQuery = query.toLowerCase();
          const lowerText = pageText.toLowerCase();
          let index = 0;
          let matchCount = 0;

          while ((index = lowerText.indexOf(lowerQuery, index)) !== -1) {
            const start = Math.max(0, index - 50);
            const end = Math.min(pageText.length, index + query.length + 50);
            const context = pageText.substring(start, end);

            foundResults.push({
              page: pageNum,
              text: context,
              matchIndex: matchCount,
            });

            matchCount++;
            index += query.length;
          }
        }

        setResults(foundResults);
        setCurrentResultIndex(0);
        logger.log(`Found ${foundResults.length} matches for "${query}"`);
      } catch (err) {
        logger.error('Error searching PDF:', err);
      } finally {
        setSearching(false);
      }
    },
    [fileUrl, numPages]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setCurrentResultIndex(0);
  };

  const handleNextResult = () => {
    if (results.length > 0) {
      const nextIndex = (currentResultIndex + 1) % results.length;
      setCurrentResultIndex(nextIndex);
      onResultClick(results[nextIndex].page);
    }
  };

  const handlePreviousResult = () => {
    if (results.length > 0) {
      const prevIndex = currentResultIndex === 0 ? results.length - 1 : currentResultIndex - 1;
      setCurrentResultIndex(prevIndex);
      onResultClick(results[prevIndex].page);
    }
  };

  const handleResultClick = (index: number) => {
    setCurrentResultIndex(index);
    onResultClick(results[index].page);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-3 border-b">
        <form onSubmit={handleSearch} className="space-y-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search in document..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pr-8"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          <Button type="submit" className="w-full" size="sm" disabled={searching || !searchQuery}>
            <Search className="h-4 w-4 mr-2" />
            {searching ? 'Searching...' : 'Search'}
          </Button>
        </form>

        {/* Results Navigation */}
        {results.length > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {currentResultIndex + 1} / {results.length} results
            </Badge>

            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousResult}
                disabled={results.length === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextResult}
                disabled={results.length === 0}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {results.length === 0 && searchQuery && !searching && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No results found for "{searchQuery}"
            </p>
          )}

          {results.map((result, index) => (
            <button
              key={`${result.page}-${result.matchIndex}`}
              onClick={() => handleResultClick(index)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                index === currentResultIndex
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent hover:border-muted-foreground/20 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-primary">Page {result.page}</span>
                {index === currentResultIndex && (
                  <Badge variant="default" className="text-xs">
                    Current
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {highlightMatch(result.text, searchQuery)}
              </p>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
