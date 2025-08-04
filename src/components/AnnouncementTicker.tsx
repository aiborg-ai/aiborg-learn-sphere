import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Megaphone } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: number;
}

export function AnnouncementTicker() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (announcements.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
      }, 8000); // Change announcement every 8 seconds

      return () => clearInterval(interval);
    }
  }, [announcements.length]);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, content, priority')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  if (announcements.length === 0) return null;

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div className="bg-gradient-to-r from-primary via-secondary to-accent text-white py-3 overflow-hidden relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center">
          <Megaphone className="h-4 w-4 mr-2 flex-shrink-0" />
          <div className="overflow-hidden whitespace-nowrap max-w-full">
            <div className="inline-block ticker-animation">
              <span className="font-medium text-sm md:text-base">
                {currentAnnouncement.content}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes ticker-scroll {
          0% {
            transform: translateX(100vw);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .ticker-animation {
          animation: ticker-scroll 25s linear infinite;
        }
      `}</style>
    </div>
  );
}