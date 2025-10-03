import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Plus, Loader2 } from 'lucide-react';
import { useAchievements } from './useAchievements';
import { AchievementList } from './AchievementList';
import { AchievementStats } from './AchievementStats';
import { CreateAchievementDialog, EditAchievementDialog, AllocateAchievementDialog } from './AchievementDialogs';
import { Achievement, AchievementFormData } from './types';

const initialFormData: AchievementFormData = {
  name: '',
  description: '',
  icon_emoji: '🏆',
  category: 'milestone',
  rarity: 'common',
  points: 10,
  auto_allocate: false,
  criteria_type: 'manual',
  criteria_value: ''
};

export function AchievementManager() {
  const {
    achievements,
    users,
    loading,
    createAchievement,
    updateAchievement,
    deleteAchievement,
    allocateAchievement
  } = useAchievements();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAllocateDialogOpen, setIsAllocateDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('achievements');
  const [formData, setFormData] = useState<AchievementFormData>(initialFormData);

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedAchievement(null);
    setSelectedUserId('');
  };

  const handleCreateAchievement = async () => {
    const success = await createAchievement(formData);
    if (success) {
      setIsCreateDialogOpen(false);
      resetForm();
    }
  };

  const handleUpdateAchievement = async () => {
    if (!selectedAchievement) return;
    const success = await updateAchievement(selectedAchievement.id, formData);
    if (success) {
      setIsEditDialogOpen(false);
      resetForm();
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    await deleteAchievement(id);
  };

  const handleAllocateAchievement = async () => {
    if (!selectedAchievement || !selectedUserId) return;
    const success = await allocateAchievement(selectedAchievement.id, selectedUserId);
    if (success) {
      setIsAllocateDialogOpen(false);
      resetForm();
    }
  };

  const handleEditClick = (achievement: Achievement) => {
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
  };

  const handleAllocateClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setIsAllocateDialogOpen(true);
  };

  const handleAllocateToUser = (userId: string) => {
    setSelectedUserId(userId);
    setIsAllocateDialogOpen(true);
  };

  const handleAllocateDialogClose = (open: boolean) => {
    setIsAllocateDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

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
            <AchievementList
              achievements={achievements}
              onEdit={handleEditClick}
              onDelete={handleDeleteAchievement}
              onAllocate={handleAllocateClick}
            />
          </TabsContent>

          <TabsContent value="allocation" className="space-y-4">
            <AchievementStats
              users={users}
              onAllocateToUser={handleAllocateToUser}
            />
          </TabsContent>
        </Tabs>

        <CreateAchievementDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          formData={formData}
          onFormChange={setFormData}
          onSubmit={handleCreateAchievement}
        />

        <EditAchievementDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          formData={formData}
          onFormChange={setFormData}
          onSubmit={handleUpdateAchievement}
        />

        <AllocateAchievementDialog
          open={isAllocateDialogOpen}
          onOpenChange={handleAllocateDialogClose}
          selectedAchievement={selectedAchievement}
          selectedUserId={selectedUserId}
          achievements={achievements}
          users={users}
          onAchievementSelect={setSelectedAchievement}
          onUserSelect={setSelectedUserId}
          onSubmit={handleAllocateAchievement}
        />
      </CardContent>
    </Card>
  );
}
