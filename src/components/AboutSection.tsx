import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Award, 
  Globe, 
  TrendingUp, 
  Brain, 
  Shield, 
  Zap, 
  Target,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Heart
} from "lucide-react";

const statistics = [
  { label: "Active Students", value: "5,000+", icon: Users, color: "text-blue-300" },
  { label: "Courses Completed", value: "15,000+", icon: Award, color: "text-green-300" },
  { label: "Countries Reached", value: "150+", icon: Globe, color: "text-purple-300" },
  { label: "Success Rate", value: "94%", icon: TrendingUp, color: "text-orange-300" }
];

const coreValues = [
  {
    title: "Hands-on Learning",
    description: "Practical application and project-based education that you can immediately apply",
    icon: Zap,
    color: "from-yellow-300 to-orange-300",
    features: ["Real-world Projects", "Interactive Sessions", "Immediate Application", "Skill Building"]
  },
  {
    title: "Ethical AI",
    description: "Responsible AI development and deployment principles for a better future",
    icon: Shield,
    color: "from-green-300 to-emerald-300",
    features: ["Academic Integrity", "Responsible Usage", "Privacy Protection", "Fair AI Practices"]
  },
  {
    title: "Future-ready Skills",
    description: "Curriculum aligned with industry trends and emerging AI technologies",
    icon: Brain,
    color: "from-purple-300 to-indigo-300",
    features: ["Industry Alignment", "Latest Technologies", "Career Focused", "Market Relevant"]
  },
  {
    title: "Practical Applications",
    description: "Real-world problem-solving approaches that make AI accessible to everyone",
    icon: Target,
    color: "from-blue-300 to-cyan-300",
    features: ["Problem Solving", "Use Cases", "Implementation", "Results Driven"]
  }
];

const achievements = [
  "Industry-recognized AI education leader",
  "Partnership with leading tech companies",
  "Featured in major educational publications",
  "Award-winning curriculum design",
  "Global accessibility and inclusion",
  "Continuous innovation and improvement"
];

const learningOutcomes = [
  {
    title: "Master AI Fundamentals",
    description: "Understanding LLMs, AI agents, and prompt engineering",
    progress: 95
  },
  {
    title: "Immediate Academic Impact", 
    description: "Apply AI to real homework, essays, research, and exam preparation",
    progress: 88
  },
  {
    title: "Boost Productivity",
    description: "Practical hands-on usage of various Generative AI Tools",
    progress: 92
  },
  {
    title: "Ethical AI Usage",
    description: "Build responsible AI habits and maintain academic integrity",
    progress: 96
  }
];

export function AboutSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-6 py-3 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-primary font-medium">About Aiborg™</span>
          </div>
          
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">Revolutionizing AI Education</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            We're democratizing AI education through innovative, accessible, and practical learning experiences. 
            Our mission is to create AI-augmented humans who can thrive in the future economy while maintaining 
            ethical standards and human values.
          </p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {statistics.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6 text-center hover:shadow-primary transition-all duration-300 group">
                <div className="mb-4">
                  <Icon className={`h-8 w-8 mx-auto ${stat.color} group-hover:scale-110 transition-transform`} />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            );
          })}
        </div>

        {/* Mission Statement */}
        <Card className="mb-20 p-8 md:p-12 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 border-primary/20">
          <div className="text-center max-w-4xl mx-auto">
            <h3 className="font-display text-3xl font-bold mb-6">Our Mission</h3>
            <blockquote className="text-lg md:text-xl text-muted-foreground leading-relaxed italic mb-6">
              "To empower individuals and organizations with practical AI knowledge that enhances human 
              capability while maintaining ethical standards. We believe AI should augment human potential, 
              not replace it."
            </blockquote>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Heart className="h-5 w-5" />
              <span className="font-medium">Founded on human-centered AI principles</span>
            </div>
          </div>
        </Card>

        {/* Core Values */}
        <div className="mb-20">
          <h3 className="font-display text-3xl font-bold text-center mb-12">Our Core Values</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {coreValues.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="p-8 hover:shadow-primary transition-all duration-300 group">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${value.color} p-4 mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h4 className="font-display font-bold text-xl mb-3">{value.title}</h4>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{value.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {value.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Learning Outcomes */}
        <div className="mb-20">
          <h3 className="font-display text-3xl font-bold text-center mb-12">Proven Learning Outcomes</h3>
          <Card className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {learningOutcomes.map((outcome, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{outcome.title}</h4>
                    <Badge variant="secondary">{outcome.progress}%</Badge>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-primary h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${outcome.progress}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{outcome.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Achievements */}
        <div className="mb-20">
          <h3 className="font-display text-3xl font-bold text-center mb-12">Our Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement, index) => (
              <Card key={index} className="p-6 hover:shadow-primary transition-all duration-300 group">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-muted-foreground leading-relaxed">{achievement}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Platform Features */}
        <Card className="p-8 md:p-12 bg-gradient-to-r from-secondary/10 to-accent/10 border-secondary/20">
          <div className="text-center mb-8">
            <h3 className="font-display text-3xl font-bold mb-4">Why Choose Aiborg™?</h3>
            <p className="text-muted-foreground">Advanced features that set us apart in AI education</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Comprehensive Curriculum</h4>
              <p className="text-sm text-muted-foreground">From fundamentals to advanced applications, covering all aspects of AI</p>
            </div>
            
            <div className="text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Global Community</h4>
              <p className="text-sm text-muted-foreground">Connect with learners and experts from 150+ countries worldwide</p>
            </div>
            
            <div className="text-center">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Practical Focus</h4>
              <p className="text-sm text-muted-foreground">Real-world projects and immediate application of skills</p>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <Button size="lg" className="btn-hero group">
              Start Your AI Journey
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </Card>

        {/* Call to Action */}
        <div className="text-center mt-20">
          <h3 className="font-display text-2xl font-bold mb-4">Ready to Become AI-Augmented?</h3>
          <p className="text-muted-foreground mb-6">
            Join thousands of learners who are already transforming their careers with AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="btn-hero">
              Browse Courses
            </Button>
            <Button size="lg" variant="outline" className="btn-outline-ai">
              Download Brochure
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}