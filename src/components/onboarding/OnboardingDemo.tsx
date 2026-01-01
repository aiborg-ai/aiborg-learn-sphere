/**
 * Onboarding Demo Component
 *
 * Demonstrates how to integrate progressive onboarding tips throughout the app.
 * Use this as a reference for adding onboarding to different pages.
 */

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OnboardingTooltip } from './OnboardingTooltip';
import { OnboardingProgress } from './OnboardingProgress';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { BookOpen, Calendar, Wand2, Brain } from 'lucide-react';

export function OnboardingDemo() {
  const { shouldShowTip, markMilestone } = useOnboardingContext();

  // Mark that user has explored dashboard
  useEffect(() => {
    markMilestone('has_explored_dashboard');
  }, [markMilestone]);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Progressive Onboarding Demo</h1>
        <p className="text-muted-foreground">
          This demonstrates how onboarding tips appear as users explore different features.
        </p>
      </div>

      {/* Progress Widget */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <OnboardingProgress />
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Example 1: Tooltip on Button */}
          <Card>
            <CardHeader>
              <CardTitle>Example 1: Button with Tooltip</CardTitle>
            </CardHeader>
            <CardContent>
              {shouldShowTip('demo-courses-button') ? (
                <OnboardingTooltip
                  tipId="demo-courses-button"
                  title="Browse Courses"
                  description="Click here to explore all available courses. You can filter by level, category, and format."
                  icon="BookOpen"
                  placement="bottom"
                  delay={500}
                >
                  <Button className="gap-2">
                    <BookOpen size={18} />
                    Browse Courses
                  </Button>
                </OnboardingTooltip>
              ) : (
                <Button className="gap-2">
                  <BookOpen size={18} />
                  Browse Courses
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Example 2: Multiple Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Example 2: Multiple Interactive Elements</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              {shouldShowTip('demo-events-button') ? (
                <OnboardingTooltip
                  tipId="demo-events-button"
                  title="Attend Events"
                  description="Join live workshops, webinars, and community events to learn with others."
                  icon="Calendar"
                  placement="top"
                  delay={1000}
                >
                  <Button variant="outline" className="gap-2">
                    <Calendar size={18} />
                    View Events
                  </Button>
                </OnboardingTooltip>
              ) : (
                <Button variant="outline" className="gap-2">
                  <Calendar size={18} />
                  View Events
                </Button>
              )}

              {shouldShowTip('demo-studio-button') ? (
                <OnboardingTooltip
                  tipId="demo-studio-button"
                  title="Content Studio"
                  description="Create professional courses, events, and blog posts with AI-powered tools."
                  icon="Wand2"
                  placement="top"
                  delay={1500}
                >
                  <Button variant="outline" className="gap-2">
                    <Wand2 size={18} />
                    Open Studio
                  </Button>
                </OnboardingTooltip>
              ) : (
                <Button variant="outline" className="gap-2">
                  <Wand2 size={18} />
                  Open Studio
                </Button>
              )}

              {shouldShowTip('demo-ai-button') ? (
                <OnboardingTooltip
                  tipId="demo-ai-button"
                  title="AI Assistant"
                  description="Get instant answers and personalized learning recommendations from our AI chatbot."
                  icon="Brain"
                  placement="top"
                  delay={2000}
                >
                  <Button variant="outline" className="gap-2">
                    <Brain size={18} />
                    Ask AI
                  </Button>
                </OnboardingTooltip>
              ) : (
                <Button variant="outline" className="gap-2">
                  <Brain size={18} />
                  Ask AI
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Example 3: Card with Tooltip */}
          <div>
            {shouldShowTip('demo-feature-card') ? (
              <OnboardingTooltip
                tipId="demo-feature-card"
                title="Learning Features"
                description="This card shows your personalized learning recommendations based on your progress and interests."
                placement="left"
                delay={2500}
              >
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>Personalized Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Our AI analyzes your learning patterns to suggest the most relevant courses
                      and content.
                    </p>
                  </CardContent>
                </Card>
              </OnboardingTooltip>
            ) : (
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Personalized Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Our AI analyzes your learning patterns to suggest the most relevant courses and
                    content.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Integration Guide */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Integration Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">How to Add Onboarding to Your Pages:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Wrap your component with the OnboardingTooltip</li>
                  <li>Provide a unique tipId, title, and description</li>
                  <li>Use shouldShowTip() to conditionally render</li>
                  <li>Tips are automatically tracked when users click "Got it"</li>
                  <li>Mark milestones using markMilestone() when users complete actions</li>
                </ol>
              </div>

              <div className="p-4 bg-background rounded-lg">
                <pre className="text-xs overflow-x-auto">
                  {`// Example usage:
import { OnboardingTooltip } from '@/components/onboarding/OnboardingTooltip';
import { useOnboardingContext } from '@/contexts/OnboardingContext';

function MyComponent() {
  const { shouldShowTip, markMilestone } = useOnboardingContext();

  const handleEnroll = () => {
    // ... enrollment logic
    markMilestone('has_enrolled_in_course');
  };

  return (
    shouldShowTip('my-tip-id') ? (
      <OnboardingTooltip
        tipId="my-tip-id"
        title="Enroll in Course"
        description="Click to start learning!"
        icon="BookOpen"
      >
        <Button onClick={handleEnroll}>Enroll</Button>
      </OnboardingTooltip>
    ) : (
      <Button onClick={handleEnroll}>Enroll</Button>
    )
  );
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
