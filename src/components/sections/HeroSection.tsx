import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  GraduationCap,
  Briefcase,
  Building2,
  ArrowRight,
  Sparkles,
  BarChart3,
} from '@/components/ui/icons';
import { usePersonalization } from '@/contexts/PersonalizationContext';
import { Link } from 'react-router-dom';
import { HeroImage } from '@/components/shared/OptimizedImage';

const audiences = [
  {
    id: 'primary' as const,
    title: 'Young Learners',
    subtitle: 'Ages 8-11',
    description: 'Fun, interactive AI learning for young minds',
    icon: GraduationCap,
    image: '/lovable-uploads/fd4d8f4b-a05e-497b-baa1-b38b134dddd3.webp',
    color: 'from-pink-300 to-purple-300',
    features: ['Visual Learning', 'Games & Puzzles', 'Safe Environment', 'Parent Dashboard'],
  },
  {
    id: 'secondary' as const,
    title: 'Teenagers',
    subtitle: 'Ages 12-18',
    description: 'Advanced AI concepts for future innovators',
    icon: Brain,
    image: '/lovable-uploads/a7179cc3-d562-480e-bb31-34c805ea7621.webp',
    color: 'from-blue-300 to-indigo-300',
    features: ['Coding Projects', 'AI Ethics', 'Career Paths', 'Peer Learning'],
  },
  {
    id: 'professional' as const,
    title: 'Professionals',
    subtitle: 'Career Growth',
    description: 'AI skills for advancing your career',
    icon: Briefcase,
    image: '/lovable-uploads/ce815291-0430-4cf1-b0ca-c223bc962ef6.webp',
    color: 'from-green-300 to-emerald-300',
    features: ['Industry Skills', 'Certifications', 'Real Projects', 'Networking'],
  },
  {
    id: 'business' as const,
    title: 'SMEs',
    subtitle: 'Enterprise',
    description: 'Transform your business with AI training',
    icon: Building2,
    image: '/lovable-uploads/ea754477-6d41-40d8-824f-5d0275f282c7.webp',
    color: 'from-orange-300 to-red-300',
    features: ['Team Training', 'Custom Programs', 'ROI Tracking', 'Expert Support'],
  },
];

export function HeroSection() {
  const { selectedAudience, setSelectedAudience, getPersonalizedContent, getPersonalizedStyles } =
    usePersonalization();

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
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-white/20">
            <Sparkles className="h-5 w-5 text-secondary animate-pulse" />
            <span className="text-white font-medium">Convert AI Opportunity !</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-bold mb-4 md:mb-6">
            <span className="block text-secondary">
              aiborg
              <sup className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-secondary/80 font-normal ml-1">
                ™
              </sup>
            </span>
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl text-accent font-semibold mb-3 md:mb-4 font-display drop-shadow-sm">
            AI-augmented Human
          </p>

          <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 md:mb-12 leading-relaxed px-4 sm:px-0">
            Transform your future with cutting-edge AI education. Personalized learning paths for
            every age and profession.
          </p>

          {!selectedAudience && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="btn-hero group">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" className="btn-outline-ai">
                Watch Demo
              </Button>
            </div>
          )}

          {/* AI Assessment CTA */}
          <div className="mb-12 md:mb-16 px-4 sm:px-0">
            <Link to="/ai-assessment">
              <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 hover:border-yellow-500/50 active:border-yellow-500/60 transition-all duration-300 transform hover:scale-105 active:scale-95 max-w-2xl mx-auto">
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 sm:justify-between">
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="p-2 sm:p-3 rounded-full bg-yellow-500/20 flex-shrink-0">
                      <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2 flex-wrap">
                        <span>Discover Your AI Augmentation Level</span>
                        <Badge className="bg-red-500 text-white text-xs">NEW</Badge>
                      </h3>
                      <p className="text-xs sm:text-sm text-white/80 mt-1">
                        Take our free assessment to measure your AI tool adoption
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/60 hidden sm:block flex-shrink-0" />
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Audience Selection */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-center text-white mb-3 md:mb-4">
            Choose Your Learning Journey
          </h2>
          <p className="text-base sm:text-lg text-white/80 text-center mb-8 md:mb-12 px-4 sm:px-0">
            Discover personalized AI education programs
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 md:mb-12">
            {audiences.map(audience => {
              const Icon = audience.icon;
              const isSelected = selectedAudience === audience.id;

              return (
                <Card
                  key={audience.id}
                  className={`relative overflow-hidden cursor-pointer transition-all duration-500 group hover:scale-105 hover:shadow-2xl active:scale-95 ${
                    isSelected ? 'ring-2 ring-primary shadow-lg scale-105' : ''
                  }`}
                  onClick={() => setSelectedAudience(audience.id)}
                >
                  {/* Background Image */}
                  <div className="relative h-64 sm:h-72 md:h-80 overflow-hidden">
                    <HeroImage
                      src={audience.image}
                      alt={`${audience.title} representative`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      priority={true}
                    />

                    {/* Gradient Overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 ${
                        isSelected ? 'opacity-60' : 'opacity-40 group-hover:opacity-60'
                      }`}
                    ></div>

                    {/* Icon Badge */}
                    <div
                      className={`absolute top-4 right-4 w-12 h-12 rounded-full bg-gradient-to-br ${audience.color} p-3 shadow-lg transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                      <Badge
                        variant="secondary"
                        className="self-start mb-2 bg-white/20 backdrop-blur-sm text-white border-white/30"
                      >
                        {audience.subtitle}
                      </Badge>

                      <h3 className="font-display font-bold text-2xl mb-2">{audience.title}</h3>

                      {/* Hover Content */}
                      <div
                        className={`transition-all duration-300 ${
                          isSelected
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'
                        }`}
                      >
                        <p className="text-white/90 text-sm mb-4 leading-relaxed">
                          {audience.description}
                        </p>

                        <div className="space-y-2 mb-4">
                          {audience.features.slice(0, 3).map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-secondary rounded-full"></div>
                              <span className="text-xs text-white/80">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <Button
                          size="sm"
                          className="w-full btn-hero"
                          onClick={e => {
                            e.stopPropagation();
                            // Set URL hash to pass audience filter
                            window.location.hash = `audience-${audience.id}`;
                            // Scroll to section with a slight delay to ensure hash is processed
                            setTimeout(() => {
                              const element = document.getElementById('training-programs');
                              if (element) {
                                element.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'start',
                                });
                              }
                            }, 200);
                          }}
                        >
                          Explore Programs
                          <ArrowRight className="ml-2 h-4 w-4 text-white" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {selectedAudience && (
            <div className="text-center">
              <div
                className={`inline-flex items-center gap-2 backdrop-blur-sm rounded-full px-6 py-3 ${getPersonalizedStyles(
                  {
                    primary:
                      'bg-gradient-to-r from-pink-200/25 to-peach-200/25 border border-pink-300/40',
                    secondary:
                      'bg-gradient-to-r from-blue-200/25 to-purple-200/25 border border-purple-300/40',
                    professional:
                      'bg-gradient-to-r from-slate-200/25 to-gray-200/25 border border-slate-300/40',
                    business:
                      'bg-gradient-to-r from-green-200/25 to-teal-200/25 border border-emerald-300/40',
                    default: 'bg-white/15 border border-white/25',
                  }
                )}`}
              >
                <Brain className="h-5 w-5 text-primary" />
                <span className="text-white drop-shadow-sm">
                  {getPersonalizedContent({
                    primary: `🎉 Fun learning mode activated for ${audiences.find(a => a.id === selectedAudience)?.title}!`,
                    secondary: `🚀 Advanced learning mode activated for ${audiences.find(a => a.id === selectedAudience)?.title}!`,
                    professional: `✨ Professional training mode activated for ${audiences.find(a => a.id === selectedAudience)?.title}!`,
                    business: `💼 Enterprise mode activated for ${audiences.find(a => a.id === selectedAudience)?.title}!`,
                    default: `Personalized experience for ${audiences.find(a => a.id === selectedAudience)?.title} activated`,
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
