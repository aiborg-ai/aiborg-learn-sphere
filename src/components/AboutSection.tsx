import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePersonalization } from "@/contexts/PersonalizationContext";
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

const getCoreValues = (getPersonalizedContent: (content: any) => any) => [
  {
    title: getPersonalizedContent({
      primary: "Learning by Doing",
      secondary: "Hands-on Learning",
      professional: "Practical Application",
      business: "Implementation Excellence",
      default: "Practical Application"
    }),
    description: getPersonalizedContent({
      primary: "Fun activities and cool projects where you get to build awesome AI stuff yourself!",
      secondary: "Interactive projects and real coding that you can show off to friends and use right away",
      professional: "Practical application and project-based education that directly enhances your work performance",
      business: "Strategic implementation of AI solutions that deliver measurable business impact and ROI",
      default: "Practical application and project-based education that directly enhances your work performance"
    }),
    icon: Zap,
    color: "from-yellow-300 to-orange-300",
    features: getPersonalizedContent({
      primary: ["Fun AI Projects", "Cool Experiments", "Build & Create", "Show & Tell"],
      secondary: ["Real Projects", "Code Portfolio", "Creative Apps", "Tech Skills"],
      professional: ["Real-world Projects", "Career Building", "Skill Enhancement", "Portfolio Development"],
      business: ["Enterprise Solutions", "Team Training", "Process Optimization", "Performance Metrics"],
      default: ["Real-world Projects", "Career Building", "Skill Enhancement", "Portfolio Development"]
    })
  },
  {
    title: getPersonalizedContent({
      primary: "Being Good with AI",
      secondary: "Responsible AI",
      professional: "Ethical AI Practices",
      business: "AI Governance & Compliance",
      default: "Ethical AI Practices"
    }),
    description: getPersonalizedContent({
      primary: "Learning how to use AI in the right way, being fair and kind to everyone",
      secondary: "Understanding how to use AI responsibly and make sure it helps everyone fairly",
      professional: "Professional standards for responsible AI development and deployment in workplace environments",
      business: "Comprehensive AI governance frameworks ensuring regulatory compliance and ethical business practices",
      default: "Professional standards for responsible AI development and deployment in workplace environments"
    }),
    icon: Shield,
    color: "from-green-300 to-emerald-300",
    features: getPersonalizedContent({
      primary: ["Be Fair & Kind", "Help Everyone", "Stay Safe", "Do the Right Thing"],
      secondary: ["Fair Use", "Digital Ethics", "Privacy Respect", "Honest Work"],
      professional: ["Professional Ethics", "Workplace Standards", "Data Privacy", "Responsible Deployment"],
      business: ["Regulatory Compliance", "Risk Management", "Corporate Governance", "Stakeholder Trust"],
      default: ["Professional Ethics", "Workplace Standards", "Data Privacy", "Responsible Deployment"]
    })
  },
  {
    title: getPersonalizedContent({
      primary: "Super Cool Future Skills",
      secondary: "Future-ready Skills",
      professional: "Industry-Leading Expertise",
      business: "Strategic AI Capabilities",
      default: "Industry-Leading Expertise"
    }),
    description: getPersonalizedContent({
      primary: "Learning the most amazing AI tricks that will make you super smart in the future!",
      secondary: "Master cutting-edge AI technologies that will give you an edge in college and your future career",
      professional: "Advanced AI competencies aligned with current industry demands and emerging market opportunities",
      business: "Executive-level AI strategy and implementation capabilities for competitive organizational advantage",
      default: "Advanced AI competencies aligned with current industry demands and emerging market opportunities"
    }),
    icon: Brain,
    color: "from-purple-300 to-indigo-300",
    features: getPersonalizedContent({
      primary: ["Amazing AI Tricks", "Future Tech", "Be Super Smart", "Wow Your Friends"],
      secondary: ["Latest AI Tools", "College Prep", "Career Advantage", "Innovation Skills"],
      professional: ["Industry Alignment", "Market Relevance", "Career Advancement", "Technical Leadership"],
      business: ["Strategic Planning", "Market Leadership", "Innovation Management", "Competitive Edge"],
      default: ["Industry Alignment", "Market Relevance", "Career Advancement", "Technical Leadership"]
    })
  },
  {
    title: getPersonalizedContent({
      primary: "Solving Real Problems",
      secondary: "Real-world Applications",
      professional: "Professional Solutions",
      business: "Enterprise Applications",
      default: "Professional Solutions"
    }),
    description: getPersonalizedContent({
      primary: "Using AI to help solve everyday problems and make life easier for everyone around you",
      secondary: "Apply AI to solve real challenges in school, hobbies, and prepare for future career success",
      professional: "Develop practical AI solutions that address workplace challenges and improve professional outcomes",
      business: "Deploy enterprise-grade AI applications that solve complex organizational challenges and drive growth",
      default: "Develop practical AI solutions that address workplace challenges and improve professional outcomes"
    }),
    icon: Target,
    color: "from-blue-300 to-cyan-300",
    features: getPersonalizedContent({
      primary: ["Help Family & Friends", "Make Life Easier", "Solve Fun Puzzles", "Create Cool Stuff"],
      secondary: ["School Projects", "Problem Solving", "Creative Solutions", "Future Planning"],
      professional: ["Workplace Solutions", "Process Improvement", "Client Value", "Career Impact"],
      business: ["Revenue Growth", "Cost Reduction", "Market Expansion", "Operational Excellence"],
      default: ["Workplace Solutions", "Process Improvement", "Client Value", "Career Impact"]
    })
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
  const { getPersonalizedContent } = usePersonalization();
  const coreValues = getCoreValues(getPersonalizedContent);
  
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
              {getPersonalizedContent({
                primary: "To help kids learn super cool AI stuff so they can become amazing problem-solvers and help make the world a better place! We want AI to be your best friend that helps you learn and create awesome things.",
                secondary: "To help teenagers master AI skills that will give them superpowers for college and their future careers. We want you to be the person everyone comes to when they need help with cool tech stuff!",
                professional: "To empower working professionals with practical AI knowledge that enhances career performance and opens new opportunities. We believe AI should augment your expertise and accelerate your professional growth.",
                business: "To enable organizational leaders and SMEs with strategic AI capabilities that drive innovation, efficiency, and competitive advantage. We focus on enterprise-grade solutions that deliver measurable business impact and ROI.",
                default: "To empower working professionals with practical AI knowledge that enhances career performance and opens new opportunities. We believe AI should augment your expertise and accelerate your professional growth."
              })}
            </blockquote>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Heart className="h-5 w-5" />
              <span className="font-medium">
                {getPersonalizedContent({
                  primary: "Built with love for young explorers",
                  secondary: "Designed for future innovators",
                  professional: "Founded on career-focused AI principles",
                  business: "Established on enterprise excellence standards",
                  default: "Founded on career-focused AI principles"
                })}
              </span>
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
                    {Array.isArray(value.features) && value.features.map((feature, featureIndex) => (
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