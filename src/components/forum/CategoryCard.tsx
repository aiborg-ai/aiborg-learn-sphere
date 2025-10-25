/**
 * CategoryCard Component
 * Display a forum category with stats
 */

import { Link } from 'react-router-dom';
import { MessageCircle, FileText, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import * as Icons from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ForumCategoryWithStats } from '@/types/forum';

interface CategoryCardProps {
  category: ForumCategoryWithStats;
}

export function CategoryCard({ category }: CategoryCardProps) {
  // Get icon component dynamically
  const IconComponent = category.icon
    ? (Icons[category.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>) ||
      MessageCircle
    : MessageCircle;

  return (
    <Link to={`/forum/${category.slug}`}>
      <Card className="hover:shadow-lg transition-shadow group">
        <CardContent className="p-6">
          <div className="flex gap-4">
            {/* Icon */}
            <div
              className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <IconComponent className="h-6 w-6" style={{ color: category.color }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                {category.name}
              </h3>
              {category.description && (
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{category.description}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {category.thread_count} threads
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {category.post_count} posts
                </span>
              </div>

              {/* Latest Thread */}
              {category.latest_thread && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Latest:{' '}
                    <span className="font-medium text-gray-700">
                      {category.latest_thread.title}
                    </span>
                    {' by '}
                    {category.latest_thread.user?.email?.split('@')[0] || 'User'}{' '}
                    {formatDistanceToNow(new Date(category.latest_thread.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 flex items-center">
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
