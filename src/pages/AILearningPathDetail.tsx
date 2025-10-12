import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  Lock,
  Play,
  Trophy,
  Target,
  TrendingUp,
  Loader2,
  Calendar,
  Award,
  Zap,
  Brain,
  FileText,
  Users,
  CalendarDays,
  Star,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface PathItem {
  id: string;
  order_index: number;
  week_number: number;
  item_type: string;
  item_id: string;
  item_title: string;
  item_description: string;
  difficulty_level: string;
  estimated_hours: number;
  is_required: boolean;
  status: string;
  reason_for_inclusion: string;
  addresses_weaknesses: string[];
  confidence_score: number;
}

interface Milestone {
  id: string;
  milestone_order: number;
  milestone_title: string;
  milestone_description: string;
  minimum_completion_percentage: number;
  reward_badge: string;
  reward_points: number;
  reward_message: string;
  is_completed: boolean;
}

interface LearningPath {
  id: string;
  path_title: string;
  path_description: string;
  difficulty_start: string;
  difficulty_end: string;
  estimated_completion_weeks: number;
  estimated_total_hours: number;
  progress_percentage: number;
  items_completed: number;
  total_items: number;
  current_item_index: number;
  milestones_completed: number;
  total_milestones: number;
}

const ITEM_TYPE_CONFIG = {
  course: { icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Course' },
  exercise: { icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Exercise' },
  quiz: { icon: Brain, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Quiz' },
  workshop: { icon: Users, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Workshop' },
  event: { icon: CalendarDays, color: 'text-pink-500', bg: 'bg-pink-500/10', label: 'Event' },
  assessment: {
    icon: Target,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    label: 'Assessment',
  },
};

const STATUS_CONFIG = {
  locked: { icon: Lock, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Locked' },
  available: { icon: Play, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Available' },
  in_progress: {
    icon: Zap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    label: 'In Progress',
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    label: 'Completed',
  },
  skipped: { icon: ArrowLeft, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Skipped' },
};

export default function AILearningPathDetail() {
  const { pathId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [items, setItems] = useState<PathItem[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [groupedByWeek, setGroupedByWeek] = useState<Record<number, PathItem[]>>({});

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchPathData();
  }, [user, pathId]);

  const fetchPathData = async () => {
    if (!user || !pathId) return;

    try {
      setLoading(true);

      // Fetch path details
      const { data: pathData, error: pathError } = await supabase
        .from('ai_generated_learning_paths')
        .select('*')
        .eq('id', pathId)
        .eq('user_id', user.id)
        .single();

      if (pathError) throw pathError;
      setPath(pathData);

      // Fetch path items
      const { data: itemsData, error: itemsError } = await supabase
        .from('learning_path_items')
        .select('*')
        .eq('ai_learning_path_id', pathId)
        .order('order_index', { ascending: true });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Group items by week
      const grouped = (itemsData || []).reduce(
        (acc, item) => {
          const week = item.week_number || 1;
          if (!acc[week]) acc[week] = [];
          acc[week].push(item);
          return acc;
        },
        {} as Record<number, PathItem[]>
      );
      setGroupedByWeek(grouped);

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('learning_path_milestones')
        .select('*')
        .eq('ai_learning_path_id', pathId)
        .order('milestone_order', { ascending: true });

      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData || []);
    } catch (error) {
      logger.error('Error fetching path data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load learning path',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (item: PathItem) => {
    if (item.status === 'locked') {
      toast({
        title: 'Item Locked',
        description: 'Complete previous items to unlock this one',
        variant: 'destructive',
      });
      return;
    }

    // Mark as in progress if available
    if (item.status === 'available') {
      await supabase
        .from('learning_path_items')
        .update({ status: 'in_progress', started_at: new Date().toISOString() })
        .eq('id', item.id);
    }

    // Navigate to content
    if (item.item_type === 'course') {
      navigate(`/course/${item.item_id}`);
    } else if (item.item_type === 'workshop' || item.item_type === 'event') {
      navigate(`/events`);
    } else if (item.item_type === 'assessment') {
      navigate(`/ai-assessment`);
    }
  };

  const handleCompleteItem = async (itemId: string) => {
    try {
      await supabase
        .from('learning_path_items')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      toast({
        title: 'Item Completed! 🎉',
        description: 'Great progress on your learning journey!',
      });

      fetchPathData();
    } catch (error) {
      logger.error('Error completing item:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!path) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Alert>
          <AlertDescription>Learning path not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentItem =
    items[path.current_item_index] ||
    items.find(i => i.status === 'available' || i.status === 'in_progress');
  const nextMilestone = milestones.find(m => !m.is_completed);

  return (
    <div className="min-h-screen bg-gradient-hero py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/profile?tab=learning-paths">
            <Button variant="outline" className="btn-outline-ai mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Learning Paths
            </Button>
          </Link>

          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{path.path_title}</h1>
              <p className="text-white/80">{path.path_description}</p>
            </div>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              <Zap className="h-3 w-3 mr-1" />
              AI-Generated
            </Badge>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Progress</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(path.progress_percentage)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-400" />
                </div>
                <Progress value={path.progress_percentage} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Completed</p>
                    <p className="text-2xl font-bold text-white">
                      {path.items_completed}/{path.total_items}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Duration</p>
                    <p className="text-2xl font-bold text-white">
                      {path.estimated_completion_weeks}w
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Milestones</p>
                    <p className="text-2xl font-bold text-white">
                      {path.milestones_completed}/{path.total_milestones}
                    </p>
                  </div>
                  <Trophy className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Current Item CTA */}
        {currentItem && (
          <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Badge className="mb-2">
                    {STATUS_CONFIG[currentItem.status as keyof typeof STATUS_CONFIG].label}
                  </Badge>
                  <h3 className="text-xl font-bold text-white mb-1">Continue Learning</h3>
                  <p className="text-white/80">{currentItem.item_title}</p>
                  <p className="text-white/60 text-sm mt-2">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {currentItem.estimated_hours}h • Week {currentItem.week_number}
                  </p>
                </div>
                <Button onClick={() => handleItemClick(currentItem)} className="btn-hero">
                  <Play className="h-4 w-4 mr-2" />
                  {currentItem.status === 'in_progress' ? 'Continue' : 'Start'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Milestone */}
        {nextMilestone && (
          <Card className="bg-yellow-500/10 border-yellow-500/30 mb-8">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-400" />
                <div className="flex-1">
                  <p className="text-white/60 text-sm">Next Milestone</p>
                  <p className="text-white font-medium">{nextMilestone.milestone_title}</p>
                  <Progress value={path.progress_percentage} className="mt-2 h-1" />
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-white border-yellow-500/30">
                    <Star className="h-3 w-3 mr-1" />
                    {nextMilestone.reward_points} pts
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Learning Path Timeline */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Learning Path Timeline</CardTitle>
            <CardDescription className="text-white/70">
              Your week-by-week learning journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {Object.entries(groupedByWeek).map(([week, weekItems]) => (
                <div key={week}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      W{week}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Week {week}</h3>
                      <p className="text-white/60 text-sm">
                        {weekItems.reduce((sum, item) => sum + item.estimated_hours, 0)}h total
                      </p>
                    </div>
                  </div>

                  <div className="ml-6 pl-6 border-l-2 border-white/10 space-y-4">
                    {weekItems.map((item, index) => {
                      const typeConfig =
                        ITEM_TYPE_CONFIG[item.item_type as keyof typeof ITEM_TYPE_CONFIG];
                      const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
                      const TypeIcon = typeConfig.icon;
                      const StatusIcon = statusConfig.icon;

                      return (
                        <div
                          key={item.id}
                          className={`p-4 rounded-lg border transition-all cursor-pointer ${
                            item.status === 'locked'
                              ? 'bg-white/5 border-white/10 opacity-60'
                              : 'bg-white/10 border-white/20 hover:bg-white/20'
                          }`}
                          onClick={() => handleItemClick(item)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`p-2 rounded-lg ${typeConfig.bg}`}>
                                <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-white font-medium">{item.item_title}</h4>
                                  {item.is_required && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs border-red-500/30 text-red-400"
                                    >
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-white/60 text-sm mb-2">
                                  {item.item_description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-white/50">
                                  <span>
                                    <Clock className="h-3 w-3 inline mr-1" />
                                    {item.estimated_hours}h
                                  </span>
                                  <span className="capitalize">{item.difficulty_level}</span>
                                  <Badge className={statusConfig.bg}>
                                    <StatusIcon className={`h-3 w-3 mr-1 ${statusConfig.color}`} />
                                    {statusConfig.label}
                                  </Badge>
                                </div>
                                {item.reason_for_inclusion && (
                                  <p className="text-white/50 text-xs mt-2 italic">
                                    💡 {item.reason_for_inclusion}
                                  </p>
                                )}
                              </div>
                            </div>
                            {item.status === 'in_progress' && (
                              <Button
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleCompleteItem(item.id);
                                }}
                                className="btn-hero"
                              >
                                Mark Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Milestones & Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {milestones.map(milestone => (
                <div
                  key={milestone.id}
                  className={`p-4 rounded-lg border ${
                    milestone.is_completed
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{milestone.milestone_title}</h4>
                      <p className="text-white/60 text-sm">{milestone.milestone_description}</p>
                    </div>
                    {milestone.is_completed ? (
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    ) : (
                      <Lock className="h-6 w-6 text-white/30" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="text-white border-white/20">
                      <Award className="h-3 w-3 mr-1" />
                      {milestone.reward_badge}
                    </Badge>
                    <Badge variant="outline" className="text-white border-white/20">
                      <Star className="h-3 w-3 mr-1" />
                      {milestone.reward_points} points
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
