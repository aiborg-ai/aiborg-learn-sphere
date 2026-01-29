import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Star, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const SUPABASE_URL = 'https://afrulkxxzcmngbrdfuzj.supabase.co';

interface RegistrationInfo {
  valid: boolean;
  name: string;
  program: string;
  country: string;
}

export default function Season2ReviewPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [registrationInfo, setRegistrationInfo] = useState<RegistrationInfo | null>(null);

  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [testimonial, setTestimonial] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showCountry, setShowCountry] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('No review token provided. Please use the link from your email.');
      setLoading(false);
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/season2-review?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Invalid review link');
        setLoading(false);
        return;
      }

      setRegistrationInfo(data);
      // Suggest a display name
      const nameParts = data.name.split(' ');
      if (nameParts.length > 1) {
        setDisplayName(`${nameParts[0]} ${nameParts[1][0]}.`);
      } else {
        setDisplayName(nameParts[0]);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to verify your review link. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (testimonial.length < 20) {
      setError('Please write at least 20 characters in your review');
      return;
    }

    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/season2-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          rating,
          testimonial,
          displayName: displayName.trim(),
          showCountry,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Failed to submit review');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Failed to submit review. Please try again.');
      setSubmitting(false);
    }
  };

  const programName =
    registrationInfo?.program === 'under14'
      ? 'AI Explorers (Under 14)'
      : 'AI Mastery (14+ & Professionals)';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white">Verifying your review link...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your review has been submitted successfully. It will be visible on our website after
            approval.
          </p>
          <Link to="/">
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600">
              Back to AIBORG
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error && !registrationInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/">
            <Button variant="outline">Back to AIBORG</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Share Your Experience</h1>
          <p className="text-purple-200">
            Help others by sharing your experience with {programName}
          </p>
        </div>

        {/* Review Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <Label className="text-lg font-semibold mb-3 block">
                How would you rate the program?
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  {rating === 5 && 'Excellent!'}
                  {rating === 4 && 'Very Good'}
                  {rating === 3 && 'Good'}
                  {rating === 2 && 'Fair'}
                  {rating === 1 && 'Poor'}
                </p>
              )}
            </div>

            {/* Testimonial */}
            <div>
              <Label htmlFor="testimonial" className="text-lg font-semibold mb-2 block">
                Your Review
              </Label>
              <Textarea
                id="testimonial"
                placeholder="Share your experience with the program. What did you learn? How has it helped you? Would you recommend it to others?"
                value={testimonial}
                onChange={e => setTestimonial(e.target.value)}
                rows={5}
                className="resize-none"
                maxLength={1000}
              />
              <p className="text-sm text-gray-500 mt-1">
                {testimonial.length}/1000 characters (minimum 20)
              </p>
            </div>

            {/* Display Name */}
            <div>
              <Label htmlFor="displayName" className="text-lg font-semibold mb-2 block">
                Display Name
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                This is how your name will appear with your testimonial
              </p>
              <Input
                id="displayName"
                placeholder="e.g., John D. or Parent of Alex"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={50}
              />
            </div>

            {/* Show Country */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showCountry"
                checked={showCountry}
                onCheckedChange={checked => setShowCountry(checked as boolean)}
              />
              <Label htmlFor="showCountry" className="text-sm text-gray-600 cursor-pointer">
                Show my country ({registrationInfo?.country}) with my testimonial
              </Label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 py-6 text-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-purple-300 text-sm mt-6">
          Your review will be visible after approval. Thank you for helping us improve!
        </p>
      </div>
    </div>
  );
}
