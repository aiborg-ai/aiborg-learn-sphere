import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calendar } from 'lucide-react';
import { ReviewForm } from '@/components/forms';
import EventReviewForm from '@/components/events/EventReviewForm';
import { useAuth } from '@/hooks/useAuth';

export default function UnifiedReviewForm() {
  const [activeTab, setActiveTab] = useState('courses');
  const { user } = useAuth();

  if (!user) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Please sign in to submit reviews.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Share Your Experience</CardTitle>
        <CardDescription>
          Help others by sharing your honest feedback about courses and events you've attended.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Course Review
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Event Review
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-6">
            <ReviewForm />
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <EventReviewForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
