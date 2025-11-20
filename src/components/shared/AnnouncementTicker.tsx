import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Megaphone } from '@/components/ui/icons';

import { logger } from '@/utils/logger';
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
        setCurrentIndex(prev => (prev + 1) % announcements.length);
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
      logger.error('Error fetching announcements:', error);
    }
  };

  if (announcements.length === 0) return null;

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div className="bg-primary text-primary-foreground py-2 overflow-hidden relative border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center">
          <Megaphone className="h-4 w-4 mr-3 flex-shrink-0 animate-pulse" />
          <div className="overflow-hidden flex-1">
            <div className="ticker-scroll whitespace-nowrap">
              <span className="font-medium text-sm md:text-base inline-block">
                {currentAnnouncement.content}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .ticker-scroll {
          animation: ticker 20s linear infinite;
          display: inline-block;
        }
        
        /* Pause animation on hover */
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
