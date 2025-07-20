import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePersonalization, AUDIENCE_CONFIG } from "@/contexts/PersonalizationContext";
import { 
  Search, 
  Filter, 
  Clock, 
  Users, 
  Calendar, 
  Star, 
  Award, 
  ArrowRight,
  BookOpen,
  Video,
  Monitor,
  MapPin
} from "lucide-react";

const programs = [
  {
    id: 1,
    title: "AI Fundamentals: Understanding LLMs",
    description: "Master the basics of Large Language Models and AI agents through hands-on learning",
    audience: "Professional",
    mode: "Online",
    duration: "6 weeks",
    price: "£49",
    rating: 4.9,
    students: 1250,
    level: "Beginner",
    startDate: "2025-02-01",
    features: ["Live Sessions", "Practical Projects", "Certificate", "Community Access"],
    instructor: "Dr. Sarah Chen",
    category: "AI Fundamentals"
  },
  {
    id: 2,
    title: "Immediate Academic Impact with AI",
    description: "Apply AI to real homework, essays, research, and exam preparation to boost grades in STEM and other subjects",
    audience: "Secondary",
    mode: "Hybrid",
    duration: "4 weeks", 
    price: "£39",
    rating: 4.8,
    students: 890,
    level: "Intermediate",
    startDate: "2025-02-15",
    features: ["Study Groups", "AI Tools Training", "Academic Support", "Progress Tracking"],
    instructor: "Prof. James Wilson",
    category: "Academic Enhancement"
  },
  {
    id: 3,
    title: "Boost Productivity with AI Tools",
    description: "Practical hands-on usage of various Generative AI Tools to enhance daily productivity",
    audience: "Professional",
    mode: "Online",
    duration: "3 weeks",
    price: "£29",
    rating: 4.7,
    students: 2100,
    level: "Beginner",
    startDate: "2025-02-08",
    features: ["Tool Mastery", "Workflow Optimization", "Templates", "Support Community"],
    instructor: "Alex Rodriguez",
    category: "Productivity"
  },
  {
    id: 4,
    title: "Ethical AI for Young Minds", 
    description: "Build responsible AI habits and maintain academic integrity while learning foundational concepts",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.9,
    students: 650,
    level: "Beginner", 
    startDate: "2025-03-01",
    features: ["Interactive Games", "Parent Dashboard", "Safe Learning", "Digital Citizenship"],
    instructor: "Ms. Emma Thompson",
    category: "Ethics & Safety"
  },
  {
    id: 5,
    title: "AI for Business Transformation",
    description: "Enterprise-level AI implementation strategies and ROI optimization for business leaders",
    audience: "Business",
    mode: "Virtual",
    duration: "8 weeks",
    price: "£199",
    rating: 4.8,
    students: 340,
    level: "Advanced",
    startDate: "2025-02-20",
    features: ["Case Studies", "ROI Calculator", "Team Training", "Executive Briefings"],
    instructor: "Dr. Michael Foster",
    category: "Business Strategy"
  },
  {
    id: 6,
    title: "Foster Creativity with AI",
    description: "Use Generative AI Tools for Creating Art, Music and Videos while exploring creative possibilities",
    audience: "Secondary",
    mode: "Online",
    duration: "5 weeks",
    price: "£35",
    rating: 4.6,
    students: 780,
    level: "Intermediate",
    startDate: "2025-02-25",
    features: ["Creative Projects", "AI Art Tools", "Portfolio Building", "Peer Showcase"],
    instructor: "Sofia Martinez",
    category: "Creative AI"
  }
];

const getModeIcon = (mode: string) => {
  switch (mode) {
    case "Online": return <Monitor className="h-4 w-4" />;
    case "Virtual": return <Video className="h-4 w-4" />;
    case "Hybrid": return <BookOpen className="h-4 w-4" />;
    default: return <MapPin className="h-4 w-4" />;
  }
};

const getAudienceColor = (audience: string) => {
  switch (audience) {
    case "Primary": return "bg-pink-100 text-pink-800";
    case "Secondary": return "bg-blue-100 text-blue-800";
    case "Professional": return "bg-green-100 text-green-800";
    case "Business": return "bg-orange-100 text-orange-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export function TrainingPrograms() {
  const { selectedAudience: globalAudience, getPersonalizedContent, getPersonalizedStyles } = usePersonalization();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAudience, setSelectedAudience] = useState(globalAudience || "all");
  const [selectedMode, setSelectedMode] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAudience = selectedAudience === "all" || program.audience === selectedAudience;
    const matchesMode = selectedMode === "all" || program.mode === selectedMode;
    const matchesLevel = selectedLevel === "all" || program.level === selectedLevel;
    
    return matchesSearch && matchesAudience && matchesMode && matchesLevel;
  });

  return (
    <section 
      id="training-programs" 
      className={`py-20 ${getPersonalizedStyles({
      primary: "bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/10 dark:to-orange-950/10",
      secondary: "bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/10 dark:to-purple-950/10",
      professional: "bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-950/10 dark:to-gray-950/10",
      business: "bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/10",
      default: "bg-background"
    })}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">
              {getPersonalizedContent({
                primary: "🎓 Fun AI Learning Adventures",
                secondary: "🚀 AI Training Programs",
                professional: "🎯 Professional AI Certification",
                business: "💼 Enterprise AI Training Solutions",
                default: "Training Programs"
              })}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {getPersonalizedContent({
              primary: "Discover amazing AI adventures through fun games, colorful activities, and interactive learning designed just for you!",
              secondary: "Master cutting-edge AI technology with hands-on projects, career guidance, and future-ready skills development.",
              professional: "Advance your career with industry-leading AI certifications, expert insights, and practical applications.",
              business: "Transform your organization with comprehensive AI training solutions, team development, and measurable business impact.",
              default: "Discover our comprehensive AI education programs designed for every learning journey. New batches start every month with flexible learning options."
            })}
          </p>
        </div>

        {/* Core Learning Objectives Banner */}
        <Card className="mb-12 p-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <h3 className="font-display text-2xl font-bold mb-6 text-center">Core Learning Objectives</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🎯", title: "Master AI Fundamentals", desc: "Understanding LLMs, AI agents, and prompt engineering" },
              { icon: "📚", title: "Immediate Academic Impact", desc: "Apply AI to real homework, essays, research, and exam preparation" },
              { icon: "⚡", title: "Boost Productivity", desc: "Practical hands-on usage of various Generative AI Tools" },
              { icon: "🤖", title: "Ethical AI Usage", desc: "Build responsible AI habits and maintain academic integrity" }
            ].map((objective, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl mb-3">{objective.icon}</div>
                <h4 className="font-semibold mb-2">{objective.title}</h4>
                <p className="text-sm text-muted-foreground">{objective.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Filters */}
        <div className="bg-card rounded-2xl p-6 mb-12 shadow-sm border">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex items-center gap-2 text-primary">
              <Filter className="h-5 w-5" />
              <span className="font-semibold">Filter Programs:</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedAudience} onValueChange={setSelectedAudience}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audiences</SelectItem>
                  <SelectItem value="Primary">Primary</SelectItem>
                  <SelectItem value="Secondary">Secondary</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedMode} onValueChange={setSelectedMode}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Virtual">Virtual</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* New Batches Info */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Badge variant="secondary" className="px-4 py-2">
            <Calendar className="h-4 w-4 mr-2" />
            New Batches every Month
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            Flexible Learning Options
          </Badge>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPrograms.map((program) => (
            <Card key={program.id} className="course-card">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge className={getAudienceColor(program.audience)}>
                    {program.audience}
                  </Badge>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{program.price}</div>
                    <div className="text-sm text-muted-foreground">per course</div>
                  </div>
                </div>
                
                <h3 className="font-display font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                  {program.title}
                </h3>
                
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  {program.description}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getModeIcon(program.mode)}
                    <span>{program.mode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{program.duration}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{program.rating}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{program.students.toLocaleString()} students</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <Badge variant="outline">{program.level}</Badge>
                  <span className="text-muted-foreground">
                    Starts: {new Date(program.startDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Instructor: {program.instructor}</p>
                <div className="flex flex-wrap gap-1">
                  {program.features.slice(0, 3).map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {program.features.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{program.features.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 btn-hero group">
                  Enroll Now
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button variant="outline" size="sm">
                  Learn More
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredPrograms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No programs found matching your criteria.</p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedAudience("all");
              setSelectedMode("all");
              setSelectedLevel("all");
            }}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* Pricing Notice */}
        <div className="text-center mt-16">
          <Card className="inline-block p-6 bg-gradient-to-r from-secondary/10 to-accent/10 border-secondary/20">
            <div className="flex items-center gap-2 text-2xl font-bold text-secondary mb-2">
              <Award className="h-6 w-6" />
              £49
            </div>
            <p className="text-sm text-muted-foreground">
              Average course price • Full access • Certification included
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}