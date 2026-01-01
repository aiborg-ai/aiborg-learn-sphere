/**
 * Surveys Page
 * Shows available surveys for visitors to participate in
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SurveyService,
  AUDIENCE_CATEGORIES,
  type Survey,
  type AudienceCategory,
} from '@/services/surveys';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';
import {
  ClipboardList,
  Briefcase,
  GraduationCap,
  Rocket,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Users,
  Clock,
} from 'lucide-react';

const CATEGORY_ICONS: Record<AudienceCategory, React.ReactNode> = {
  professional: <Briefcase className="h-5 w-5" />,
  student: <GraduationCap className="h-5 w-5" />,
  entrepreneur: <Rocket className="h-5 w-5" />,
  career_changer: <RefreshCw className="h-5 w-5" />,
};

export default function SurveysPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<Survey[]>([]);

  useEffect(() => {
    const loadSurveys = async () => {
      try {
        setLoading(true);
        const data = await SurveyService.getActiveSurveys();
        setSurveys(data);
      } catch (_error) {
        logger.error('Failed to load surveys:', _error);
      } finally {
        setLoading(false);
      }
    };

    loadSurveys();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Your Voice Matters
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Shape the Future of Learning</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tell us what you want to learn. Your feedback directly influences the courses and
            content we create.
          </p>
        </div>
      </section>

      {/* Audience Categories */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Who We Serve</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {AUDIENCE_CATEGORIES.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 text-center">
                    <div
                      className={cn(
                        'inline-flex items-center justify-center w-14 h-14 rounded-full mb-4',
                        category.id === 'professional' && 'bg-blue-500/10 text-blue-500',
                        category.id === 'student' && 'bg-green-500/10 text-green-500',
                        category.id === 'entrepreneur' && 'bg-purple-500/10 text-purple-500',
                        category.id === 'career_changer' && 'bg-orange-500/10 text-orange-500'
                      )}
                    >
                      {CATEGORY_ICONS[category.id]}
                    </div>
                    <h3 className="font-semibold mb-2">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Surveys */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Active Surveys</h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-10 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : surveys.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Surveys</h3>
                <p className="text-muted-foreground">Check back soon for new surveys!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {surveys.map((survey, index) => (
                <motion.div
                  key={survey.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{survey.title}</CardTitle>
                          {survey.description && (
                            <CardDescription className="mt-1">{survey.description}</CardDescription>
                          )}
                        </div>
                        {survey.target_category && (
                          <Badge variant="outline">
                            {CATEGORY_ICONS[survey.target_category]}
                            <span className="ml-1">
                              {AUDIENCE_CATEGORIES.find(c => c.id === survey.target_category)?.name}
                            </span>
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {survey.ends_at && (
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Ends {new Date(survey.ends_at).toLocaleDateString()}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {survey.allow_anonymous ? 'Anonymous' : 'Requires login'}
                          </span>
                        </div>
                        <Button onClick={() => navigate(`/surveys/${survey.id}`)}>
                          Take Survey
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Want to Learn Something Specific?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find a survey for your topic? Let us know directly what skills you want to
            develop.
          </p>
          <Button variant="outline" size="lg" onClick={() => navigate('/contact')}>
            Contact Us
          </Button>
        </div>
      </section>
    </div>
  );
}
