/**
 * ForumPage Component
 * Main forum landing page with categories grid and hot threads
 */

import { MessageCircle, TrendingUp, Users } from 'lucide-react';
import { CategoryCard } from '@/components/forum';
import { ThreadCard } from '@/components/forum';
import { useForumCategories, useHotThreads } from '@/hooks/forum';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ForumPage() {
  const { categoriesWithStats, isLoadingStats } = useForumCategories();
  const { data: hotThreads, isLoading: isLoadingHot } = useHotThreads(5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Community Forum</h1>
            <p className="text-xl text-blue-100 mb-8">
              Connect, learn, and grow with our AI learning community. Ask questions, share
              knowledge, and collaborate with learners worldwide.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MessageCircle className="h-6 w-6" />
                  <span className="text-3xl font-bold">
                    {categoriesWithStats.reduce((sum, cat) => sum + cat.thread_count, 0)}
                  </span>
                </div>
                <p className="text-blue-100 text-sm">Discussions</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-3xl font-bold">
                    {categoriesWithStats.reduce((sum, cat) => sum + cat.post_count, 0)}
                  </span>
                </div>
                <p className="text-blue-100 text-sm">Posts</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-6 w-6" />
                  <span className="text-3xl font-bold">{categoriesWithStats.length}</span>
                </div>
                <p className="text-blue-100 text-sm">Categories</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Categories - Left/Main Column */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Categories</h2>

              {isLoadingStats ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : categoriesWithStats.length === 0 ? (
                <Alert>
                  <AlertDescription>No categories available yet. Check back soon!</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {categoriesWithStats.map(category => (
                    <CategoryCard key={category.id} category={category} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Hot Threads */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                Hot Threads
              </h3>

              {isLoadingHot ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : hotThreads && hotThreads.length > 0 ? (
                <div className="space-y-3">
                  {hotThreads.map(thread => (
                    <ThreadCard key={thread.id} thread={thread} showCategory compact />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No hot threads yet. Be the first to start a discussion!
                </p>
              )}
            </div>

            {/* Forum Guidelines */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Forum Guidelines</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Be respectful and constructive</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Search before posting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Use clear, descriptive titles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Stay on topic</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Mark solved threads</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
