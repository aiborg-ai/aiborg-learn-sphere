import { useState, useEffect } from 'react';
import { Star, Quote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface Testimonial {
  id: string;
  rating: number;
  testimonial: string;
  display_name: string;
  show_country: boolean;
  program: string;
  country?: string;
  created_at: string;
}

export function Season2Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('season2_reviews')
        .select(
          `
          id,
          rating,
          testimonial,
          display_name,
          show_country,
          program,
          created_at,
          season2_registrations!inner(country)
        `
        )
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      const formattedData = data?.map((item: Record<string, unknown>) => ({
        ...item,
        country: (item.season2_registrations as { country: string })?.country,
      })) as Testimonial[];

      setTestimonials(formattedData || []);
    } catch (err) {
      logger.error('Error fetching testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="animate-pulse flex space-x-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 space-y-4 py-1">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return null; // Don't show section if no testimonials
  }

  const programName = (program: string) => (program === 'under14' ? 'AI Explorers' : 'AI Mastery');

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Learners Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Hear from participants of our free AI classes
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map(testimonial => (
            <div
              key={testimonial.id}
              className="bg-white rounded-xl shadow-lg p-6 relative overflow-hidden"
            >
              {/* Quote icon */}
              <Quote className="absolute top-4 right-4 w-8 h-8 text-purple-100" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= testimonial.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Testimonial text */}
              <p className="text-gray-700 mb-4 line-clamp-4">{testimonial.testimonial}</p>

              {/* Author */}
              <div className="border-t pt-4">
                <p className="font-semibold text-gray-900">{testimonial.display_name}</p>
                <p className="text-sm text-purple-600">
                  {programName(testimonial.program)}
                  {testimonial.show_country && testimonial.country && (
                    <span className="text-gray-500"> • {testimonial.country}</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
