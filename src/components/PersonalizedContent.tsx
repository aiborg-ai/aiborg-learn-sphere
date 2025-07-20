import React from 'react';
import { usePersonalization, AUDIENCE_CONFIG } from '@/contexts/PersonalizationContext';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Gamepad2, 
  Trophy, 
  Shield, 
  Rocket, 
  Users, 
  MessageSquare, 
  Award, 
  Network, 
  Briefcase, 
  BarChart, 
  Settings, 
  TrendingUp 
} from 'lucide-react';

interface PersonalizedContentProps {
  section: 'hero' | 'programs' | 'about' | 'contact';
  children?: React.ReactNode;
}

export const PersonalizedContent: React.FC<PersonalizedContentProps> = ({ section, children }) => {
  const { selectedAudience, getPersonalizedContent, getPersonalizedStyles } = usePersonalization();

  if (!selectedAudience) {
    return <>{children}</>;
  }

  const config = AUDIENCE_CONFIG[selectedAudience];

  // Feature icons mapping
  const getFeatureIcon = (feature: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      gamification: Gamepad2,
      parentalControls: Shield,
      simpleNavigation: Trophy,
      cartoonIllustrations: Gamepad2,
      progressBadges: Trophy,
      careerGuidance: Rocket,
      codingChallenges: MessageSquare,
      peerCollaboration: Users,
      collegePreperation: Award,
      discussionForums: MessageSquare,
      certifications: Award,
      cpeCredits: Trophy,
      networking: Network,
      expertWebinars: Users,
      portfolioBuilder: Briefcase,
      industrySpecific: Briefcase,
      analytics: BarChart,
      teamManagement: Users,
      roiCalculators: TrendingUp,
      customTraining: Settings,
      hrIntegration: Network,
      dashboard: BarChart
    };
    return iconMap[feature] || Trophy;
  };

  if (section === 'hero' && config.features) {
    return (
      <Card className={`mt-8 p-6 rounded-2xl border animate-fade-in ${getPersonalizedStyles({
        primary: "bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-200 dark:from-yellow-950/20 dark:to-orange-950/20 dark:border-orange-800",
        secondary: "bg-gradient-to-br from-blue-50 to-purple-50 border-purple-200 dark:from-blue-950/20 dark:to-purple-950/20 dark:border-purple-800",
        professional: "bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200 dark:from-slate-950/20 dark:to-gray-950/20 dark:border-slate-800",
        business: "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-950/20 dark:to-teal-950/20 dark:border-emerald-800",
        default: "bg-card/50 border-primary/20"
      })}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getPersonalizedStyles({
            primary: "bg-gradient-to-br from-yellow-400 to-orange-400",
            secondary: "bg-gradient-to-br from-blue-400 to-purple-400",
            professional: "bg-gradient-to-br from-slate-400 to-gray-400",
            business: "bg-gradient-to-br from-emerald-400 to-teal-400",
            default: "bg-primary"
          })}`}>
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-primary">
            {getPersonalizedContent({
              primary: "🎉 Awesome! Let's make learning AI super fun!",
              secondary: "🚀 Great choice! Let's level up your AI skills!",
              professional: "✨ Excellent! Let's advance your AI expertise",
              business: "💼 Perfect! Let's transform your organization with AI",
              default: "Perfect! Let's tailor your AI learning experience"
            })}
          </h3>
        </div>
        
        <p className="text-muted-foreground mb-4">
          {getPersonalizedContent({
            primary: "Get ready for an amazing adventure with AI! We'll learn through fun games, colorful activities, and exciting challenges designed just for you.",
            secondary: "Dive into cutting-edge AI technology with hands-on projects, career guidance, and skills that will prepare you for the future.",
            professional: "Access industry-leading AI training with certifications, expert insights, and practical applications for your career growth.",
            business: "Unlock AI's potential for your organization with enterprise solutions, team training, and measurable business impact.",
            default: "Experience personalized AI education tailored to your needs and goals."
          })}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(config.features)
            .filter(([_, enabled]) => enabled)
            .slice(0, 4)
            .map(([feature, _]) => {
              const Icon = getFeatureIcon(feature);
              return (
                <div key={feature} className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                </div>
              );
            })}
        </div>

        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {config.language.level.toUpperCase()} LEVEL
            </Badge>
            <Badge variant="outline" className="text-xs">
              {config.theme.toUpperCase()} THEME
            </Badge>
          </div>
        </div>
      </Card>
    );
  }

  return <>{children}</>;
};

export default PersonalizedContent;