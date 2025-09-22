import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  Trophy, Plus, Edit, Trash, Award, Users, Search,
  CheckCircle, XCircle, Loader2, Star, Shield
} from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_emoji: string;
  category: string;
  rarity: string;
  criteria: any;
  points: number;
  is_active: boolean;
  auto_allocate: boolean;
  created_at: string;
}

interface UserWithAchievements {
  user_id: string;
  email: string;
  display_name: string;
  achievements: string[];
}

export function AchievementManager() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [users, setUsers] = useState<UserWithAchievements[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAllocateDialogOpen, setIsAllocateDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('achievements');
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_emoji: '🏆',
    category: 'milestone',
    rarity: 'common',
    points: 10,
    auto_allocate: false,
    criteria_type: 'manual',
    criteria_value: ''
  });

  useEffect(() => {
    fetchAchievements();
    fetchUsers();
  }, []);

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      logger.error('Error fetching achievements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load achievements',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch all users with their achievements
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          email,
          display_name
        `);

      if (profileError) throw profileError;

      // Fetch user achievements
      const { data: achievementData, error: achievementError } = await supabase
        .from('user_achievements')
        .select(`
          user_id,
          achievement_id,
          achievements!inner(name)
        `);

      if (achievementError) throw achievementError;

      // Combine the data
      const usersWithAchievements = profileData?.map(user => {
        const userAchievements = achievementData
          ?.filter(ua => ua.user_id === user.user_id)
          .map(ua => ua.achievements?.name || '') || [];

        return {
          ...user,
          achievements: userAchievements
        };
      }) || [];

      setUsers(usersWithAchievements);
    } catch (error) {
      logger.error('Error fetching users:', error);
    }
  };

  const handleCreateAchievement = async () => {
    try {
      const criteria = formData.auto_allocate ? {
        type: formData.criteria_type,
        value: formData.criteria_value
      } : { type: 'manual' };

      const { error } = await supabase
        .from('achievements')
        .insert({
          name: formData.name,
          description: formData.description,
          icon_emoji: formData.icon_emoji,
          category: formData.category,
          rarity: formData.rarity,
          points: formData.points,
          auto_allocate: formData.auto_allocate,
          criteria,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Achievement created successfully'
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchAchievements();
    } catch (error) {
      logger.error('Error creating achievement:', error);
      toast({
        title: 'Error',
        description: 'Failed to create achievement',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateAchievement = async () => {
    if (!selectedAchievement) return;

    try {
      const criteria = formData.auto_allocate ? {
        type: formData.criteria_type,
        value: formData.criteria_value
      } : { type: 'manual' };

      const { error } = await supabase
        .from('achievements')
        .update({
          name: formData.name,
          description: formData.description,
          icon_emoji: formData.icon_emoji,
          category: formData.category,
          rarity: formData.rarity,
          points: formData.points,
          auto_allocate: formData.auto_allocate,
          criteria
        })
        .eq('id', selectedAchievement.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Achievement updated successfully'
      });

      setIsEditDialogOpen(false);
      resetForm();
      fetchAchievements();
    } catch (error) {
      logger.error('Error updating achievement:', error);
      toast({
        title: 'Error',
        description: 'Failed to update achievement',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return;

    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Achievement deleted successfully'
      });

      fetchAchievements();
    } catch (error) {
      logger.error('Error deleting achievement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete achievement',
        variant: 'destructive'
      });
    }
  };

  const handleAllocateAchievement = async () => {
    if (!selectedAchievement || !selectedUserId) return;

    try {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: selectedUserId,
          achievement_id: selectedAchievement.id,
          awarded_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      // Send notification to user
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedUserId,
          type: 'achievement',
          title: 'Achievement Unlocked!',
          message: `You have been awarded: ${selectedAchievement.name}`,
          data: { achievement_id: selectedAchievement.id }
        });

      toast({
        title: 'Success',
        description: 'Achievement allocated successfully'
      });

      setIsAllocateDialogOpen(false);
      setSelectedUserId('');
      fetchUsers();
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: 'Info',
          description: 'User already has this achievement',
          variant: 'default'
        });
      } else {
        logger.error('Error allocating achievement:', error);
        toast({
          title: 'Error',
          description: 'Failed to allocate achievement',
          variant: 'destructive'
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon_emoji: '🏆',
      category: 'milestone',
      rarity: 'common',
      points: 10,
      auto_allocate: false,
      criteria_type: 'manual',
      criteria_value: ''
    });
    setSelectedAchievement(null);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'epic': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'rare': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'course_completion': return <CheckCircle className="h-4 w-4" />;
      case 'skill_mastery': return <Star className="h-4 w-4" />;
      case 'engagement': return <Users className="h-4 w-4" />;
      case 'milestone': return <Trophy className="h-4 w-4" />;
      case 'special': return <Shield className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-400" />
              Achievement System
            </CardTitle>
            <CardDescription className="text-white/60">
              Manage badges and allocate achievements to users
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Achievement
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 text-white">
              <DialogHeader>
                <DialogTitle>Create New Achievement</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Define a new badge for users to earn
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Achievement name"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div>
                    <Label>Emoji Icon</Label>
                    <Input
                      value={formData.icon_emoji}
                      onChange={(e) => setFormData({ ...formData, icon_emoji: e.target.value })}
                      placeholder="🏆"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does this achievement represent?"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="course_completion">Course Completion</SelectItem>
                        <SelectItem value="skill_mastery">Skill Mastery</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="milestone">Milestone</SelectItem>
                        <SelectItem value="special">Special</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Rarity</Label>
                    <Select
                      value={formData.rarity}
                      onValueChange={(value) => setFormData({ ...formData, rarity: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="common">Common</SelectItem>
                        <SelectItem value="rare">Rare</SelectItem>
                        <SelectItem value="epic">Epic</SelectItem>
                        <SelectItem value="legendary">Legendary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Points</Label>
                  <Input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAchievement}>
                  Create Achievement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 bg-white/10">
            <TabsTrigger value="achievements" className="data-[state=active]:bg-white/20">
              Achievements ({achievements.length})
            </TabsTrigger>
            <TabsTrigger value="allocation" className="data-[state=active]:bg-white/20">
              User Allocation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <Card
                  key={achievement.id}
                  className={`${getRarityColor(achievement.rarity)} border`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{achievement.icon_emoji}</span>
                        <div>
                          <h3 className="font-medium text-white">{achievement.name}</h3>
                          <p className="text-sm text-white/80 mt-1">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryIcon(achievement.category)}
                        <span className="ml-1">{achievement.category.replace('_', ' ')}</span>
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {achievement.points} pts
                      </Badge>
                      {achievement.auto_allocate && (
                        <Badge variant="outline" className="text-xs bg-green-500/10">
                          Auto
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedAchievement(achievement);
                          setFormData({
                            name: achievement.name,
                            description: achievement.description,
                            icon_emoji: achievement.icon_emoji,
                            category: achievement.category,
                            rarity: achievement.rarity,
                            points: achievement.points,
                            auto_allocate: achievement.auto_allocate,
                            criteria_type: achievement.criteria?.type || 'manual',
                            criteria_value: achievement.criteria?.value || ''
                          });
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteAchievement(achievement.id)}
                      >
                        <Trash className="h-4 w-4 text-red-400" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedAchievement(achievement);
                          setIsAllocateDialogOpen(true);
                        }}
                      >
                        <Award className="h-4 w-4 mr-1" />
                        Allocate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="allocation" className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                <Input
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>

            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <Card key={user.user_id} className="bg-white/5 border-white/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">
                            {user.display_name || 'Unnamed User'}
                          </p>
                          <p className="text-white/60 text-sm">{user.email}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {user.achievements.length > 0 ? (
                              user.achievements.map((achievement, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {achievement}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-white/40 text-xs">No achievements yet</span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedUserId(user.user_id);
                            setIsAllocateDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Badge
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Edit Achievement Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gray-900 text-white">
            <DialogHeader>
              <DialogTitle>Edit Achievement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Same form fields as create dialog */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div>
                  <Label>Emoji Icon</Label>
                  <Input
                    value={formData.icon_emoji}
                    onChange={(e) => setFormData({ ...formData, icon_emoji: e.target.value })}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course_completion">Course Completion</SelectItem>
                      <SelectItem value="skill_mastery">Skill Mastery</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="special">Special</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rarity</Label>
                  <Select
                    value={formData.rarity}
                    onValueChange={(value) => setFormData({ ...formData, rarity: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAchievement}>
                Update Achievement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Allocate Achievement Dialog */}
        <Dialog open={isAllocateDialogOpen} onOpenChange={setIsAllocateDialogOpen}>
          <DialogContent className="bg-gray-900 text-white">
            <DialogHeader>
              <DialogTitle>Allocate Achievement</DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedAchievement ? (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-2xl">{selectedAchievement.icon_emoji}</span>
                    <div>
                      <p className="text-white font-medium">{selectedAchievement.name}</p>
                      <p className="text-sm">{selectedAchievement.description}</p>
                    </div>
                  </div>
                ) : (
                  'Select an achievement to allocate'
                )}
              </DialogDescription>
            </DialogHeader>

            {!selectedAchievement && (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {achievements.map((achievement) => (
                    <Button
                      key={achievement.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setSelectedAchievement(achievement)}
                    >
                      <span className="mr-2">{achievement.icon_emoji}</span>
                      {achievement.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {selectedAchievement && !selectedUserId && (
              <div>
                <Label>Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.display_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedAchievement && selectedUserId && (
              <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Allocating to:</p>
                  <p className="text-white font-medium">
                    {users.find(u => u.user_id === selectedUserId)?.display_name ||
                     users.find(u => u.user_id === selectedUserId)?.email}
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAllocateDialogOpen(false);
                  setSelectedAchievement(null);
                  setSelectedUserId('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAllocateAchievement}
                disabled={!selectedAchievement || !selectedUserId}
              >
                Allocate Achievement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}