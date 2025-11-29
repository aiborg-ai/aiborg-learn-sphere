/**
 * RecommendedResources Component
 * Displays personalized recommendations based on assessment results
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  GraduationCap,
  ExternalLink,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from '@/components/ui/icons';
import { ThumbnailImage } from '@/components/shared/OptimizedImage';
import { useNavigate } from 'react-router-dom';
import type { Course } from '@/hooks/useCourses';
import type { BlogPost } from '@/types/blog';

interface RecommendedResourcesProps {
  courses: Course[];
  blogPosts: BlogPost[];
  weakCategories: string[];
}

export function RecommendedResources({
  courses,
  blogPosts,
  weakCategories,
}: RecommendedResourcesProps) {
  const navigate = useNavigate();

  if (courses.length === 0 && blogPosts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Sparkles className="h-4 w-4" />
          <span>Personalized for You</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Continue Your Learning Journey</h2>
        <p className="text-muted-foreground">
          Based on your results, here are resources to help you improve
        </p>
      </div>

      {/* Weak Areas Banner */}
      {weakCategories.length > 0 && (
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                  Focus Areas for Improvement
                </h3>
                <div className="flex flex-wrap gap-2">
                  {weakCategories.map((category, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-white dark:bg-orange-950/40 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300"
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Courses */}
      {courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Recommended Courses
            </CardTitle>
            <CardDescription>Structured learning paths to strengthen your skills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.slice(0, 4).map(course => (
                <Card
                  key={course.id}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {course.level}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {course.mode}
                      </Badge>
                    </div>
                    <h4 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {course.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{course.duration}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">{course.price}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {courses.length > 4 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate('/#training-programs')}
              >
                View All Courses
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommended Blog Posts */}
      {blogPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Recommended Reading
            </CardTitle>
            <CardDescription>Articles and guides to deepen your understanding</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blogPosts.slice(0, 6).map(post => (
                <Card
                  key={post.id}
                  className="hover:shadow-sm transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {post.featured_image_url && (
                        <ThumbnailImage
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-20 h-20 object-cover rounded flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {post.blog_categories && (
                            <Badge variant="secondary" className="text-xs">
                              {post.blog_categories.name}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {post.estimated_read_time || '5 min'} read
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-1">
                          {post.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{post.excerpt}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {blogPosts.length > 6 && (
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/blog')}>
                View All Articles
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
