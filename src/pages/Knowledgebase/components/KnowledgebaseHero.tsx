/**
 * Knowledgebase Hero Component
 * Hero section with search functionality
 */

import { Input } from '@/components/ui/input';
import { Search, BookOpen } from '@/components/ui/icons';

interface KnowledgebaseHeroProps {
  title?: string;
  subtitle?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function KnowledgebaseHero({
  title = 'AI Knowledgebase',
  subtitle = 'Discover AI pioneers, companies, events, and groundbreaking research',
  searchQuery,
  onSearchChange,
}: KnowledgebaseHeroProps) {
  return (
    <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-bold">{title}</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search pioneers, companies, events, research..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
