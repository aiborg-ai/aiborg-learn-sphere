/**
 * SME Landing Page
 * Dedicated page for Small and Medium Enterprises with prominent AI-Readiness CTA
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Target,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Users,
  Brain,
  Sparkles,
  BarChart3,
  Lightbulb,
  Shield,
  Clock,
  Award,
  Zap,
  BookOpen,
  LineChart,
  Rocket,
  GraduationCap,
} from 'lucide-react';

// Stats for social proof
const stats = [
  { value: '85%', label: 'of SMEs see ROI within 6 months' },
  { value: '3x', label: 'faster AI adoption with our roadmap' },
  { value: '500+', label: 'SMEs transformed' },
  { value: '94%', label: 'satisfaction rate' },
];

// Benefits of AI Readiness Assessment
const assessmentBenefits = [
  {
    icon: Target,
    title: 'Pinpoint Your Starting Point',
    description:
      'Understand exactly where your organization stands across 6 critical AI readiness dimensions.',
  },
  {
    icon: LineChart,
    title: 'Benchmark Against Peers',
    description: 'Compare your readiness against industry peers and companies of similar size.',
  },
  {
    icon: Lightbulb,
    title: 'Get Actionable Insights',
    description:
      'Receive prioritized recommendations tailored to your business context and constraints.',
  },
  {
    icon: Rocket,
    title: 'Accelerate Your Journey',
    description: 'Connect assessment results directly to curated learning paths for your team.',
  },
];

// AI Readiness Dimensions
const readinessDimensions = [
  {
    name: 'Strategic Alignment',
    description: 'Leadership buy-in & AI vision',
    color: 'bg-blue-500',
  },
  { name: 'Data Maturity', description: 'Data quality & governance', color: 'bg-green-500' },
  { name: 'Tech Infrastructure', description: 'Systems & cloud readiness', color: 'bg-purple-500' },
  { name: 'Human Capital', description: 'Skills & AI literacy', color: 'bg-orange-500' },
  { name: 'Process Maturity', description: 'Documentation & automation', color: 'bg-pink-500' },
  { name: 'Change Readiness', description: 'Culture & adaptability', color: 'bg-cyan-500' },
];

// SME-specific offerings
const smeOfferings = [
  {
    icon: GraduationCap,
    title: 'Team Training Programs',
    description:
      'Upskill your entire workforce with structured AI training programs designed for SME contexts.',
    link: '/courses',
    cta: 'Browse Programs',
  },
  {
    icon: BookOpen,
    title: 'Custom Learning Paths',
    description:
      'Personalized learning journeys based on your assessment results and business goals.',
    link: '/learning-paths',
    cta: 'Explore Paths',
  },
  {
    icon: Users,
    title: 'Enterprise Workshops',
    description:
      'Hands-on workshops and bootcamps for teams to build practical AI skills together.',
    link: '/workshops',
    cta: 'View Workshops',
  },
  {
    icon: Shield,
    title: 'Dedicated Support',
    description:
      'Expert guidance throughout your AI transformation journey with dedicated account managers.',
    link: '/contact',
    cta: 'Get in Touch',
  },
];

// Testimonials
const testimonials = [
  {
    quote:
      'The AI Readiness Assessment gave us a clear roadmap. We went from confusion to clarity in just one session.',
    author: 'Sarah Chen',
    role: 'CEO, TechStart Solutions',
    company: '50 employees',
  },
  {
    quote:
      "Understanding our gaps helped us prioritize training investments. Our team's AI literacy improved 300% in 3 months.",
    author: 'Raj Patel',
    role: 'Head of Innovation',
    company: 'Manufacturing SME',
  },
];

export default function SMELandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section with Primary CTA */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-orange-50 dark:from-primary/5 dark:via-background dark:to-orange-950/20 py-20 lg:py-28">
          {/* Background decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  For Small & Medium Enterprises
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Transform Your Business with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">
                  AI-Powered Growth
                </span>
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Discover where you stand, where you need to go, and how to get there. Our AI
                Readiness Assessment is your first step toward strategic AI adoption.
              </p>

              {/* Primary CTA - Prominent AI Readiness Assessment */}
              <div className="mb-12">
                <Link to="/assessment/ai-readiness">
                  <Card className="bg-gradient-to-r from-primary to-orange-500 border-0 shadow-2xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] max-w-2xl mx-auto overflow-hidden">
                    <CardContent className="p-8">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-shrink-0 p-4 bg-white/20 rounded-2xl">
                          <Target className="h-12 w-12 text-white" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <h2 className="text-2xl md:text-3xl font-bold text-white">
                              Evaluate your AI-Readiness
                            </h2>
                            <Badge className="bg-white/20 text-white border-white/30">Free</Badge>
                          </div>
                          <p className="text-white/90 text-lg">
                            15-minute assessment across 6 dimensions with instant results &
                            personalized roadmap
                          </p>
                        </div>
                        <Button
                          size="lg"
                          className="bg-white text-primary hover:bg-white/90 font-semibold px-8"
                        >
                          Start Now
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why AI Readiness Assessment Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4">
                <Sparkles className="mr-1 h-3 w-3" />
                Why Assess First?
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Start Your AI Journey with Clarity
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Before investing in AI training, understand your organization's unique position and
                needs to maximize your return on investment.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {assessmentBenefits.map((benefit, index) => (
                <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 6 Dimensions of AI Readiness */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-14">
                <Badge variant="outline" className="mb-4">
                  <BarChart3 className="mr-1 h-3 w-3" />
                  Comprehensive Evaluation
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  6 Dimensions of AI Readiness
                </h2>
                <p className="text-lg text-muted-foreground">
                  Our assessment evaluates your organization across six critical areas that
                  determine AI adoption success.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {readinessDimensions.map((dimension, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className={`w-3 h-12 rounded-full ${dimension.color}`} />
                    <div>
                      <h3 className="font-semibold">{dimension.name}</h3>
                      <p className="text-sm text-muted-foreground">{dimension.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Secondary CTA */}
              <div className="mt-10 text-center">
                <Link to="/assessment/ai-readiness">
                  <Button size="lg" className="font-semibold">
                    <Target className="mr-2 h-5 w-5" />
                    Take the Assessment Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground mt-3">
                  Free for all users. Results in under 15 minutes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What Happens After Assessment */}
        <section className="py-20 bg-gradient-to-b from-muted/50 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4">
                <Zap className="mr-1 h-3 w-3" />
                Your Journey
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">From Assessment to Action</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Here's what happens after you complete your AI Readiness Assessment
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/20 hidden md:block" />

                {/* Steps */}
                {[
                  {
                    step: 1,
                    title: 'Get Your Readiness Score',
                    description:
                      'Receive instant scores across all 6 dimensions with detailed breakdown and maturity level.',
                    icon: BarChart3,
                  },
                  {
                    step: 2,
                    title: 'Review Personalized Recommendations',
                    description:
                      'Get prioritized action items categorized by quick wins, short-term, and long-term goals.',
                    icon: Lightbulb,
                  },
                  {
                    step: 3,
                    title: 'Connect to Learning Paths',
                    description:
                      'Access curated courses and training programs that address your specific gaps.',
                    icon: BookOpen,
                  },
                  {
                    step: 4,
                    title: 'Track Your Progress',
                    description:
                      'Retake the assessment periodically to measure improvement and adjust your strategy.',
                    icon: TrendingUp,
                  },
                ].map((item, index) => (
                  <div key={index} className="flex gap-6 mb-8 last:mb-0">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/25">
                        <item.icon className="h-7 w-7" />
                      </div>
                    </div>
                    <div className="flex-1 pt-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-primary">Step {item.step}</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4">
                <Award className="mr-1 h-3 w-3" />
                Success Stories
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">SMEs Trust Our Approach</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-muted/30">
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Sparkles key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <blockquote className="text-lg mb-6 italic">"{testimonial.quote}"</blockquote>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.author}</div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role} • {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* SME Offerings */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4">
                <Brain className="mr-1 h-3 w-3" />
                Complete Solutions
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything Your SME Needs</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From assessment to implementation, we provide comprehensive support for your AI
                transformation journey.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {smeOfferings.map((offering, index) => (
                <Card key={index} className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="p-3 bg-primary/10 rounded-xl w-fit mb-2 group-hover:bg-primary/20 transition-colors">
                      <offering.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{offering.title}</CardTitle>
                    <CardDescription>{offering.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to={offering.link}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                      >
                        {offering.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary to-orange-500 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Unlock Your AI Potential?
              </h2>
              <p className="text-xl text-white/90 mb-10">
                Join 500+ SMEs who have already taken the first step toward AI-powered growth. Your
                free assessment awaits.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/assessment/ai-readiness">
                  <Button
                    size="xl"
                    className="bg-white text-primary hover:bg-white/90 font-semibold px-10"
                  >
                    <Target className="mr-2 h-5 w-5" />
                    Evaluate your AI-Readiness
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button
                    size="xl"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                  >
                    Talk to an Expert
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Free Assessment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>15 Minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Instant Results</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
