import { Button } from '@/components/ui/button';
import { ArrowLeft } from '@/components/ui/icons';
import { useNavigate } from 'react-router-dom';
import { CalendarView } from '@/components/calendar/CalendarView';

export default function CalendarPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <CalendarView />
      </div>
    </div>
  );
}
