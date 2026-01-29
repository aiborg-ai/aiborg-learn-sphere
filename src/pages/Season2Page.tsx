/**
 * Season 2 Landing Page
 * Free AI Classes Registration - Under 14 & 14+ Professionals
 */

import { useEffect } from 'react';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Sparkles,
  GraduationCap,
  Briefcase,
  Globe,
  Ticket,
  ArrowRight,
} from '@/components/ui/icons';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  useEventSeriesDetails,
  useEventSeriesRegistration,
  useRegisterEventSeries,
} from '@/hooks/useEventSeries';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';

// Season 2 Event IDs
const UNDER_14_EVENT_ID = 41;
const PROFESSIONALS_EVENT_ID = 42;

export default function Season2Page() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-slate-900">
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-16 px-4 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-700" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto text-center">
            <Badge className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white border-0 px-4 py-2 text-sm font-bold mb-6 animate-pulse">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              100% FREE - NO PAYMENT REQUIRED
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
              Season 2: Free AI Classes
            </h1>

            <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
              12-week AI education programs for all ages. Learn from industry experts, build real
              projects, and transform your future with AI skills.
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-pink-400" />
                <span>Starts February 6, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <span>100% Online</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-yellow-400" />
                <span>Limited Spots</span>
              </div>
            </div>
          </div>
        </section>

        {/* Programs Section */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-12">Choose Your Program</h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Under 14 Program */}
              <ProgramCard
                eventId={UNDER_14_EVENT_ID}
                title="AI Explorers"
                subtitle="For Kids Under 14"
                description="Fun, interactive AI learning designed for young minds. Build games, create art, and explore the exciting world of artificial intelligence!"
                schedule="Saturdays at 11:00 AM UK Time"
                icon={GraduationCap}
                gradient="from-pink-500 to-orange-500"
                features={[
                  'Age-appropriate content (7-13 years)',
                  'Fun hands-on AI projects',
                  'No coding experience needed',
                  'Global-friendly morning schedule',
                ]}
              />

              {/* 14+ & Professionals Program */}
              <ProgramCard
                eventId={PROFESSIONALS_EVENT_ID}
                title="AI Mastery"
                subtitle="For Teens & Professionals"
                description="Comprehensive AI training for career advancement. Master practical AI tools, build real applications, and unlock new opportunities."
                schedule="Fridays at 8:00 PM UK Time"
                icon={Briefcase}
                gradient="from-cyan-500 to-blue-600"
                features={[
                  'Teenagers (14+) & working professionals',
                  'Practical AI tools & workflows',
                  'Career-focused curriculum',
                  'Evening schedule for busy learners',
                ]}
              />
            </div>
          </div>
        </section>

        {/* What You'll Learn Section */}
        <section className="py-16 px-4 bg-white/5">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              12 Weeks of Transformation
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-pink-400 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6" />
                  AI Explorers Curriculum
                </h3>
                <ul className="space-y-3 text-purple-100">
                  {[
                    'Welcome to AI World!',
                    'Meet the AI Assistants',
                    'AI Art Studio',
                    'Smart Games with AI',
                    'Robot Friends',
                    'AI Music Maker',
                    'Story Time with AI',
                    'AI Detective',
                    'Weather Wizards',
                    'AI in Space',
                    'Build Your First AI Project',
                    'AI Showcase & Graduation',
                  ].map((topic, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-cyan-400 flex items-center gap-2">
                  <Briefcase className="w-6 h-6" />
                  AI Mastery Curriculum
                </h3>
                <ul className="space-y-3 text-purple-100">
                  {[
                    'AI Foundations & Landscape',
                    'Prompt Engineering Mastery',
                    'AI for Productivity',
                    'Machine Learning Fundamentals',
                    'Natural Language Processing',
                    'Computer Vision Basics',
                    'AI in Business Applications',
                    'Building AI-Powered Apps',
                    'AI Ethics & Responsible Use',
                    'AI Career Pathways',
                    'Capstone Project Workshop',
                    'Showcase & Certification',
                  ].map((topic, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              {[
                {
                  q: 'Is this really free?',
                  a: 'Yes! Season 2 is completely free. No hidden fees, no payment required. Just register and start learning.',
                },
                {
                  q: 'What do I need to join?',
                  a: 'Just a computer or tablet with internet connection. All sessions are online via video conferencing.',
                },
                {
                  q: 'Can I join from any country?',
                  a: 'Absolutely! Our sessions are timed to accommodate global audiences. Under 14 sessions are Saturday mornings UK time (great for Asia/Australia), and Professional sessions are Friday evenings UK time (great for Americas/Europe).',
                },
                {
                  q: 'What if I miss a session?',
                  a: 'Recordings will be available for registered participants. However, live attendance is encouraged for the best learning experience.',
                },
                {
                  q: 'Will I get a certificate?',
                  a: 'Yes! Participants who complete the 12-week program will receive a certificate of completion.',
                },
              ].map((faq, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">{faq.q}</h3>
                  <p className="text-purple-200">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Program Card Component
interface ProgramCardProps {
  eventId: number;
  title: string;
  subtitle: string;
  description: string;
  schedule: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  features: string[];
}

function ProgramCard({
  eventId,
  title,
  subtitle,
  description,
  schedule,
  icon: Icon,
  gradient,
  features,
}: ProgramCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: seriesData, isLoading: loadingDetails } = useEventSeriesDetails(eventId);
  const { data: registration, isLoading: loadingRegistration } =
    useEventSeriesRegistration(eventId);
  const registerMutation = useRegisterEventSeries();

  const isRegistered = !!registration;
  const upcomingSessions = seriesData?.upcomingSessions || [];

  const handleRegister = async () => {
    if (!user) {
      toast({
        title: 'Please log in first',
        description: 'You need to be logged in to register for the program.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    try {
      await registerMutation.mutateAsync({
        eventId,
        paymentMethod: 'free',
      });

      toast({
        title: 'Registration Successful!',
        description: `You're now registered for ${title}. Check your email for confirmation.`,
      });
    } catch {
      toast({
        title: 'Registration Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="overflow-hidden bg-white/10 backdrop-blur border-white/20 hover:bg-white/15 transition-all">
      <CardHeader className={`bg-gradient-to-r ${gradient} p-6`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <p className="text-white/80">{subtitle}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <p className="text-purple-100">{description}</p>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-white">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span className="font-medium">{schedule}</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <MapPin className="w-5 h-5 text-green-400" />
            <span>Online (Zoom/Google Meet)</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <Calendar className="w-5 h-5 text-pink-400" />
            <span>12 weekly sessions</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-white">What's Included:</h4>
          <ul className="space-y-2">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-purple-200 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Upcoming Sessions Preview */}
        {!loadingDetails && upcomingSessions.length > 0 && (
          <div className="bg-black/20 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3">Next Sessions:</h4>
            <div className="space-y-2">
              {upcomingSessions.slice(0, 3).map(session => (
                <div
                  key={session.id}
                  className="flex items-center justify-between text-sm text-purple-200"
                >
                  <span>{format(parseISO(session.session_date), 'EEE, MMM d, yyyy')}</span>
                  <span>
                    {session.start_time} - {session.end_time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loadingDetails && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-white/10" />
            <Skeleton className="h-4 w-full bg-white/10" />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0">
        {isRegistered ? (
          <div className="w-full text-center py-4 bg-green-500/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-green-400 font-semibold">
              <CheckCircle className="w-5 h-5" />
              You're Registered!
            </div>
            <p className="text-sm text-green-300 mt-1">Check your tickets page for details</p>
          </div>
        ) : (
          <Button
            onClick={handleRegister}
            disabled={registerMutation.isPending || loadingRegistration}
            className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white font-bold py-6 text-lg`}
            size="lg"
          >
            {registerMutation.isPending ? (
              'Registering...'
            ) : (
              <>
                <Ticket className="w-5 h-5 mr-2" />
                Register Now - FREE
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
