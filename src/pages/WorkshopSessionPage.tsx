/**
 * WorkshopSessionPage
 * Page for active workshop session
 */

import { useParams, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { WorkshopSessionRoom } from '@/components/workshop/WorkshopSessionRoom';
import { useAuth } from '@/hooks/useAuth';
import { Icon } from '@/utils/iconLoader';

export default function WorkshopSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!sessionId) {
    return <Navigate to="/workshops" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <WorkshopSessionRoom sessionId={sessionId} />
      </main>
      <Footer />
    </div>
  );
}
