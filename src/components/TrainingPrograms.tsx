import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Audience } from '@/contexts/PersonalizationContext';
import { usePersonalization, AUDIENCE_CONFIG } from '@/contexts/PersonalizationContext';
import { EnrollmentForm } from '@/components/forms';
import { CourseDetailsModal, CourseRecordingsModal } from '@/components/modals';
import type { Course } from '@/hooks/useCourses';
import { useCourses } from '@/hooks/useCourses';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useReviewCounts } from '@/hooks/useReviewCounts';
import { useAuth } from '@/hooks/useAuth';
import {
  Search,
  Filter,
  Clock,
  Calendar,
  ArrowRight,
  BookOpen,
  Monitor,
  Baby,
  GraduationCap,
  Briefcase,
  Building2,
  Loader2,
  AlertCircle,
  X,
  CheckCircle,
  Play,
  Star,
} from 'lucide-react';
import { ShareButton } from '@/components/shared';

export const TrainingPrograms = () => {
  const { courses, loading, error, refetch } = useCourses();
  const { getEnrollmentStatus } = useEnrollments();
  const { getReviewCount, loading: reviewCountsLoading } = useReviewCounts();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [showFilters, setShowFilters] = useState(false);
  const [enrollmentFormOpen, setEnrollmentFormOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [currentlyEnrolling, setCurrentlyEnrolling] = useState(false);
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(!!user); // Default to enrolled filter for logged in users
  const [recordingsModalOpen, setRecordingsModalOpen] = useState(false);
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const { selectedAudience, setSelectedAudience } = usePersonalization();

  // Convert database courses to the format expected by the component
  const programs = courses.map(course => ({
    id: course.id,
    title: course.title,
    description: course.description,
    audience: course.audience, // Kept for backward compatibility
    audiences: course.audiences || (course.audience ? [course.audience] : []), // New field for multiple audiences
    mode: course.mode,
    duration: course.duration,
    price: course.price,
    level: course.level,
    startDate: course.start_date,
    features: course.features,
    category: course.category,
    keywords: course.keywords,
    prerequisites: course.prerequisites,
    currentlyEnrolling: course.currently_enrolling,
  }));

  // Map database audience names to internal IDs for filtering
  const audienceMapping = {
    'Young Learners': 'primary',
    Teenagers: 'secondary',
    Professionals: 'professional',
    SMEs: 'business',
  };

  // Helper function to check if a date is in current or next month
  const isInCurrentOrNextMonth = (dateString: string) => {
    if (
      !dateString ||
      dateString === 'Ongoing' ||
      dateString === 'Flexible' ||
      dateString === 'Enquire for start date'
    ) {
      return false;
    }

    try {
      // Parse date string (assuming format like "15 Oct 2025")
      const courseDate = new Date(dateString);
      const now = new Date();
      const currentMonth = now.getMonth(); // 0-11 (July = 6)
      const currentYear = now.getFullYear();
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

      const courseMonth = courseDate.getMonth();
      const courseYear = courseDate.getFullYear();

      // Check if course is in current month (July 2025) or next month (August 2025)
      return (
        (courseYear === currentYear && courseMonth === currentMonth) ||
        (courseYear === nextMonthYear && courseMonth === nextMonth)
      );
    } catch {
      return false;
    }
  };

  // Filter programs based on selected audience and search criteria
  const filteredPrograms = programs.filter(program => {
    // Check if any of the program's audiences match the selected audience
    const matchesAudience =
      selectedAudience === 'All' ||
      program.audiences.some(aud => {
        const audienceId = audienceMapping[aud as keyof typeof audienceMapping];
        return audienceId === selectedAudience;
      });

    const matchesSearch =
      program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'All Categories' || program.category === selectedCategory;
    const matchesLevel = selectedLevel === 'All Levels' || program.level === selectedLevel;
    const matchesCurrentlyEnrolling = !currentlyEnrolling || program.currentlyEnrolling;

    // Filter for enrolled courses if the user is logged in and showEnrolledOnly is true
    const matchesEnrolledFilter =
      !showEnrolledOnly ||
      !user ||
      getEnrollmentStatus(program.id, program.startDate) !== 'not_enrolled';

    return (
      matchesAudience &&
      matchesSearch &&
      matchesCategory &&
      matchesLevel &&
      matchesCurrentlyEnrolling &&
      matchesEnrolledFilter
    );
  });

  // Get unique categories and levels for filter options
  const categories = ['All Categories', ...Array.from(new Set(programs.map(p => p.category)))];
  const levels = ['All Levels', ...Array.from(new Set(programs.map(p => p.level)))];

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'Young Learners':
        return Baby;
      case 'Teenagers':
        return GraduationCap;
      case 'Professionals':
        return Briefcase;
      case 'SMEs':
        return Building2;
      default:
        return BookOpen;
    }
  };

  const handleEnrollClick = (program: Course) => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    // Find the original course object from the courses array
    const originalCourse = courses.find(c => c.id === program.id);
    if (originalCourse) {
      setSelectedCourse(originalCourse);
      setEnrollmentFormOpen(true);
    }
  };

  const handleDetailsClick = (program: Course) => {
    // Find the original course object from the courses array
    const originalCourse = courses.find(c => c.id === program.id);
    if (originalCourse) {
      setSelectedCourse(originalCourse);
      setDetailsModalOpen(true);
    }
  };

  const handleReviewsClick = (courseId: number) => {
    // Scroll to reviews section with course filter
    const reviewsSection = document.getElementById('reviews');
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: 'smooth' });
      // We'll need to pass the course filter to the reviews section
      window.dispatchEvent(new CustomEvent('filterReviewsByCourse', { detail: { courseId } }));
    }
  };

  if (loading) {
    return (
      <section className="py-20 px-4 bg-gradient-to-br from-background to-background/50">
        <div className="container mx-auto text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 px-4 bg-gradient-to-br from-background to-background/50">
        <div className="container mx-auto text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">Error loading courses: {error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-background to-background/50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI Training Programs
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive AI education designed for different learning levels and career goals
          </p>
        </div>

        {/* Audience Selection Tabs */}
        <Tabs
          value={selectedAudience}
          onValueChange={value => setSelectedAudience(value as Audience)}
          className="mb-8"
        >
          <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto">
            {(Object.keys(AUDIENCE_CONFIG) as Audience[]).map(audience => {
              const config = AUDIENCE_CONFIG[audience];
              const displayName = 'displayName' in config ? config.displayName : config.name;
              const Icon = audience === 'All' ? BookOpen : getAudienceIcon(displayName);
              return (
                <TabsTrigger key={audience} value={audience} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{displayName}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Search and Filter Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search programs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {user && (
                <Button
                  variant={showEnrolledOnly ? 'default' : 'outline'}
                  onClick={() => setShowEnrolledOnly(!showEnrolledOnly)}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Already Enrolled
                </Button>
              )}
              <Button
                variant={currentlyEnrolling ? 'default' : 'outline'}
                onClick={() => setCurrentlyEnrolling(!currentlyEnrolling)}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Currently Enrolling
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted rounded-lg">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-muted-foreground">
          Showing {filteredPrograms.length} of {programs.length} programs
          {selectedAudience !== 'All' &&
            (() => {
              const config = AUDIENCE_CONFIG[selectedAudience];
              const displayName =
                config && 'displayName' in config ? config.displayName : config?.name;
              return ` for ${displayName} audience`;
            })()}
          {currentlyEnrolling && ' (Currently Enrolling)'}
        </div>

        {/* Programs Grid */}
        {filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {showEnrolledOnly && user ? 'No enrolled programs' : 'No programs found'}
            </h3>
            <p className="text-muted-foreground">
              {showEnrolledOnly && user
                ? 'You currently have no enrolled programs. Browse available courses and enroll to start your learning journey!'
                : 'Try adjusting your search terms or filters to find relevant programs.'}
            </p>
            {showEnrolledOnly && user && (
              <Button onClick={() => setShowEnrolledOnly(false)} className="mt-4" variant="outline">
                Browse All Programs
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(showAllPrograms ? filteredPrograms : filteredPrograms.slice(0, 3)).map(program => {
                return (
                  <Card
                    key={program.id}
                    className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex flex-wrap gap-1">
                          {program.audiences.map((aud, index) => {
                            const AudienceIcon = getAudienceIcon(aud);
                            return (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                <AudienceIcon className="h-3 w-3" />
                                {aud}
                              </Badge>
                            );
                          })}
                        </div>
                        <Badge variant="outline">{program.level}</Badge>
                      </div>

                      <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                        {program.title}
                      </h3>

                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {program.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {program.duration}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {program.startDate}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Monitor className="h-4 w-4" />
                          {program.mode}
                        </div>
                        {/* Reviews count display */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Star className="h-4 w-4" />
                          <button
                            onClick={() => handleReviewsClick(program.id)}
                            className="hover:text-primary hover:underline cursor-pointer"
                          >
                            {getReviewCount(program.id)} review
                            {getReviewCount(program.id) !== 1 ? 's' : ''}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-primary">{program.price}</span>
                          {(program.price === 'Free' ||
                            program.price === '₹0' ||
                            program.price === '0' ||
                            program.price?.toLowerCase().includes('free')) && (
                            <Badge
                              variant="secondary"
                              className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                            >
                              Free Course
                            </Badge>
                          )}
                        </div>
                        <ShareButton title={program.title} description={program.description} />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDetailsClick(program)}
                        >
                          Details
                        </Button>
                        {user &&
                          getEnrollmentStatus(program.id, program.startDate) !== 'not_enrolled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Find the original course object from the courses array
                                const originalCourse = courses.find(c => c.id === program.id);
                                if (originalCourse) {
                                  setSelectedCourse(originalCourse);
                                  setRecordingsModalOpen(true);
                                }
                              }}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Recordings
                            </Button>
                          )}
                        {user ? (
                          (() => {
                            const status = getEnrollmentStatus(program.id, program.startDate);
                            switch (status) {
                              case 'enrolled':
                                return (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    disabled
                                  >
                                    <CheckCircle className="mr-1 h-4 w-4" />
                                    Enrolled
                                  </Button>
                                );
                              case 'completed':
                                return (
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled
                                  >
                                    <CheckCircle className="mr-1 h-4 w-4" />
                                    Completed
                                  </Button>
                                );
                              default:
                                return (
                                  <Button
                                    size="sm"
                                    onClick={() => handleEnrollClick(program)}
                                    className="group/btn"
                                  >
                                    Enroll
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                  </Button>
                                );
                            }
                          })()
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleEnrollClick(program)}
                            className="group/btn"
                          >
                            Enroll
                            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {filteredPrograms.length > 3 && (
              <div className="text-center mt-8">
                <Button
                  onClick={() => setShowAllPrograms(!showAllPrograms)}
                  variant="outline"
                  className="px-8 py-2"
                >
                  {showAllPrograms
                    ? 'Show Less'
                    : `Show More (${filteredPrograms.length - 3} more)`}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Enrollment Form Modal */}
        <EnrollmentForm
          isOpen={enrollmentFormOpen}
          onClose={() => setEnrollmentFormOpen(false)}
          courseName={selectedCourse?.title || ''}
          coursePrice={selectedCourse?.price}
          courseId={selectedCourse?.id}
        />

        {/* Course Details Modal */}
        <CourseDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          course={selectedCourse as Course}
          onEnroll={() => selectedCourse && handleEnrollClick(selectedCourse)}
        />

        {/* Course Recordings Modal */}
        <CourseRecordingsModal
          open={recordingsModalOpen}
          onOpenChange={setRecordingsModalOpen}
          courseId={selectedCourse?.id || 0}
          courseTitle={selectedCourse?.title || ''}
        />
      </div>
    </section>
  );
};
