/**
 * Family Membership Page
 *
 * Main landing page for Family Pass membership
 * 11 conversion-optimized sections designed for heavy conversions
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  X,
  ArrowRight,
  Shield,
  Clock,
  Heart,
  Rocket,
  Users,
  GraduationCap,
  Lock,
  Calendar,
  Star,
  Gift,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ROISavingsCalculator } from '@/components/membership';
import { usePlanBySlug, useHasActiveMembership } from '@/hooks/useMembership';

// Countdown timer state
const OFFER_END_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

export default function FamilyMembershipPage() {
  const { data: hasActiveMembership } = useHasActiveMembership();
  const { data: familyPlan, isLoading } = usePlanBySlug('family-pass');

  // Redirect if already a member
  useEffect(() => {
    if (hasActiveMembership) {
      // Could redirect to dashboard, but let them see the page
    }
  }, [hasActiveMembership]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Section 1: Hero Section */}
      <HeroSection plan={familyPlan} />

      {/* Section 2: Problem-Solution */}
      <ProblemSolutionSection />

      {/* Section 3: Interactive Savings Calculator */}
      <SavingsCalculatorSection />

      {/* Section 4: What's Included */}
      <WhatsIncludedSection plan={familyPlan} />

      {/* Section 5: Feature Comparison Table */}
      <ComparisonTableSection />

      {/* Section 6: Social Proof / Testimonials */}
      <TestimonialsSection />

      {/* Section 7: How It Works */}
      <HowItWorksSection />

      {/* Section 8: FAQ */}
      <FAQSection />

      {/* Section 9: Trust & Guarantee */}
      <TrustSection />

      {/* Section 10: Urgency & Final CTA */}
      <FinalCTASection plan={familyPlan} />

      {/* Section 11: Live Activity Feed */}
      <LiveActivityBanner />
    </div>
  );
}

// ============================================================================
// SECTION 1: HERO
// ============================================================================

function HeroSection({ plan: _plan }: { plan: Record<string, unknown> }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50 py-16 sm:py-24">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-200/20 rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-200/20 rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* FHOAI Vault Subscriber Banner */}
        <div className="mb-8 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl p-6 text-white shadow-2xl border-2 border-purple-300">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Gift className="w-8 h-8" />
              <h3 className="text-2xl font-bold">FHOAI Vault Subscribers: Get FREE Family Pass!</h3>
            </div>
            <p className="text-center text-lg mb-4 opacity-90">
              Already a vault subscriber? Claim your complimentary Family Pass (worth £240/year) at
              no additional cost.
            </p>
            <div className="flex justify-center">
              <Button
                asChild
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 font-bold px-8 py-6 text-lg shadow-xl"
              >
                <Link to="/claim-free-pass">
                  <Gift className="mr-2 w-5 h-5" />
                  Claim FREE Pass Now
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center mb-12">
          <Badge className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 text-base font-semibold">
            🎉 Limited Time: Lock in £20/month forever
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            One Membership.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
              Unlimited Learning.
            </span>
            <br />
            Whole Family.
          </h1>

          <p className="text-xl sm:text-2xl text-gray-700 mb-4 max-w-3xl mx-auto">
            From ages 8 to 80, everyone in your family learns together with the aiborg™ Family Pass
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-bold text-gray-900">£20</span>
              <span className="text-xl text-gray-600">/month</span>
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-600 line-through">vs. £588/year individual</p>
              <p className="text-lg font-semibold text-green-600">Save £2,400+ per year</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 group"
            >
              <Link to="/family-membership/enroll">
                Start 30-Day Free Trial
                <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Link to="/claim-free-pass">
                <Gift className="mr-2 h-5 w-5" />
                Claim FREE Pass
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-amber-500 text-amber-700 hover:bg-amber-50 text-lg px-8 py-6"
            >
              <a href="#calculator">Calculate Your Savings</a>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-medium">30-Day Money-Back Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-medium">Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-medium">No Credit Card Required</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 2: PROBLEM-SOLUTION
// ============================================================================

function ProblemSolutionSection() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
          Traditional Learning is <span className="text-red-600">Expensive & Limiting</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Problem Side */}
          <Card className="p-8 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <X className="w-8 h-8 text-red-600" />
              The Old Way
            </h3>

            <ul className="space-y-4">
              {[
                { text: 'Individual courses cost £49 each', impact: '£588+/year per person' },
                {
                  text: 'Multiple family members = £hundreds per month',
                  impact: '£2,352/year for 4 people',
                },
                { text: 'Limited content access', impact: 'Pay per course forever' },
                { text: 'Pay per event separately', impact: '£20-50 per event' },
                { text: 'No family sharing', impact: 'Everyone pays individually' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <X className="w-6 h-6 text-red-600 shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">{item.text}</p>
                    <p className="text-sm text-red-600">{item.impact}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Solution Side */}
          <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              The Family Pass Way
            </h3>

            <ul className="space-y-4">
              {[
                { text: 'One price for entire family', impact: 'Just £20/month' },
                { text: 'Unlimited course access', impact: '50+ courses included' },
                { text: 'Exclusive vault content', impact: '200+ premium resources' },
                { text: 'Free event invitations', impact: 'Priority access included' },
                { text: 'Up to 6 family members', impact: 'Everyone learns together' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">{item.text}</p>
                    <p className="text-sm text-green-600">{item.impact}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 p-4 bg-white rounded-lg border-2 border-green-300">
              <p className="text-center text-2xl font-bold text-green-600">Save £2,400+ Per Year</p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 3: SAVINGS CALCULATOR
// ============================================================================

function SavingsCalculatorSection() {
  return (
    <section id="calculator" className="py-16 sm:py-24 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Calculate Your Exact Savings
          </h2>
          <p className="text-xl text-gray-600">See how much you'll save with the Family Pass</p>
        </div>

        <ROISavingsCalculator />
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 4: WHAT'S INCLUDED
// ============================================================================

function WhatsIncludedSection({ plan: _plan }: { plan: Record<string, unknown> }) {
  const features = [
    {
      icon: GraduationCap,
      title: 'All Online Courses',
      items: [
        '50+ AI courses',
        'Primary (ages 8-11)',
        'Secondary (ages 12-18)',
        'Professional development',
        'Business/SME training',
      ],
      color: 'from-blue-500 to-indigo-600',
    },
    {
      icon: Lock,
      title: 'Exclusive Vault',
      items: [
        '200+ video tutorials',
        'Downloadable resources',
        'Templates & worksheets',
        'Member-only webinars',
        'AI tools & scripts',
      ],
      color: 'from-purple-500 to-pink-600',
    },
    {
      icon: Calendar,
      title: 'Event Access',
      items: [
        'Monthly seminars (free)',
        'Priority registration',
        'Industry expert talks',
        '50% off conferences',
        'Family learning days',
      ],
      color: 'from-orange-500 to-red-600',
    },
    {
      icon: Users,
      title: 'Family Sharing',
      items: [
        'Up to 6 members',
        'Individual accounts',
        'Progress tracking',
        'Certificate programs',
        'Priority support',
      ],
      color: 'from-green-500 to-emerald-600',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything Your Family Needs to Learn AI
          </h2>
          <p className="text-xl text-gray-600">
            One subscription unlocks unlimited access for everyone
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <Card key={i} className="p-6 hover:shadow-xl transition-shadow duration-300">
              <div
                className={`w-14 h-14 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}
              >
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>

              <ul className="space-y-2">
                {feature.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-lg px-8 py-6 shadow-lg group"
          >
            <Link to="/family-membership/enroll">
              Get Started - Free for 30 Days
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 5: COMPARISON TABLE
// ============================================================================

function ComparisonTableSection() {
  const comparisons = [
    { feature: 'Course Access', individual: '1 course', family: 'Unlimited' },
    { feature: 'Family Members', individual: '1 person', family: 'Up to 6' },
    { feature: 'Vault Content', individual: '❌', family: '✅ Full Access' },
    { feature: 'Event Invitations', individual: 'Pay per event', family: 'Free Priority' },
    { feature: 'Support', individual: 'Email only', family: 'Priority Support' },
    { feature: 'Monthly Cost', individual: '£49 per course', family: '£20 all-in' },
    { feature: 'Annual Cost', individual: '£588+ (12 courses)', family: '£240/year' },
  ];

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
          Why Families Choose the Family Pass
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-4 text-left font-semibold text-gray-900">Feature</th>
                <th className="px-6 py-4 text-center font-semibold text-gray-900">
                  Individual Courses
                </th>
                <th className="px-6 py-4 text-center font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500">
                  Family Pass ⭐
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((item, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.feature}</td>
                  <td className="px-6 py-4 text-center text-gray-600">{item.individual}</td>
                  <td className="px-6 py-4 text-center font-semibold text-green-600 bg-green-50">
                    {item.family}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 6: TESTIMONIALS
// ============================================================================

function TestimonialsSection() {
  const testimonials = [
    {
      family: 'The Johnson Family',
      location: 'Manchester, UK',
      members: 3,
      quote:
        'Our 3 kids (ages 9, 14, and 16) are all learning AI together. Best £20 we spend each month!',
      coursesCompleted: 23,
      rating: 5,
    },
    {
      family: 'The Patel Family',
      location: 'Birmingham, UK',
      members: 5,
      quote:
        "As parents, we're learning alongside our children. The vault content is incredible value.",
      coursesCompleted: 31,
      rating: 5,
    },
    {
      family: 'The Williams Family',
      location: 'London, UK',
      members: 4,
      quote: 'Saved over £2,000 in the first year. The ROI calculator was spot on!',
      coursesCompleted: 19,
      rating: 5,
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Families Love Learning Together
          </h2>
          <p className="text-xl text-gray-600">
            Join 500+ families already on their AI learning journey
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <Card key={i} className="p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, j) => (
                  <Star key={j} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>

              <div className="border-t pt-4">
                <p className="font-bold text-gray-900">{testimonial.family}</p>
                <p className="text-sm text-gray-600">{testimonial.location}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>{testimonial.members} members</span>
                  <span>•</span>
                  <span>{testimonial.coursesCompleted} courses</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 7: HOW IT WORKS
// ============================================================================

function HowItWorksSection() {
  const steps = [
    {
      icon: Rocket,
      title: 'Start Free Trial',
      description: 'No credit card required for 30 days full access',
    },
    {
      icon: Users,
      title: 'Add Family Members',
      description: 'Invite up to 6 people with individual accounts',
    },
    {
      icon: Heart,
      title: 'Learn Together',
      description: 'Access everything unlimited, cancel anytime',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
          Getting Started is Easy
        </h2>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              <Card className="p-6 text-center bg-white hover:shadow-xl transition-shadow duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white text-2xl font-bold mb-4">
                  {i + 1}
                </div>

                <div className="w-12 h-12 mx-auto mb-4">
                  <step.icon className="w-12 h-12 text-amber-600" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </Card>

              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-8 h-8 text-amber-500" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-lg px-8 py-6 shadow-lg group"
          >
            <Link to="/family-membership/enroll">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 8: FAQ
// ============================================================================

function FAQSection() {
  const faqs = [
    {
      q: 'How many family members can I add?',
      a: 'Up to 6 family members with individual accounts and progress tracking.',
    },
    {
      q: 'What counts as a "family member"?',
      a: 'Immediate family living in the same household: parents, children, grandparents, siblings.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes! Cancel anytime with no penalties. You keep access until the end of your billing period.',
    },
    {
      q: 'What if we have different age groups?',
      a: 'Perfect! We have courses for ages 8-11 (Primary), 12-18 (Secondary), adults (Professional), and businesses.',
    },
    {
      q: 'Is there a free trial?',
      a: 'Yes! 30 days completely free, no credit card required. Full access to everything.',
    },
    {
      q: "What's included in the Vault?",
      a: '200+ premium resources: video tutorials, templates, worksheets, webinar recordings, and AI tools.',
    },
    {
      q: 'How do event invitations work?',
      a: 'Members get priority registration (48hrs early) and free access to monthly seminars. Plus 50% off premium events.',
    },
    {
      q: 'Do you offer refunds?',
      a: 'Yes! 30-day money-back guarantee, no questions asked. We want you to be 100% satisfied.',
    },
    {
      q: 'Can I upgrade or downgrade?',
      a: 'Currently offering Family Pass only. Individual plans coming soon!',
    },
    {
      q: 'Do we need separate accounts?',
      a: 'Yes! Each family member gets their own account with individual progress tracking and certificates.',
    },
    {
      q: 'Can I add/remove members later?',
      a: 'Yes! Manage family members anytime from your dashboard.',
    },
    {
      q: 'How is this different from individual courses?',
      a: 'Individual courses cost £49 each and must be purchased separately. Family Pass gives unlimited access to everything for one low price.',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
          Frequently Asked Questions
        </h2>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-amber-600">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 9: TRUST & GUARANTEE
// ============================================================================

function TrustSection() {
  const badges = [
    {
      icon: Shield,
      title: '30-Day Money-Back Guarantee',
      description: 'Not satisfied? Full refund, no questions asked.',
    },
    {
      icon: Clock,
      title: 'Cancel Anytime',
      description: 'No long-term commitment required. Cancel with one click.',
    },
    {
      icon: CheckCircle2,
      title: 'Secure Payment',
      description: 'Powered by Stripe - bank-level security for your data.',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
          Risk-Free Guarantee
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {badges.map((badge, i) => (
            <Card
              key={i}
              className="p-6 text-center bg-white hover:shadow-xl transition-shadow duration-300"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <badge.icon className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{badge.title}</h3>
              <p className="text-gray-600">{badge.description}</p>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 mb-4">Accepted Payment Methods</p>
          <div className="flex items-center justify-center gap-4 text-gray-400">
            <span className="font-semibold">Visa</span>
            <span>•</span>
            <span className="font-semibold">Mastercard</span>
            <span>•</span>
            <span className="font-semibold">Amex</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 10: FINAL CTA WITH URGENCY
// ============================================================================

function FinalCTASection({ plan: _plan }: { plan: Record<string, unknown> }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const distance = OFFER_END_DATE.getTime() - now;

      setTimeLeft({
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Badge className="mb-6 bg-white text-red-600 px-6 py-2 text-base font-semibold">
          🔥 Limited Time Offer
        </Badge>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
          Don't Miss Out - Early Bird Pricing Ends Soon
        </h2>

        <p className="text-xl mb-8 opacity-90">Lock in £20/month forever (normally £30/month)</p>

        {/* Countdown Timer */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[
            { value: timeLeft.hours, label: 'Hours' },
            { value: timeLeft.minutes, label: 'Minutes' },
            { value: timeLeft.seconds, label: 'Seconds' },
          ].map((item, i) => (
            <div key={i} className="bg-white/20 backdrop-blur-sm rounded-lg p-4 min-w-[100px]">
              <div className="text-4xl font-bold">{String(item.value).padStart(2, '0')}</div>
              <div className="text-sm opacity-75">{item.label}</div>
            </div>
          ))}
        </div>

        <p className="text-2xl font-bold mb-8">Only 47 Spots Left at This Price</p>

        <Button
          asChild
          size="lg"
          className="bg-white text-orange-600 hover:bg-gray-100 text-xl px-12 py-8 shadow-2xl hover:shadow-3xl transition-all duration-300 group"
        >
          <Link to="/family-membership/enroll">
            Claim Your Spot - Start Free Trial
            <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>

        <p className="text-sm mt-6 opacity-75">
          No credit card • Cancel anytime • 30-day guarantee
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 11: LIVE ACTIVITY BANNER
// ============================================================================

function LiveActivityBanner() {
  const [currentActivity, setCurrentActivity] = useState(0);

  const activities = [
    'Sarah from London joined 2 minutes ago',
    'The Martinez family saved £2,100 this year',
    'John completed his 15th course today',
    'Emily from Birmingham just enrolled',
    'The Johnson family invited 3 new members',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivity(prev => (prev + 1) % activities.length);
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activities.length is intentionally not a dependency
  }, []);

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-3 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 animate-pulse">
        <p className="text-white text-center font-medium">✨ {activities[currentActivity]}</p>
      </div>
    </div>
  );
}
