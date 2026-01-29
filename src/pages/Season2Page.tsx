/**
 * Season 2 Landing Page
 * Free AI Classes Registration - Simple form without login
 */

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Loader2,
  Phone,
  Mail,
  User,
} from '@/components/ui/icons';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

type Program = 'under14' | 'professionals';

interface FormData {
  fullName: string;
  email: string;
  whatsappNumber: string;
  country: string;
  city: string;
  ageGroup: string;
  occupation: string;
  occupationDetails: string;
}

export default function Season2Page() {
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    whatsappNumber: '',
    country: '',
    city: '',
    ageGroup: '',
    occupation: '',
    occupationDetails: '',
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProgram) {
      toast({
        title: 'Please select a program',
        description: 'Choose either AI Explorers (Under 14) or AI Mastery (14+)',
        variant: 'destructive',
      });
      return;
    }

    // Validate required fields
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.whatsappNumber ||
      !formData.country ||
      !formData.ageGroup ||
      !formData.occupation
    ) {
      toast({
        title: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Invalid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('season2-register', {
        body: {
          ...formData,
          program: selectedProgram,
        },
      });

      if (error) {
        throw new Error(error.message || 'Registration failed');
      }

      if (data?.error) {
        toast({
          title: data.error,
          description: data.message || 'Please try again',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      toast({
        title: 'Registration Submitted!',
        description: 'You will receive a confirmation email once approved.',
      });
    } catch (error) {
      logger.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-slate-900">
        <Navbar />
        <main className="pt-32 pb-20 px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Registration Submitted!</h1>
            <p className="text-xl text-purple-200 mb-8">
              Thank you for registering for Season 2. We'll review your registration and send you a
              confirmation email shortly.
            </p>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-left">
              <h3 className="text-lg font-semibold text-white mb-4">What's Next?</h3>
              <ul className="space-y-3 text-purple-200">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <span>Check your email for confirmation (within 24 hours)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <span>Save our WhatsApp number for session reminders</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <span>Mark February 6, 2026 on your calendar!</span>
                </li>
              </ul>
            </div>
            <Button
              onClick={() => (window.location.href = '/')}
              className="mt-8 bg-white text-purple-600 hover:bg-purple-50"
            >
              Back to Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-slate-900">
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-12 px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-700" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <Badge className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white border-0 px-4 py-2 text-sm font-bold mb-6 animate-pulse">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              100% FREE - NO PAYMENT REQUIRED
            </Badge>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Season 2: Free AI Classes
            </h1>

            <p className="text-lg md:text-xl text-purple-100 mb-6 max-w-2xl mx-auto">
              12-week AI education programs for all ages. Starting February 6, 2026.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-400" />
                <span>Starts Feb 6, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>100% Online</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-yellow-400" />
                <span>Limited Spots</span>
              </div>
            </div>
          </div>
        </section>

        {/* Registration Section */}
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Program Selection */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white text-center mb-6">
                1. Choose Your Program
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <ProgramCard
                  program="under14"
                  title="AI Explorers"
                  subtitle="For Kids Under 14"
                  schedule="Saturdays at 11:00 AM UK"
                  icon={GraduationCap}
                  gradient="from-pink-500 to-orange-500"
                  selected={selectedProgram === 'under14'}
                  onSelect={() => setSelectedProgram('under14')}
                />
                <ProgramCard
                  program="professionals"
                  title="AI Mastery"
                  subtitle="For Teens (14+) & Professionals"
                  schedule="Fridays at 8:00 PM UK"
                  icon={Briefcase}
                  gradient="from-cyan-500 to-blue-600"
                  selected={selectedProgram === 'professionals'}
                  onSelect={() => setSelectedProgram('professionals')}
                />
              </div>
            </div>

            {/* Registration Form */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-white text-center mb-6">
                  2. Fill Your Details
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-white flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={e => handleInputChange('fullName', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={e => handleInputChange('email', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        required
                      />
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp" className="text-white flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        WhatsApp Number *
                      </Label>
                      <Input
                        id="whatsapp"
                        placeholder="+44 7123 456789"
                        value={formData.whatsappNumber}
                        onChange={e => handleInputChange('whatsappNumber', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        required
                      />
                    </div>

                    {/* Country */}
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-white flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Country *
                      </Label>
                      <Input
                        id="country"
                        placeholder="United Kingdom"
                        value={formData.country}
                        onChange={e => handleInputChange('country', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        required
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        City (Optional)
                      </Label>
                      <Input
                        id="city"
                        placeholder="London"
                        value={formData.city}
                        onChange={e => handleInputChange('city', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>

                    {/* Age Group */}
                    <div className="space-y-2">
                      <Label className="text-white">Age Group *</Label>
                      <Select
                        value={formData.ageGroup}
                        onValueChange={value => handleInputChange('ageGroup', value)}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select age group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under14">Under 14</SelectItem>
                          <SelectItem value="14-18">14 - 18 years</SelectItem>
                          <SelectItem value="18-25">18 - 25 years</SelectItem>
                          <SelectItem value="25-40">25 - 40 years</SelectItem>
                          <SelectItem value="40+">40+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Occupation */}
                    <div className="space-y-2">
                      <Label className="text-white">Occupation *</Label>
                      <Select
                        value={formData.occupation}
                        onValueChange={value => handleInputChange('occupation', value)}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select occupation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="professional">Working Professional</SelectItem>
                          <SelectItem value="business_owner">Business Owner</SelectItem>
                          <SelectItem value="educator">Educator / Teacher</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Occupation Details */}
                    <div className="space-y-2">
                      <Label htmlFor="occupationDetails" className="text-white">
                        Occupation Details (Optional)
                      </Label>
                      <Input
                        id="occupationDetails"
                        placeholder="e.g., Software Engineer at Google"
                        value={formData.occupationDetails}
                        onChange={e => handleInputChange('occupationDetails', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting || !selectedProgram}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-6 text-lg"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Register for Free
                        </>
                      )}
                    </Button>
                    <p className="text-center text-white/60 text-sm mt-3">
                      You'll receive a confirmation email once your registration is approved.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Curriculum Preview */}
        <section className="py-12 px-4 bg-white/5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">12 Weeks of Learning</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-pink-400 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  AI Explorers (Under 14)
                </h3>
                <ul className="space-y-2 text-purple-200 text-sm">
                  {[
                    'Welcome to AI World',
                    'Meet AI Assistants',
                    'AI Art Studio',
                    'Smart Games',
                    'Robot Friends',
                    'AI Music Maker',
                    'Story Time with AI',
                    'AI Detective',
                    'Weather Wizards',
                    'AI in Space',
                    'Build Your Project',
                    'Showcase & Graduation',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 text-xs flex items-center justify-center">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  AI Mastery (14+ & Professionals)
                </h3>
                <ul className="space-y-2 text-purple-200 text-sm">
                  {[
                    'AI Foundations',
                    'Prompt Engineering',
                    'AI for Productivity',
                    'Machine Learning',
                    'NLP Basics',
                    'Computer Vision',
                    'AI in Business',
                    'Building AI Apps',
                    'AI Ethics',
                    'AI Careers',
                    'Capstone Project',
                    'Showcase & Certification',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">FAQ</h2>
            <div className="space-y-4">
              {[
                { q: 'Is this really free?', a: 'Yes! 100% free. No hidden fees.' },
                {
                  q: 'Do I need any experience?',
                  a: 'No prior experience required. We start from basics.',
                },
                {
                  q: 'What do I need to join?',
                  a: 'Just a computer/tablet with internet. All sessions are online.',
                },
                {
                  q: 'Will I get a certificate?',
                  a: 'Yes! Complete the 12 weeks to earn your certificate.',
                },
              ].map((faq, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-1">{faq.q}</h3>
                  <p className="text-purple-200 text-sm">{faq.a}</p>
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

// Program Selection Card
function ProgramCard({
  program,
  title,
  subtitle,
  schedule,
  icon: Icon,
  gradient,
  selected,
  onSelect,
}: {
  program: Program;
  title: string;
  subtitle: string;
  schedule: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
        selected
          ? `bg-gradient-to-r ${gradient} border-white shadow-lg scale-[1.02]`
          : 'bg-white/5 border-white/20 hover:border-white/40 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${selected ? 'bg-white/20' : `bg-gradient-to-r ${gradient}`}`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-white/80 text-sm">{subtitle}</p>
        </div>
        {selected && <CheckCircle className="w-6 h-6 text-white ml-auto" />}
      </div>
      <div className="mt-4 flex items-center gap-2 text-white/80 text-sm">
        <Clock className="w-4 h-4" />
        <span>{schedule}</span>
      </div>
    </button>
  );
}
