import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Users, Loader2, RefreshCw, AlertCircle, Filter } from 'lucide-react';
import { SessionCard, SessionRegistrationForm, SessionNotifications } from '@/components/sessions';
import { useSessionData } from '@/hooks/useSessionData';
import { useAuth } from '@/hooks/useAuth';
import type { SessionWithCounts } from '@/types/session';

/**
 * SessionsPage - Main page for browsing and registering for free sessions
 *
 * Features:
 * - List of upcoming sessions
 * - Session registration with waitlist support
 * - User's session notifications and registrations
 * - Filter by availability (all sessions, available only, full only)
 */
export const SessionsPage = () => {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState<SessionWithCounts | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [includeFullSessions, setIncludeFullSessions] = useState(true);

  // Fetch sessions
  const { sessions, loading, error, refetch } = useSessionData({
    status: 'scheduled',
    isPublished: true,
    includeFullSessions,
    upcomingOnly: true,
  });

  const handleRegisterClick = (session: SessionWithCounts) => {
    setSelectedSession(session);
    setShowRegistrationForm(true);
  };

  const handleRegistrationSuccess = () => {
    // Refresh sessions to update counts
    refetch();
  };

  const availableSessions = sessions.filter(s => !s.is_full);
  const fullSessions = sessions.filter(s => s.is_full);

  return (
    <>
      <Helmet>
        <title>Free AI Sessions | AIBorg Learn Sphere</title>
        <meta
          name="description"
          content="Join our free introductory AI sessions. Learn about artificial intelligence, machine learning, and more in interactive online sessions."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">Free AI Learning Sessions</h1>
              <p className="text-lg md:text-xl text-blue-100">
                Join our interactive online sessions and discover the world of Artificial
                Intelligence. Perfect for beginners and curious minds aged 9-18!
              </p>
              <div className="flex items-center justify-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm">90-minute sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">Small group learning</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-7xl mx-auto">
            <Tabs defaultValue="upcoming" className="space-y-6">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="upcoming">
                  <Calendar className="w-4 h-4 mr-2" />
                  Upcoming Sessions
                </TabsTrigger>
                <TabsTrigger value="my-sessions" disabled={!user}>
                  <Users className="w-4 h-4 mr-2" />
                  My Registrations
                </TabsTrigger>
              </TabsList>

              {/* Upcoming Sessions Tab */}
              <TabsContent value="upcoming" className="space-y-6">
                {/* Filters */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Filter:</span>
                    <Button
                      variant={includeFullSessions ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIncludeFullSessions(true)}
                    >
                      All Sessions
                    </Button>
                    <Button
                      variant={!includeFullSessions ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIncludeFullSessions(false)}
                    >
                      Available Only
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                </div>

                {/* Error State */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {error}
                      <Button variant="outline" size="sm" onClick={refetch} className="ml-4">
                        Try Again
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                )}

                {/* Sessions List */}
                {!loading && !error && (
                  <>
                    {/* Available Sessions */}
                    {availableSessions.length > 0 && (
                      <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          Available Sessions
                          <span className="text-sm font-normal text-gray-500">
                            ({availableSessions.length})
                          </span>
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {availableSessions.map(session => (
                            <SessionCard
                              key={session.id}
                              session={session}
                              onRegisterClick={handleRegisterClick}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Full Sessions */}
                    {includeFullSessions && fullSessions.length > 0 && (
                      <div className="space-y-4 pt-8">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          Full Sessions (Waitlist Available)
                          <span className="text-sm font-normal text-gray-500">
                            ({fullSessions.length})
                          </span>
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {fullSessions.map(session => (
                            <SessionCard
                              key={session.id}
                              session={session}
                              onRegisterClick={handleRegisterClick}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {sessions.length === 0 && (
                      <div className="text-center py-16">
                        <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          No Sessions Available
                        </h3>
                        <p className="text-gray-600 mb-4">
                          There are no upcoming sessions at the moment. Check back soon!
                        </p>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* My Registrations Tab */}
              <TabsContent value="my-sessions">
                {user ? (
                  <div className="max-w-3xl mx-auto">
                    <SessionNotifications maxDisplay={10} />
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please log in to view your session registrations.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Info Section */}
        <section className="bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                About Our Free Sessions
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Interactive Learning</h3>
                  <p className="text-sm text-gray-600">
                    90-minute sessions with hands-on activities and real-time interaction with
                    instructors.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Small Groups</h3>
                  <p className="text-sm text-gray-600">
                    Limited capacity ensures personalized attention and better learning outcomes.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <AlertCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">COPPA Compliant</h3>
                  <p className="text-sm text-gray-600">
                    Parent consent required for participants under 13, ensuring a safe learning
                    environment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Registration Form Modal */}
      {selectedSession && (
        <SessionRegistrationForm
          isOpen={showRegistrationForm}
          onClose={() => {
            setShowRegistrationForm(false);
            setSelectedSession(null);
          }}
          session={selectedSession}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </>
  );
};

export default SessionsPage;
