/**
 * AI-First Incubator Programme Landing Page
 * Equity-based incubator for early-stage AI startups
 */

import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Rocket,
  Sparkles,
  Users,
  Calendar,
  CheckCircle,
  ArrowRight,
  Zap,
  Target,
  TrendingUp,
  Award,
  Globe,
  Lightbulb,
  Code,
  PieChart,
  Building2,
  GraduationCap,
  HandshakeIcon,
  DollarSign,
  Clock,
  ChevronRight,
  Star,
  Brain,
  Cpu,
} from 'lucide-react';

// Programme Timeline Item
interface TimelineItem {
  week: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Benefit Card Props
interface BenefitProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
}

// FAQ Item Props
interface FAQItem {
  question: string;
  answer: string;
}

// Application Form Data
interface ApplicationFormData {
  founderName: string;
  email: string;
  linkedIn: string;
  companyName: string;
  website: string;
  stage: string;
  teamSize: string;
  problemDescription: string;
  aiApproach: string;
  whyIncubator: string;
  heardFrom: string;
}

export default function IncubatorPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<ApplicationFormData>({
    founderName: '',
    email: '',
    linkedIn: '',
    companyName: '',
    website: '',
    stage: '',
    teamSize: '',
    problemDescription: '',
    aiApproach: '',
    whyIncubator: '',
    heardFrom: '',
  });

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleInputChange = (field: keyof ApplicationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission (replace with actual API call)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Here you would typically send to Supabase or an API endpoint
      // await supabase.from('incubator_applications').insert(formData);

      setFormSubmitted(true);
      toast({
        title: 'Application Submitted!',
        description: "We've received your application. We'll be in touch soon.",
      });
    } catch {
      toast({
        title: 'Submission Failed',
        description: 'Please try again or email us directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const benefits: BenefitProps[] = [
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: '$50K+ in Resources',
      description: 'Cloud credits, AI API access, development tools, and software subscriptions.',
      highlight: 'AWS, GCP, OpenAI Credits',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Expert Mentorship',
      description: 'Weekly sessions with AI founders, engineers, investors, and industry experts.',
      highlight: '1:1 Mentor Matching',
    },
    {
      icon: <Building2 className="w-6 h-6" />,
      title: 'Investor Network',
      description: 'Demo day pitch to 50+ investors. Direct introductions to VCs and angels.',
      highlight: 'Demo Day Access',
    },
    {
      icon: <GraduationCap className="w-6 h-6" />,
      title: 'AI Curriculum',
      description: 'Structured learning on AI product development, go-to-market, and fundraising.',
      highlight: '12-Week Programme',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Global Community',
      description: 'Join a network of AI founders from around the world. Alumni support for life.',
      highlight: 'Lifetime Access',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Hands-On Support',
      description: 'Technical office hours, product reviews, and pitch deck feedback.',
      highlight: 'Weekly Sessions',
    },
  ];

  const timeline: TimelineItem[] = [
    {
      week: 'Week 1-2',
      title: 'Foundation',
      description: 'AI landscape deep-dive, problem validation, and team alignment.',
      icon: <Target className="w-5 h-5" />,
    },
    {
      week: 'Week 3-4',
      title: 'Product Design',
      description: 'AI product architecture, tech stack selection, and MVP scoping.',
      icon: <Lightbulb className="w-5 h-5" />,
    },
    {
      week: 'Week 5-6',
      title: 'Build Sprint',
      description: 'Intensive MVP development with technical mentorship.',
      icon: <Code className="w-5 h-5" />,
    },
    {
      week: 'Week 7-8',
      title: 'Business Model',
      description: 'Go-to-market strategy, pricing, unit economics, and growth planning.',
      icon: <PieChart className="w-5 h-5" />,
    },
    {
      week: 'Week 9-10',
      title: 'Growth & Traction',
      description: 'Customer acquisition, metrics tracking, and early revenue strategies.',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      week: 'Week 11-12',
      title: 'Pitch & Demo Day',
      description: 'Investor readiness, pitch refinement, and demo day presentation.',
      icon: <Award className="w-5 h-5" />,
    },
  ];

  const idealFounders = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI-Native Builders',
      points: [
        'Building products with AI at the core, not as an afterthought',
        'Technical co-founder or strong technical understanding',
        'Passionate about solving real problems with AI',
      ],
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: 'Early-Stage Startups',
      points: [
        'Idea to early MVP stage',
        'Full-time commitment to the venture',
        'Willing to iterate based on feedback',
      ],
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Strong Teams',
      points: [
        '2-3 co-founders with complementary skills',
        'Track record of execution and resilience',
        'Coachable and collaborative mindset',
      ],
    },
  ];

  const faqs: FAQItem[] = [
    {
      question: 'How does the equity model work?',
      answer:
        'We take a small equity stake (typically 3-5%) via a SAFE note in exchange for the programme resources and support. There are no upfront fees. Our success is aligned with yours.',
    },
    {
      question: 'What is the time commitment?',
      answer:
        'The programme runs for 12 weeks with 2-3 scheduled sessions per week (workshops, office hours, mentor meetings). Founders should be working full-time on their startup.',
    },
    {
      question: 'Do I need a technical background?',
      answer:
        'At least one co-founder should have strong technical capabilities, especially in AI/ML. However, we value diverse teams with complementary business, product, and technical skills.',
    },
    {
      question: 'What stage should my startup be at?',
      answer:
        'We accept startups from idea stage to early MVP. You should have a clear problem hypothesis and initial validation. Post-seed or Series A companies are too late-stage for this programme.',
    },
    {
      question: 'Is the programme remote or in-person?',
      answer:
        'The programme is primarily remote/hybrid, making it accessible globally. Demo Day and select events may be in-person in London.',
    },
    {
      question: 'What happens after the programme?',
      answer:
        'You join our alumni network with continued access to mentors, investor introductions, and community events. Many of our portfolio companies continue to support each other long after graduation.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-700" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto text-center">
            <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-0 px-4 py-2 text-sm font-bold mb-6">
              <Rocket className="w-4 h-4 mr-2 inline" />
              NOW ACCEPTING APPLICATIONS
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg leading-tight">
              AI-First{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-transparent bg-clip-text">
                Incubator
              </span>{' '}
              Programme
            </h1>

            <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              12 weeks to transform your AI idea into a fundable startup. Mentorship, resources, and
              investor access—powered by AIBORG.
            </p>

            {/* Key Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-10">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <span className="text-white">12 Weeks</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-white">Equity-Based (No Fees)</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <Users className="w-5 h-5 text-pink-400" />
                <span className="text-white">10-15 Startups/Cohort</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <Globe className="w-5 h-5 text-purple-400" />
                <span className="text-white">Remote + London Demo Day</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                onClick={scrollToForm}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-8 py-6 text-lg shadow-lg shadow-purple-500/25"
              >
                Apply Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg"
              >
                Download Brochure
              </Button>
            </div>

            <p className="text-white/60 text-sm mt-4">
              Applications close March 15, 2026 • Cohort starts April 7, 2026
            </p>
          </div>
        </section>

        {/* What You Get Section */}
        <section className="py-16 px-4 bg-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 mb-4">
                <Sparkles className="w-4 h-4 mr-2 inline" />
                PROGRAMME BENEFITS
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Everything You Need to Launch
              </h2>
              <p className="text-purple-200 max-w-2xl mx-auto">
                We invest in your success with resources, mentorship, and connections worth over
                $50,000—in exchange for a small equity stake.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <Card
                  key={index}
                  className="bg-white/5 border-white/10 hover:border-purple-500/50 transition-all hover:scale-[1.02] group"
                >
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                      {benefit.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                    <p className="text-purple-200 text-sm mb-3">{benefit.description}</p>
                    {benefit.highlight && (
                      <Badge variant="outline" className="border-cyan-500/50 text-cyan-300 text-xs">
                        {benefit.highlight}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Programme Timeline */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 mb-4">
                <Clock className="w-4 h-4 mr-2 inline" />
                12-WEEK JOURNEY
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Programme Structure
              </h2>
              <p className="text-purple-200 max-w-2xl mx-auto">
                A structured path from idea validation to investor-ready pitch.
              </p>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-pink-500 to-cyan-500 hidden md:block" />

              <div className="space-y-8">
                {timeline.map((item, index) => (
                  <div
                    key={index}
                    className={`relative flex flex-col md:flex-row gap-4 md:gap-8 ${
                      index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    {/* Content */}
                    <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                      <Card className="bg-white/5 border-white/10 hover:border-purple-500/50 transition-all inline-block w-full md:max-w-md">
                        <CardContent className="p-5">
                          <Badge
                            className={`mb-2 ${
                              index % 2 === 0
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                            }`}
                          >
                            {item.week}
                          </Badge>
                          <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                          <p className="text-purple-200 text-sm">{item.description}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Center Icon */}
                    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center text-white shadow-lg shadow-purple-500/25">
                      {item.icon}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1 hidden md:block" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Who Should Apply */}
        <section className="py-16 px-4 bg-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 mb-4">
                <Target className="w-4 h-4 mr-2 inline" />
                IDEAL CANDIDATES
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Who Should Apply?</h2>
              <p className="text-purple-200 max-w-2xl mx-auto">
                We're looking for ambitious founders building AI-first products that solve real
                problems.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {idealFounders.map((founder, index) => (
                <Card
                  key={index}
                  className="bg-gradient-to-br from-white/10 to-white/5 border-white/10"
                >
                  <CardContent className="p-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-purple-400 mb-4">
                      {founder.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">{founder.title}</h3>
                    <ul className="space-y-3">
                      {founder.points.map((point, pIndex) => (
                        <li key={pIndex} className="flex items-start gap-3 text-purple-200 text-sm">
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Equity Model Explanation */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/30 overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1">
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30 mb-4">
                      <HandshakeIcon className="w-4 h-4 mr-2 inline" />
                      OUR MODEL
                    </Badge>
                    <h2 className="text-3xl font-bold text-white mb-4">
                      Aligned Incentives, Shared Success
                    </h2>
                    <p className="text-purple-200 mb-6">
                      We don't charge programme fees. Instead, we invest alongside you by taking a
                      small equity stake. Our success is tied to yours—we only win when you win.
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">No upfront fees</p>
                          <p className="text-purple-300 text-sm">Zero cost to participate</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">3-5% equity via SAFE</p>
                          <p className="text-purple-300 text-sm">Standard founder-friendly terms</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">$50K+ in value</p>
                          <p className="text-purple-300 text-sm">Resources, credits, and support</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                      <div className="text-center">
                        <p className="text-5xl font-bold text-white">3-5%</p>
                        <p className="text-white/80 text-sm">Equity</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Sectors We're Excited About */}
        <section className="py-16 px-4 bg-white/5">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 mb-4">
                <Cpu className="w-4 h-4 mr-2 inline" />
                FOCUS AREAS
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Sectors We're Excited About
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {[
                'AI Agents & Automation',
                'Developer Tools',
                'Healthcare AI',
                'EdTech & Learning',
                'FinTech',
                'Creative AI',
                'Enterprise AI',
                'Climate & Sustainability',
                'Legal Tech',
                'HR & Recruiting',
                'Customer Experience',
                'Data Infrastructure',
              ].map((sector, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-purple-500/30 text-purple-200 px-4 py-2 text-sm hover:bg-purple-500/20 transition-colors cursor-default"
                >
                  {sector}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 mb-4">
                <Lightbulb className="w-4 h-4 mr-2 inline" />
                FAQ
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Common Questions</h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card
                  key={index}
                  className={`bg-white/5 border-white/10 cursor-pointer transition-all ${
                    openFAQ === index ? 'border-purple-500/50' : 'hover:border-white/20'
                  }`}
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white pr-4">{faq.question}</h3>
                      <ChevronRight
                        className={`w-5 h-5 text-purple-400 transition-transform ${
                          openFAQ === index ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                    {openFAQ === index && (
                      <p className="text-purple-200 mt-4 text-sm leading-relaxed">{faq.answer}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Application Form Section */}
        <section ref={formRef} className="py-16 px-4 bg-white/5" id="apply">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 mb-4">
                <Rocket className="w-4 h-4 mr-2 inline" />
                APPLICATION FORM
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Apply to the Programme
              </h2>
              <p className="text-purple-200 max-w-2xl mx-auto">
                Tell us about yourself and your AI startup. Applications are reviewed within 5
                business days.
              </p>
            </div>

            {formSubmitted ? (
              <Card className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-500/30">
                <CardContent className="p-10 text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-4">Application Submitted!</h3>
                  <p className="text-green-200 mb-6">
                    Thank you for applying to the AI-First Incubator Programme. Our team will review
                    your application and get back to you within 5 business days.
                  </p>
                  <p className="text-white/60 text-sm">
                    Check your email for a confirmation. Questions? Email{' '}
                    <a
                      href="mailto:incubator@aiborg.ai"
                      className="text-green-400 hover:text-green-300"
                    >
                      incubator@aiborg.ai
                    </a>
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6 md:p-10">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Founder Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-400" />
                        Founder Information
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="founderName" className="text-purple-200">
                            Full Name <span className="text-pink-400">*</span>
                          </Label>
                          <Input
                            id="founderName"
                            value={formData.founderName}
                            onChange={e => handleInputChange('founderName', e.target.value)}
                            placeholder="Jane Smith"
                            required
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-purple-200">
                            Email Address <span className="text-pink-400">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={e => handleInputChange('email', e.target.value)}
                            placeholder="jane@startup.com"
                            required
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linkedIn" className="text-purple-200">
                            LinkedIn Profile <span className="text-pink-400">*</span>
                          </Label>
                          <Input
                            id="linkedIn"
                            value={formData.linkedIn}
                            onChange={e => handleInputChange('linkedIn', e.target.value)}
                            placeholder="linkedin.com/in/janesmith"
                            required
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="teamSize" className="text-purple-200">
                            Team Size <span className="text-pink-400">*</span>
                          </Label>
                          <Select
                            value={formData.teamSize}
                            onValueChange={value => handleInputChange('teamSize', value)}
                            required
                          >
                            <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-purple-500">
                              <SelectValue placeholder="Select team size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solo">Solo Founder</SelectItem>
                              <SelectItem value="2">2 Co-founders</SelectItem>
                              <SelectItem value="3">3 Co-founders</SelectItem>
                              <SelectItem value="4+">4+ Team Members</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Startup Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-cyan-400" />
                        Startup Information
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyName" className="text-purple-200">
                            Company/Project Name <span className="text-pink-400">*</span>
                          </Label>
                          <Input
                            id="companyName"
                            value={formData.companyName}
                            onChange={e => handleInputChange('companyName', e.target.value)}
                            placeholder="AI Startup Inc"
                            required
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website" className="text-purple-200">
                            Website (if any)
                          </Label>
                          <Input
                            id="website"
                            value={formData.website}
                            onChange={e => handleInputChange('website', e.target.value)}
                            placeholder="https://mystartup.com"
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="stage" className="text-purple-200">
                            Current Stage <span className="text-pink-400">*</span>
                          </Label>
                          <Select
                            value={formData.stage}
                            onValueChange={value => handleInputChange('stage', value)}
                            required
                          >
                            <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-purple-500">
                              <SelectValue placeholder="Select your startup stage" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="idea">Idea Stage - Concept only</SelectItem>
                              <SelectItem value="prototype">
                                Prototype - Basic working demo
                              </SelectItem>
                              <SelectItem value="mvp">MVP - Minimum viable product</SelectItem>
                              <SelectItem value="early-users">
                                Early Users - Some traction
                              </SelectItem>
                              <SelectItem value="revenue">
                                Early Revenue - Paying customers
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* About Your AI Product */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-pink-400" />
                        About Your AI Product
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="problemDescription" className="text-purple-200">
                            What problem are you solving? <span className="text-pink-400">*</span>
                          </Label>
                          <Textarea
                            id="problemDescription"
                            value={formData.problemDescription}
                            onChange={e => handleInputChange('problemDescription', e.target.value)}
                            placeholder="Describe the problem you're addressing and who experiences it..."
                            required
                            rows={3}
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500 resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="aiApproach" className="text-purple-200">
                            How does AI power your solution?{' '}
                            <span className="text-pink-400">*</span>
                          </Label>
                          <Textarea
                            id="aiApproach"
                            value={formData.aiApproach}
                            onChange={e => handleInputChange('aiApproach', e.target.value)}
                            placeholder="Describe your AI approach, technology stack, and what makes it unique..."
                            required
                            rows={3}
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500 resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="whyIncubator" className="text-purple-200">
                            What do you hope to gain from this programme?{' '}
                            <span className="text-pink-400">*</span>
                          </Label>
                          <Textarea
                            id="whyIncubator"
                            value={formData.whyIncubator}
                            onChange={e => handleInputChange('whyIncubator', e.target.value)}
                            placeholder="Tell us what support you're looking for and your goals for the 12 weeks..."
                            required
                            rows={3}
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500 resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-400" />
                        Additional Information
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="heardFrom" className="text-purple-200">
                          How did you hear about us?
                        </Label>
                        <Select
                          value={formData.heardFrom}
                          onValueChange={value => handleInputChange('heardFrom', value)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-purple-500">
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="social">Social Media</SelectItem>
                            <SelectItem value="search">Search Engine</SelectItem>
                            <SelectItem value="referral">Friend/Colleague Referral</SelectItem>
                            <SelectItem value="event">Event or Conference</SelectItem>
                            <SelectItem value="press">Press/Media</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Terms and Submit */}
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-purple-200/70 text-sm mb-6">
                        By submitting this application, you agree to our{' '}
                        <a
                          href="/terms"
                          className="text-purple-400 hover:text-purple-300 underline"
                        >
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a
                          href="/privacy"
                          className="text-purple-400 hover:text-purple-300 underline"
                        >
                          Privacy Policy
                        </a>
                        . We'll use your information to evaluate your application and may contact
                        you for additional details.
                      </p>
                      <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-6 text-lg shadow-lg shadow-purple-500/25 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Submitting Application...
                          </>
                        ) : (
                          <>
                            Submit Application
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-3xl blur-3xl" />
              <Card className="relative bg-gradient-to-br from-purple-900/80 to-slate-900/80 border-purple-500/30 overflow-hidden">
                <CardContent className="p-10 md:p-16">
                  <Star className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Ready to Build the Future?
                  </h2>
                  <p className="text-purple-200 mb-8 max-w-2xl mx-auto text-lg">
                    Join our next cohort and turn your AI vision into reality. Applications are
                    reviewed on a rolling basis—apply early.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button
                      size="lg"
                      onClick={scrollToForm}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-10 py-6 text-lg shadow-lg shadow-purple-500/25"
                    >
                      Start Your Application
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                  <p className="text-white/50 text-sm mt-6">
                    Questions? Email us at{' '}
                    <a
                      href="mailto:incubator@aiborg.ai"
                      className="text-purple-400 hover:text-purple-300"
                    >
                      incubator@aiborg.ai
                    </a>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
