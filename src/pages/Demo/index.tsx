/**
 * Demo Entry Page
 * Password-free demo access for stakeholder demonstrations
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Play,
  Sparkles,
  GraduationCap,
  Shield,
  CheckCircle,
  ArrowRight,
  Clock,
  BookOpen,
  BarChart3,
  Users,
  Brain,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useDemo, DEMO_USER_CONFIGS } from '@/contexts/DemoContext';

interface DemoUserCardProps {
  userType: 'learner' | 'admin';
  config: (typeof DEMO_USER_CONFIGS)['learner'];
  onSelect: () => void;
  isLoading: boolean;
  isSelected: boolean;
}

function DemoUserCard({ userType, config, onSelect, isLoading, isSelected }: DemoUserCardProps) {
  const Icon = userType === 'admin' ? Shield : GraduationCap;
  const gradientClass =
    userType === 'admin'
      ? 'from-purple-50 to-indigo-50 border-purple-200 hover:border-purple-400'
      : 'from-blue-50 to-cyan-50 border-blue-200 hover:border-blue-400';

  return (
    <button
      onClick={onSelect}
      disabled={isLoading}
      className={`w-full p-6 border-2 rounded-xl bg-gradient-to-r ${gradientClass} transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform hover:-translate-y-1`}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white/70 rounded-lg shadow-sm">
          {isLoading && isSelected ? (
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          ) : (
            <Icon className="w-8 h-8 text-primary" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-lg text-gray-900">{config.displayName}</h3>
            <Badge variant="outline" className="text-xs">
              {config.role}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-4">{config.description}</p>
          <ul className="space-y-2">
            {config.features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-gray-400">
          <Play className="w-6 h-6" />
        </div>
      </div>
    </button>
  );
}

export default function DemoPage() {
  const { startDemo, isLoading, error } = useDemo();
  const [selectedType, setSelectedType] = useState<'learner' | 'admin' | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleSelectDemo = async (userType: 'learner' | 'admin') => {
    setSelectedType(userType);
    setCountdown(3);

    // Start countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          startDemo(userType);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Personalized course recommendations and assessments',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      icon: BookOpen,
      title: 'Rich Content Library',
      description: 'Courses, workshops, and knowledgebase resources',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      icon: BarChart3,
      title: 'Progress Tracking',
      description: 'Analytics and achievement tracking',
      color: 'bg-green-100 text-green-700',
    },
    {
      icon: Users,
      title: 'Community Features',
      description: 'Reviews, events, and summit resources',
      color: 'bg-orange-100 text-orange-700',
    },
  ];

  // Loading state with countdown
  if (countdown !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-32 h-32 mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <Sparkles className="h-16 w-16 text-purple-600 animate-pulse" />
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">Preparing Your Demo Experience</h2>
          <p className="text-xl text-gray-600 mb-8">
            Loading AIBORG with sample data as {selectedType === 'admin' ? 'Admin' : 'Learner'}...
          </p>

          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-8">
            {countdown}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center text-gray-600">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span>Demo environment initialized</span>
            </div>
            <div className="flex items-center justify-center text-gray-600">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span>Sample data loaded</span>
            </div>
            {countdown < 2 && (
              <div className="flex items-center justify-center text-gray-600 animate-fadeIn">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span>
                  Redirecting to {selectedType === 'admin' ? 'admin dashboard' : 'dashboard'}...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-sm font-semibold mb-6">
              <Sparkles className="h-4 w-4 mr-2" />
              Interactive Demo - No Login Required
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Experience AIBORG
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mt-2">
                Live Platform Demo
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Explore the full power of our AI-powered learning platform with real features, sample
              data, and interactive demonstrations. No registration needed.
            </p>

            {/* Demo Highlights */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="flex items-center text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span>No signup required</span>
              </div>
              <div className="flex items-center text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span>Full platform access</span>
              </div>
              <div className="flex items-center text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span>Real sample data</span>
              </div>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-50">
          <div className="w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 opacity-50">
          <div className="w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        </div>
      </div>

      {/* Demo User Selection */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Demo Experience</h2>
          <p className="text-gray-600">
            Select a role to explore the platform from that perspective
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 mb-12">
          <DemoUserCard
            userType="learner"
            config={DEMO_USER_CONFIGS.learner}
            onSelect={() => handleSelectDemo('learner')}
            isLoading={isLoading}
            isSelected={selectedType === 'learner'}
          />
          <DemoUserCard
            userType="admin"
            config={DEMO_USER_CONFIGS.admin}
            onSelect={() => handleSelectDemo('admin')}
            isLoading={isLoading}
            isSelected={selectedType === 'admin'}
          />
        </div>

        {/* Or sign in */}
        <div className="text-center mb-16">
          <p className="text-gray-500 mb-4">Already have an account?</p>
          <Button variant="outline" asChild>
            <Link to="/auth">
              Sign In to Your Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What You'll Experience</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Full access to all platform features with realistic sample data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex p-3 rounded-lg ${feature.color} mb-4`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-purple-100">AI Courses</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">7</div>
              <div className="text-purple-100">Summit Themes</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">4</div>
              <div className="text-purple-100">KB Topics</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-purple-100">Free Access</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Sparkles className="h-12 w-12 text-purple-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Explore?</h2>
          <p className="text-xl text-gray-600 mb-8">
            See why learners and organizations trust AIBORG for their AI education needs.
          </p>
          <Button
            size="lg"
            onClick={() => handleSelectDemo('learner')}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Play className="mr-2 h-5 w-5" />
            Launch Demo Now
          </Button>

          <div className="mt-6 flex items-center justify-center text-gray-500">
            <Clock className="h-5 w-5 mr-2" />
            <span>Takes only 2 minutes to explore</span>
          </div>
        </div>
      </div>
    </div>
  );
}
