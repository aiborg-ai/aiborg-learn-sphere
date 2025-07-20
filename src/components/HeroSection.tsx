import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, GraduationCap, Briefcase, Building2, ArrowRight, Sparkles } from "lucide-react";
import { usePersonalization, AUDIENCE_CONFIG } from "@/contexts/PersonalizationContext";

const audiences = [
  {
    id: "primary" as const,
    title: "Primary School",
    subtitle: "Ages 6-11",
    description: "Fun, interactive AI learning for young minds",
    icon: GraduationCap,
    color: "from-pink-400 to-purple-500",
    features: ["Visual Learning", "Games & Puzzles", "Safe Environment", "Parent Dashboard"]
  },
  {
    id: "secondary" as const,
    title: "Secondary School", 
    subtitle: "Ages 12-18",
    description: "Advanced AI concepts for future innovators",
    icon: Brain,
    color: "from-blue-400 to-indigo-500",
    features: ["Coding Projects", "AI Ethics", "Career Paths", "Peer Learning"]
  },
  {
    id: "professional" as const,
    title: "Professionals",
    subtitle: "Career Growth",
    description: "AI skills for advancing your career",
    icon: Briefcase,
    color: "from-green-400 to-emerald-500", 
    features: ["Industry Skills", "Certifications", "Real Projects", "Networking"]
  },
  {
    id: "business" as const,
    title: "Business",
    subtitle: "Enterprise",
    description: "Transform your business with AI training",
    icon: Building2,
    color: "from-orange-400 to-red-500",
    features: ["Team Training", "Custom Programs", "ROI Tracking", "Expert Support"]
  }
];

export function HeroSection() {
  const { selectedAudience, setSelectedAudience, getPersonalizedContent, getPersonalizedStyles } = usePersonalization();

  return (
    <section className="relative min-h-screen bg-gradient-hero overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-20 pb-12">
        {/* Main Brand Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-8">
            <Sparkles className="h-5 w-5 text-accent animate-pulse" />
            <span className="text-white font-medium">Revolutionary AI Education Platform</span>
          </div>
          
          <h1 className="font-display text-7xl md:text-8xl lg:text-9xl font-bold mb-6">
            <span className="block text-secondary">aiborg</span>
            <span className="text-sm text-white/80 font-normal">™</span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-accent font-semibold mb-4 font-display">
            AI-augmented Human
          </p>
          
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-12 leading-relaxed">
            Transform your future with cutting-edge AI education. Personalized learning paths 
            for every age and profession.
          </p>

          {!selectedAudience && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button size="lg" className="btn-hero group">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" className="btn-outline-ai">
                Watch Demo
              </Button>
            </div>
          )}
        </div>

        {/* Audience Selection */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center text-white mb-4">
            Choose Your Learning Journey
          </h2>
          <p className="text-lg text-white/80 text-center mb-12">
            Select your audience to discover personalized AI education programs
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {audiences.map((audience) => {
              const Icon = audience.icon;
              const isSelected = selectedAudience === audience.id;
              
              return (
                <Card
                  key={audience.id}
                  className={`audience-card p-6 cursor-pointer transition-all duration-300 ${
                    isSelected ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedAudience(audience.id)}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${audience.color} p-4 mb-4 mx-auto`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="font-display font-bold text-xl text-center mb-2">
                    {audience.title}
                  </h3>
                  
                  <Badge variant="secondary" className="mx-auto mb-3 block w-fit">
                    {audience.subtitle}
                  </Badge>
                  
                  <p className="text-muted-foreground text-center text-sm mb-4">
                    {audience.description}
                  </p>

                  {isSelected && (
                    <div className="mt-4 space-y-2 animate-fade-in">
                      {audience.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                      <Button size="sm" className="w-full mt-4 btn-hero">
                        Explore Programs
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {selectedAudience && (
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 backdrop-blur-sm rounded-full px-6 py-3 ${getPersonalizedStyles({
                primary: "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-orange-300/30",
                secondary: "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-purple-300/30",
                professional: "bg-gradient-to-r from-slate-500/20 to-gray-500/20 border border-slate-300/30",
                business: "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-300/30",
                default: "bg-white/10"
              })}`}>
                <Brain className="h-5 w-5 text-accent" />
                <span className="text-white">
                  {getPersonalizedContent({
                    primary: `🎉 Fun learning mode activated for ${audiences.find(a => a.id === selectedAudience)?.title}!`,
                    secondary: `🚀 Advanced learning mode activated for ${audiences.find(a => a.id === selectedAudience)?.title}!`,
                    professional: `✨ Professional training mode activated for ${audiences.find(a => a.id === selectedAudience)?.title}!`,
                    business: `💼 Enterprise mode activated for ${audiences.find(a => a.id === selectedAudience)?.title}!`,
                    default: `Personalized experience for ${audiences.find(a => a.id === selectedAudience)?.title} activated`
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}