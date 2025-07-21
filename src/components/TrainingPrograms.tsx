import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePersonalization, AUDIENCE_CONFIG, Audience } from "@/contexts/PersonalizationContext";
import { EnrollmentForm } from "@/components/EnrollmentForm";
import { CourseDetailsModal } from "@/components/CourseDetailsModal";
import { useCourses, Course } from "@/hooks/useCourses";
import { 
  Search, 
  Filter, 
  Clock, 
  Calendar, 
  Award, 
  ArrowRight,
  BookOpen,
  Video,
  Monitor,
  MapPin,
  Baby,
  GraduationCap,
  Briefcase,
  Building2,
  Loader2,
  AlertCircle
} from "lucide-react";

export const TrainingPrograms = () => {
  const { courses, loading, error } = useCourses();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedLevel, setSelectedLevel] = useState("All Levels");
  const [showFilters, setShowFilters] = useState(false);
  const [enrollmentFormOpen, setEnrollmentFormOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [currentlyEnrolling, setCurrentlyEnrolling] = useState(false);
  const { selectedAudience, setSelectedAudience } = usePersonalization();

  // Convert database courses to the format expected by the component
  const programs = courses.map(course => ({
    id: course.id,
    title: course.title,
    description: course.description,
    audience: course.audience,
    mode: course.mode,
    duration: course.duration,
    price: course.price,
    level: course.level,
    startDate: course.start_date,
    features: course.features,
    category: course.category,
    keywords: course.keywords,
    prerequisites: course.prerequisites
  }));

  // Map database audience names to internal IDs for filtering
  const audienceMapping = {
    "Young Learners": "primary",
    "Teenagers": "secondary", 
    "Professionals": "professional",
    "SMEs": "business"
  };

  // Filter programs based on selected audience and search criteria
  const filteredPrograms = programs.filter((program) => {
    const programAudienceId = audienceMapping[program.audience as keyof typeof audienceMapping];
    const matchesAudience = selectedAudience === "All" || programAudienceId === selectedAudience;
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All Categories" || program.category === selectedCategory;
    const matchesLevel = selectedLevel === "All Levels" || program.level === selectedLevel;
    const matchesCurrentlyEnrolling = !currentlyEnrolling || (program.startDate && program.startDate !== "Ongoing" && program.startDate !== "Flexible");
    
    return matchesAudience && matchesSearch && matchesCategory && matchesLevel && matchesCurrentlyEnrolling;
  });

  // Get unique categories and levels for filter options
  const categories = ["All Categories", ...Array.from(new Set(programs.map(p => p.category)))];
  const levels = ["All Levels", ...Array.from(new Set(programs.map(p => p.level)))];

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case "Young Learners": return Baby;
      case "Teenagers": return GraduationCap;
      case "Professionals": return Briefcase;
      case "SMEs": return Building2;
      default: return BookOpen;
    }
  };

  const handleEnrollClick = (program: any) => {
    setSelectedCourse(program as Course);
    setEnrollmentFormOpen(true);
  };

  const handleDetailsClick = (program: any) => {
    setSelectedCourse(program as Course);
    setDetailsModalOpen(true);
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
          <Button onClick={() => window.location.reload()}>Try Again</Button>
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
        <Tabs value={selectedAudience} onValueChange={(value) => setSelectedAudience(value as Audience)} className="mb-8">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto">
            {(Object.keys(AUDIENCE_CONFIG) as Audience[]).map((audience) => {
              const config = AUDIENCE_CONFIG[audience];
              const displayName = 'displayName' in config ? config.displayName : config.name;
              const Icon = audience === "All" ? BookOpen : getAudienceIcon(displayName);
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={currentlyEnrolling ? "default" : "outline"}
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
                  {categories.map((category) => (
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
                  {levels.map((level) => (
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
          {selectedAudience !== "All" && (() => {
            const config = AUDIENCE_CONFIG[selectedAudience];
            const displayName = config && 'displayName' in config ? config.displayName : config?.name;
            return ` for ${displayName} audience`;
          })()}
          {currentlyEnrolling && " (Currently Enrolling)"}
        </div>

        {/* Programs Grid */}
        {filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No programs found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters to find relevant programs.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => {
              const AudienceIcon = getAudienceIcon(program.audience);
              return (
                <Card key={program.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <AudienceIcon className="h-3 w-3" />
                        {program.audience}
                      </Badge>
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
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">{program.price}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDetailsClick(program)}
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEnrollClick(program)}
                          className="group/btn"
                        >
                          Enroll
                          <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Enrollment Form Modal */}
        <EnrollmentForm
          isOpen={enrollmentFormOpen}
          onClose={() => setEnrollmentFormOpen(false)}
          courseName={selectedCourse?.title || ""}
          coursePrice={selectedCourse?.price}
        />

        {/* Course Details Modal */}
        <CourseDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          course={selectedCourse as any}
          onEnroll={() => selectedCourse && handleEnrollClick(selectedCourse)}
        />
      </div>
    </section>
  );
};