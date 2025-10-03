import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useUserReviews } from '@/hooks/useUserReviews';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, User, ArrowLeft, Save, Star, MessageSquare, Mic, Video, RefreshCw, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NotificationSettings } from '@/components/NotificationSettings';

export default function Profile() {
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const { user, profile, updateProfile, loading } = useAuth();
  const { userReviews, loading: reviewsLoading, refetch: refetchReviews } = useUserReviews();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    
    if (profile) {
      setDisplayName(profile.display_name || '');
    }
  }, [user, profile, loading, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await updateProfile({
      display_name: displayName
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    }
    setIsLoading(false);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getReviewTypeIcon = (type: string) => {
    switch (type) {
      case 'voice':
        return <Mic className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white hover:text-secondary transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center gap-2 mb-4">
            <User className="h-8 w-8 text-secondary" />
            <span className="text-3xl font-display font-bold text-white">meAiborg</span>
          </div>
          <p className="text-white/80">Your personal AI learning dashboard</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-md border-white/20 md:grid-cols-3 overflow-x-auto">
            <TabsTrigger value="profile" className="text-white data-[state=active]:bg-white/20">
              Profile Settings
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-white data-[state=active]:bg-white/20">
              Notifications
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-white data-[state=active]:bg-white/20">
              Reviews Given ({userReviews.length})
            </TabsTrigger>
          </TabsList>

          {/* Public Profile Link */}
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/user/${user?.id}`, '_blank')}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Public Profile
            </Button>
          </div>

          <TabsContent value="profile">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-center">Account Information</CardTitle>
                <CardDescription className="text-white/80 text-center">
                  Update your profile details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="bg-white/5 border-white/20 text-white/60"
                    />
                    <p className="text-xs text-white/60">Email cannot be changed</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-white">Display Name</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Enter your display name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>

                  {profile && (
                    <div className="space-y-2">
                      <Label className="text-white">Role</Label>
                      <div className="p-2 bg-white/5 border border-white/20 rounded-md">
                        <span className="text-white/80 capitalize">{profile.role}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full btn-hero"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Update Profile
                  </Button>
                </form>

                {profile && (
                  <div className="mt-6 p-4 bg-white/5 rounded-lg">
                    <h3 className="text-white font-medium mb-2">Account Details</h3>
                    <div className="space-y-1 text-sm text-white/60">
                      <p>Member since: {new Date(profile.created_at).toLocaleDateString()}</p>
                      <p>Last updated: {new Date(profile.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-center">Reviews Given</CardTitle>
                    <CardDescription className="text-white/80 text-center">
                      Your reviews and feedback on AI courses
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refetchReviews}
                    disabled={reviewsLoading}
                    className="ml-4"
                  >
                    <RefreshCw className={`h-4 w-4 ${reviewsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
                    <p className="text-white/80">Loading your reviews...</p>
                  </div>
                ) : userReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-white/50 mx-auto mb-4" />
                    <h3 className="text-white font-medium mb-2">No Reviews Yet</h3>
                    <p className="text-white/60 mb-4">You haven't written any reviews yet.</p>
                    <Button 
                      onClick={() => navigate('/#reviews')}
                      className="btn-hero"
                    >
                      Write Your First Review
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {userReviews.map((review) => (
                      <Card key={review.id} className="bg-white/5 border-white/20">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {renderStars(review.rating)}
                              <span className="text-sm text-white/60">
                                {review.rating}/5
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={review.approved ? "default" : "secondary"} 
                                className="text-xs"
                              >
                                {review.approved ? "Approved" : "Pending"}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1 text-xs border-white/20">
                                {getReviewTypeIcon(review.review_type)}
                                {review.review_type}
                              </Badge>
                            </div>
                          </div>
                          
                          <h4 className="text-white font-medium mb-2">
                            {review.courses?.title || `Course ${review.course_id}`}
                          </h4>
                          
                          <div className="text-sm text-white/60 mb-2">
                            {review.course_period} • {review.course_mode.replace('-', ' ')}
                          </div>
                          
                          {review.review_type === 'written' && review.written_review && (
                            <p className="text-white/80 text-sm leading-relaxed">
                              "{review.written_review}"
                            </p>
                          )}
                          
                          {review.review_type === 'voice' && review.voice_review_url && (
                            <div className="text-center py-2">
                              <Mic className="h-6 w-6 text-white/60 mx-auto mb-1" />
                              <p className="text-xs text-white/60">Voice review submitted</p>
                            </div>
                          )}
                          
                          {review.review_type === 'video' && review.video_review_url && (
                            <div className="text-center py-2">
                              <Video className="h-6 w-6 text-white/60 mx-auto mb-1" />
                              <p className="text-xs text-white/60">Video review submitted</p>
                            </div>
                          )}
                          
                          <div className="mt-3 pt-3 border-t border-white/20">
                            <p className="text-xs text-white/50">
                              Submitted on {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}