import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar, Footer } from '@/components/navigation';
import { AIAssessmentWizard } from '@/components/ai-assessment/AIAssessmentWizard';
import { AIAssessmentWizardAdaptive } from '@/components/ai-assessment/AIAssessmentWizardAdaptive';
import { useAuth } from '@/hooks/useAuth';

// Feature flag: read from environment variable
// Defaults to true if not set
const USE_ADAPTIVE_ASSESSMENT = import.meta.env.VITE_USE_ADAPTIVE_ASSESSMENT !== 'false';
import {
  Brain,
  Sparkles,
  TrendingUp,
  Clock,
  Users,
  Award,
  BarChart3,
  Target,
  ArrowRight,
  CheckCircle,
  Star,
  Play,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Clock,
    title: '10-15 Minutes',
    description: 'Quick, comprehensive assessment of your AI tool usage',
  },
  {
    icon: BarChart3,
    title: 'Detailed Analysis',
    description: 'Get insights across 8 key AI usage categories',
  },
  {
    icon: Users,
    title: 'Peer Comparison',
    description: 'See how you compare to others in your field',
  },
  {
    icon: Target,
    title: 'Personalized Roadmap',
    description: 'Get a custom plan to increase AI augmentation',
  },
  {
    icon: Award,
    title: 'Earn Badges',
    description: 'Unlock achievements as you improve',
  },
  {
    icon: TrendingUp,
    title: 'Track Progress',
    description: 'Monitor your AI adoption journey over time',
  },
];

const CATEGORIES = [
  'Daily Productivity',
  'Content Creation',
  'Learning & Research',
  'Communication',
  'Data & Analytics',
  'Automation',
  'Creative Tools',
  'Development & Coding',
];

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Marketing Manager',
    score: '78%',
    level: 'Advanced',
    quote:
      'The assessment opened my eyes to AI tools I never knew existed. My productivity has increased 40% since implementing the recommendations!',
  },
  {
    name: 'Alex Rodriguez',
    role: 'Student',
    score: '52%',
    level: 'Intermediate',
    quote:
      'As a student, this helped me discover AI study tools that have transformed how I learn. My grades have improved significantly!',
  },
  {
    name: 'Priya Patel',
    role: 'Startup Founder',
    score: '89%',
    level: 'Expert',
    quote:
      "The peer comparison showed me where my team was falling behind. We've now automated 60% of our repetitive tasks!",
  },
];

export default function AIAssessment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAssessment, setShowAssessment] = React.useState(false);

  const startAssessment = () => {
    if (!user) {
      // Require sign-in for assessment
      navigate('/auth', {
        state: {
          returnTo: '/ai-assessment',
          message: 'Please sign in to take the assessment and save your results.',
        },
      });
    } else {
      setShowAssessment(true);
    }
  };

  if (showAssessment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          {USE_ADAPTIVE_ASSESSMENT ? <AIAssessmentWizardAdaptive /> : <AIAssessmentWizard />}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section
        className="relative py-20 px-4 bg-gradient-hero overflow-hidden"
        aria-labelledby="hero-heading"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5" aria-hidden="true" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <Badge
              className="mb-4 px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20"
              aria-label="New feature"
            >
              <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
              New Assessment Tool
            </Badge>
            <h1 id="hero-heading" className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Discover Your
              <span className="gradient-text block mt-2">AI Augmentation Level</span>
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
              Take our comprehensive assessment to understand how AI-augmented you are in your daily
              work and get a personalized roadmap to increase your productivity with AI tools.
            </p>
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              aria-label="Assessment actions"
            >
              <Button
                onClick={startAssessment}
                size="lg"
                className="btn-hero text-lg px-8 py-6"
                aria-label="Start free AI assessment"
              >
                <Play className="mr-2 h-5 w-5" aria-hidden="true" />
                Start Free Assessment
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() =>
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                }
                aria-label="Learn more about the assessment"
              >
                Learn More
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
            <p className="text-sm text-white/60 mt-4">
              Sign in required • No credit card needed • Takes 10-15 minutes • Instant results
            </p>
          </div>

          {/* Stats Bar */}
          <section
            className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-12"
            aria-label="Assessment statistics"
          >
            <div className="text-center">
              <div
                className="text-3xl font-bold text-white"
                aria-label="Over 5,000 assessments taken"
              >
                5,000+
              </div>
              <div className="text-sm text-white/60">Assessments Taken</div>
            </div>
            <div className="text-center">
              <div
                className="text-3xl font-bold text-white"
                aria-label="92 percent user satisfaction"
              >
                92%
              </div>
              <div className="text-sm text-white/60">User Satisfaction</div>
            </div>
            <div className="text-center">
              <div
                className="text-3xl font-bold text-white"
                aria-label="40 percent average productivity gain"
              >
                40%
              </div>
              <div className="text-sm text-white/60">Avg. Productivity Gain</div>
            </div>
          </section>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background" aria-labelledby="features-heading">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 id="features-heading" className="text-3xl font-bold mb-4">
              Why Take This Assessment?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get actionable insights to transform your productivity with AI
            </p>
          </div>

          <ul
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            aria-label="Assessment features"
          >
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <li key={index} className="list-none">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div
                      className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4"
                      aria-hidden="true"
                    >
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple steps to discover your AI augmentation level
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              {
                step: '1',
                title: 'Profile Setup',
                description: 'Tell us about yourself to personalize your experience',
              },
              {
                step: '2',
                title: 'Answer Questions',
                description: 'Complete our comprehensive questionnaire about your AI tool usage',
              },
              {
                step: '3',
                title: 'Get Your Score',
                description: 'Receive instant analysis with your AI augmentation percentage',
              },
              {
                step: '4',
                title: 'View Insights',
                description: 'Understand your strengths and areas for improvement',
              },
              {
                step: '5',
                title: 'Follow Roadmap',
                description: 'Get personalized recommendations to boost your AI usage',
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Assessed */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What We Assess</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive evaluation across all aspects of AI tool usage
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((category, index) => (
              <Card key={index} className="p-4 text-center hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className="font-medium text-sm">{category}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See how others have benefited from the AI assessment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                    <Badge variant={testimonial.level === 'Expert' ? 'default' : 'secondary'}>
                      {testimonial.score}
                    </Badge>
                  </div>
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm italic">"{testimonial.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to Discover Your AI Potential?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands who have already taken the first step towards AI-powered productivity
          </p>
          <Button onClick={startAssessment} size="lg" className="btn-hero text-lg px-8 py-6">
            <Brain className="mr-2 h-5 w-5" />
            {user ? 'Take the Assessment Now' : 'Sign In to Start'}
          </Button>
          {!user && (
            <p className="text-sm text-white/60 mt-4">
              Sign in required to save and track your results
            </p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
