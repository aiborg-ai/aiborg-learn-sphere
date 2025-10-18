/**
 * WorkshopsPage
 * Main page for listing all available workshops
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar, Footer } from '@/components/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icon } from '@/utils/iconLoader';
import { WorkshopList } from '@/components/workshop/WorkshopList';
import { useWorkshopSessions } from '@/hooks/useWorkshopSessions';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { Workshop } from '@/services/workshop/types';

export default function WorkshopsPage() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Fetch all published workshops
  const {
    data: workshops,
    isLoading: workshopsLoading,
    error: workshopsError,
  } = useQuery({
    queryKey: ['all-workshops', courseId],
    queryFn: async () => {
      let query = supabase
        .from('workshops')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (courseId) {
        query = query.eq('course_id', parseInt(courseId));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Workshop[];
    },
  });

  // Fetch all sessions
  const {
    data: sessions,
    isLoading: sessionsLoading,
  } = useQuery({
    queryKey: ['all-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshop_sessions')
        .select('*')
        .in('status', ['scheduled', 'in_progress'])
        .order('scheduled_start', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Check user enrollment
  const {
    data: userEnrollments,
  } = useQuery({
    queryKey: ['user-workshop-enrollments', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('workshop_participants')
        .select('session_id, workshop_sessions(workshop_id)')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Join session handler
  const { joinSession, isJoining } = useWorkshopSessions();

  const handleJoinSession = (sessionId: string) => {
    if (!user) {
      alert('Please sign in to join a workshop session');
      return;
    }

    joinSession({
      session_id: sessionId,
      user_id: user.id,
      role: 'participant',
    });
  };

  // Check if user is enrolled in a workshop
  const isEnrolled = (workshopId: string) => {
    return userEnrollments?.some(
      (enrollment: { workshop_sessions: { workshop_id: string } }) =>
        enrollment.workshop_sessions.workshop_id === workshopId
    ) ?? false;
  };

  // Filter workshops
  const filteredWorkshops = workshops?.filter(workshop => {
    const matchesSearch = workshop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workshop.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDifficulty = difficultyFilter === 'all' || workshop.difficulty_level === difficultyFilter;

    return matchesSearch && matchesDifficulty;
  }) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Collaborative Workshops</h1>
          <p className="text-lg text-muted-foreground">
            Join interactive workshops and collaborate with peers to solve real-world problems
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Info" size={24} />
              How Workshops Work
            </CardTitle>
            <CardDescription>
              Workshops follow a structured 4-stage collaborative process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center text-center p-4 bg-background rounded-lg">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                  <Icon name="Settings" size={24} className="text-primary" />
                </div>
                <h3 className="font-semibold mb-1">1. Setup</h3>
                <p className="text-sm text-muted-foreground">Review materials and meet your team</p>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-background rounded-lg">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                  <Icon name="Target" size={24} className="text-primary" />
                </div>
                <h3 className="font-semibold mb-1">2. Problem</h3>
                <p className="text-sm text-muted-foreground">Understand the problem statement</p>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-background rounded-lg">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                  <Icon name="Lightbulb" size={24} className="text-primary" />
                </div>
                <h3 className="font-semibold mb-1">3. Solving</h3>
                <p className="text-sm text-muted-foreground">Collaborate to develop solutions</p>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-background rounded-lg">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                  <Icon name="Presentation" size={24} className="text-primary" />
                </div>
                <h3 className="font-semibold mb-1">4. Reporting</h3>
                <p className="text-sm text-muted-foreground">Present your solution</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search workshops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Difficulty Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        {workshops && workshops.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Workshops</p>
                    <p className="text-2xl font-bold">{workshops.length}</p>
                  </div>
                  <Icon name="BookOpen" size={32} className="text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Upcoming Sessions</p>
                    <p className="text-2xl font-bold">{sessions?.length || 0}</p>
                  </div>
                  <Icon name="Calendar" size={32} className="text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Your Enrollments</p>
                    <p className="text-2xl font-bold">{userEnrollments?.length || 0}</p>
                  </div>
                  <Icon name="Users" size={32} className="text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Workshops List */}
        <WorkshopList
          workshops={filteredWorkshops}
          sessions={sessions || []}
          isEnrolled={isEnrolled}
          onJoinSession={handleJoinSession}
          loading={workshopsLoading || sessionsLoading || isJoining}
        />

        {/* Error State */}
        {workshopsError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-900">
                <Icon name="AlertCircle" size={20} />
                <p>Failed to load workshops. Please try again later.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
