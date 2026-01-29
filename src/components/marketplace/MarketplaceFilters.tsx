/**
 * Marketplace Filters Component
 * Sidebar filters for course marketplace
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  MarketplaceFilters as FilterType,
  CourseProviderSlug,
  CourseLevel,
  PriceType,
  CourseMode,
} from '@/types/marketplace';
import { PROVIDER_INFO, LEVEL_LABELS, PRICE_TYPE_LABELS, MODE_LABELS } from '@/types/marketplace';

interface MarketplaceFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: Partial<FilterType>) => void;
  onReset: () => void;
  categories?: string[];
  className?: string;
}

// Provider list with categories
const PROVIDERS_BY_CATEGORY: Record<string, CourseProviderSlug[]> = {
  MOOCs: ['coursera', 'udemy', 'edx', 'linkedin_learning', 'pluralsight'],
  'AI Platforms': ['deeplearning_ai', 'fast_ai', 'kaggle', 'google_ai', 'aws_ml', 'huggingface'],
  Regional: ['swayam', 'xuetangx', 'futurelearn', 'alison'],
};

const LEVELS: CourseLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
const PRICE_TYPES: PriceType[] = ['free', 'freemium', 'paid', 'subscription'];
const MODES: CourseMode[] = ['online', 'self-paced', 'cohort', 'hybrid'];

export function MarketplaceFilters({
  filters,
  onFiltersChange,
  onReset,
  categories = [],
  className,
}: MarketplaceFiltersProps) {
  const hasActiveFilters = React.useMemo(() => {
    return (
      !!filters.search?.trim() ||
      (filters.providers?.length ?? 0) > 0 ||
      (filters.levels?.length ?? 0) > 0 ||
      (filters.priceTypes?.length ?? 0) > 0 ||
      (filters.modes?.length ?? 0) > 0 ||
      (filters.categories?.length ?? 0) > 0 ||
      (filters.minRating ?? 0) > 0 ||
      filters.certificateOnly
    );
  }, [filters]);

  const handleProviderToggle = (provider: CourseProviderSlug) => {
    const current = filters.providers || [];
    const updated = current.includes(provider)
      ? current.filter(p => p !== provider)
      : [...current, provider];
    onFiltersChange({ providers: updated });
  };

  const handleLevelToggle = (level: CourseLevel) => {
    const current = filters.levels || [];
    const updated = current.includes(level)
      ? current.filter(l => l !== level)
      : [...current, level];
    onFiltersChange({ levels: updated });
  };

  const handlePriceTypeToggle = (priceType: PriceType) => {
    const current = filters.priceTypes || [];
    const updated = current.includes(priceType)
      ? current.filter(p => p !== priceType)
      : [...current, priceType];
    onFiltersChange({ priceTypes: updated });
  };

  const handleModeToggle = (mode: CourseMode) => {
    const current = filters.modes || [];
    const updated = current.includes(mode) ? current.filter(m => m !== mode) : [...current, mode];
    onFiltersChange({ modes: updated });
  };

  const handleCategoryToggle = (category: string) => {
    const current = filters.categories || [];
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    onFiltersChange({ categories: updated });
  };

  return (
    <Card className={cn('sticky top-4', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <X className="mr-1 h-3 w-3" />
              Reset
            </Button>
          )}
        </div>
        <CardDescription>Refine your course search</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={filters.search || ''}
            onChange={e => onFiltersChange({ search: e.target.value })}
            className="pl-10"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
              onClick={() => onFiltersChange({ search: '' })}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <Accordion
          type="multiple"
          defaultValue={['providers', 'level', 'price', 'rating']}
          className="w-full"
        >
          {/* Providers */}
          <AccordionItem value="providers">
            <AccordionTrigger className="text-sm font-medium">
              Providers
              {(filters.providers?.length ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.providers?.length}
                </Badge>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {Object.entries(PROVIDERS_BY_CATEGORY).map(([category, providers]) => (
                  <div key={category}>
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {category}
                    </p>
                    <div className="space-y-2">
                      {providers.map(provider => (
                        <div key={provider} className="flex items-center space-x-2">
                          <Checkbox
                            id={`provider-${provider}`}
                            checked={filters.providers?.includes(provider) || false}
                            onCheckedChange={() => handleProviderToggle(provider)}
                          />
                          <Label
                            htmlFor={`provider-${provider}`}
                            className="text-sm cursor-pointer"
                          >
                            {PROVIDER_INFO[provider].name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Level */}
          <AccordionItem value="level">
            <AccordionTrigger className="text-sm font-medium">
              Level
              {(filters.levels?.length ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.levels?.length}
                </Badge>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {LEVELS.map(level => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={`level-${level}`}
                      checked={filters.levels?.includes(level) || false}
                      onCheckedChange={() => handleLevelToggle(level)}
                    />
                    <Label htmlFor={`level-${level}`} className="text-sm cursor-pointer">
                      {LEVEL_LABELS[level]}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Price */}
          <AccordionItem value="price">
            <AccordionTrigger className="text-sm font-medium">
              Price
              {(filters.priceTypes?.length ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.priceTypes?.length}
                </Badge>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  {PRICE_TYPES.map(priceType => (
                    <div key={priceType} className="flex items-center space-x-2">
                      <Checkbox
                        id={`price-${priceType}`}
                        checked={filters.priceTypes?.includes(priceType) || false}
                        onCheckedChange={() => handlePriceTypeToggle(priceType)}
                      />
                      <Label htmlFor={`price-${priceType}`} className="text-sm cursor-pointer">
                        {PRICE_TYPE_LABELS[priceType]}
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Price Range Slider */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span>Price Range</span>
                    <span className="text-muted-foreground">
                      ${filters.priceRange?.min || 0} - ${filters.priceRange?.max || 500}
                    </span>
                  </div>
                  <Slider
                    value={[filters.priceRange?.min || 0, filters.priceRange?.max || 500]}
                    onValueChange={([min, max]) => onFiltersChange({ priceRange: { min, max } })}
                    min={0}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Rating */}
          <AccordionItem value="rating">
            <AccordionTrigger className="text-sm font-medium">
              Minimum Rating
              {(filters.minRating ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.minRating}+
                </Badge>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    Minimum
                  </span>
                  <Badge variant="secondary">{filters.minRating || 0}+ stars</Badge>
                </div>
                <Slider
                  value={[filters.minRating || 0]}
                  onValueChange={([value]) => onFiltersChange({ minRating: value })}
                  min={0}
                  max={5}
                  step={0.5}
                  className="w-full"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Mode */}
          <AccordionItem value="mode">
            <AccordionTrigger className="text-sm font-medium">
              Delivery Mode
              {(filters.modes?.length ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.modes?.length}
                </Badge>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {MODES.map(mode => (
                  <div key={mode} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mode-${mode}`}
                      checked={filters.modes?.includes(mode) || false}
                      onCheckedChange={() => handleModeToggle(mode)}
                    />
                    <Label htmlFor={`mode-${mode}`} className="text-sm cursor-pointer">
                      {MODE_LABELS[mode]}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Categories */}
          {categories.length > 0 && (
            <AccordionItem value="categories">
              <AccordionTrigger className="text-sm font-medium">
                Categories
                {(filters.categories?.length ?? 0) > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.categories?.length}
                  </Badge>
                )}
              </AccordionTrigger>
              <AccordionContent>
                <div className="max-h-48 space-y-2 overflow-y-auto pt-2">
                  {categories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={filters.categories?.includes(category) || false}
                        onCheckedChange={() => handleCategoryToggle(category)}
                      />
                      <Label htmlFor={`category-${category}`} className="text-sm cursor-pointer">
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Certificate */}
          <AccordionItem value="certificate">
            <AccordionTrigger className="text-sm font-medium">Certificate</AccordionTrigger>
            <AccordionContent>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="certificate-only"
                  checked={filters.certificateOnly || false}
                  onCheckedChange={checked =>
                    onFiltersChange({ certificateOnly: checked as boolean })
                  }
                />
                <Label htmlFor="certificate-only" className="text-sm cursor-pointer">
                  Certificate included only
                </Label>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="border-t pt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Active Filters</p>
            <div className="flex flex-wrap gap-1.5">
              {filters.providers?.map(p => (
                <Badge
                  key={p}
                  variant="outline"
                  className="cursor-pointer text-xs"
                  onClick={() => handleProviderToggle(p)}
                >
                  {PROVIDER_INFO[p].name}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
              {filters.levels?.map(l => (
                <Badge
                  key={l}
                  variant="outline"
                  className="cursor-pointer text-xs"
                  onClick={() => handleLevelToggle(l)}
                >
                  {LEVEL_LABELS[l]}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
              {filters.priceTypes?.map(p => (
                <Badge
                  key={p}
                  variant="outline"
                  className="cursor-pointer text-xs"
                  onClick={() => handlePriceTypeToggle(p)}
                >
                  {PRICE_TYPE_LABELS[p]}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
              {(filters.minRating ?? 0) > 0 && (
                <Badge
                  variant="outline"
                  className="cursor-pointer text-xs"
                  onClick={() => onFiltersChange({ minRating: 0 })}
                >
                  {filters.minRating}+ stars
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              )}
              {filters.certificateOnly && (
                <Badge
                  variant="outline"
                  className="cursor-pointer text-xs"
                  onClick={() => onFiltersChange({ certificateOnly: false })}
                >
                  Certificate
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MarketplaceFilters;
