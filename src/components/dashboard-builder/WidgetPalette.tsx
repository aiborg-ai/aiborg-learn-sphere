/**
 * Widget Palette
 *
 * Sidebar with categorized widgets for dragging onto canvas
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { WidgetRegistry } from '@/services/dashboard/WidgetRegistry';
import type { WidgetCategory, WidgetType } from '@/types/dashboard';

interface WidgetPaletteProps {
  onAddWidget: (type: WidgetType) => void;
  className?: string;
}

const CATEGORY_INFO: Record<WidgetCategory, { label: string; description: string }> = {
  metrics: {
    label: 'Metrics',
    description: 'Stats, achievements, and key performance indicators',
  },
  progress: {
    label: 'Progress',
    description: 'Course progress, learning paths, and skill tracking',
  },
  charts: {
    label: 'Charts',
    description: 'Visual data representations and analytics',
  },
  activity: {
    label: 'Activity',
    description: 'Notifications, assignments, and recent activity',
  },
  insights: {
    label: 'Insights',
    description: 'AI-powered insights and personalized recommendations',
  },
};

export function WidgetPalette({ onAddWidget, className }: WidgetPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<WidgetCategory>>(
    new Set(['metrics', 'progress', 'charts', 'activity', 'insights'])
  );

  const toggleCategory = (category: WidgetCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const allWidgets = WidgetRegistry.getAll();

  // Filter widgets by search query
  const filteredWidgets = searchQuery
    ? allWidgets.filter(
        widget =>
          widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          widget.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          widget.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allWidgets;

  // Group by category
  const widgetsByCategory = filteredWidgets.reduce(
    (acc, widget) => {
      if (!acc[widget.category]) {
        acc[widget.category] = [];
      }
      acc[widget.category].push(widget);
      return acc;
    },
    {} as Record<WidgetCategory, typeof filteredWidgets>
  );

  const categories = Object.keys(widgetsByCategory) as WidgetCategory[];

  return (
    <div className={cn('flex flex-col h-full bg-background border-r', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold mb-3">Widget Library</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Widget list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {categories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No widgets found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}

          {categories.map(category => {
            const categoryWidgets = widgetsByCategory[category];
            const isExpanded = expandedCategories.has(category);
            const categoryData = CATEGORY_INFO[category];

            return (
              <Collapsible
                key={category}
                open={isExpanded}
                onOpenChange={() => toggleCategory(category)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                      <div className="text-left min-w-0">
                        <p className="text-sm font-medium">{categoryData.label}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {categoryData.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {categoryWidgets.length}
                    </Badge>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-2 space-y-2">
                  {categoryWidgets.map((widget, index) => (
                    <motion.div
                      key={widget.type}
                      className="group relative p-3 rounded-lg border bg-card hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => onAddWidget(widget.type)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, borderColor: 'hsl(var(--primary))' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-primary/10 shrink-0">
                          {/* Icon placeholder - you could render actual icon here */}
                          <div className="h-5 w-5 text-primary">
                            <Plus className="h-5 w-5" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium line-clamp-1">
                              {widget.name}
                            </h4>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddWidget(widget.type);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {widget.description}
                          </p>

                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>
                              Size: {widget.defaultSize.width}×{widget.defaultSize.height}
                            </span>
                            <span className="text-muted-foreground/50">•</span>
                            <span>
                              Min: {widget.minSize.width}×{widget.minSize.height}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Hover effect */}
                      <div className="absolute inset-0 rounded-lg border-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Click any widget to add it to your dashboard
        </p>
      </div>
    </div>
  );
}

export default WidgetPalette;
