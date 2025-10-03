import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Achievement, AchievementFormData, UserWithAchievements } from './types';
import { AchievementForm } from './AchievementForm';

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: AchievementFormData;
  onFormChange: (data: AchievementFormData) => void;
  onSubmit: () => void;
}

export const CreateAchievementDialog: React.FC<CreateDialogProps> = ({
  open,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle>Create New Achievement</DialogTitle>
          <DialogDescription className="text-gray-400">
            Define a new badge for users to earn
          </DialogDescription>
        </DialogHeader>
        <AchievementForm formData={formData} onChange={onFormChange} />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            Create Achievement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface EditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: AchievementFormData;
  onFormChange: (data: AchievementFormData) => void;
  onSubmit: () => void;
}

export const EditAchievementDialog: React.FC<EditDialogProps> = ({
  open,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle>Edit Achievement</DialogTitle>
        </DialogHeader>
        <AchievementForm formData={formData} onChange={onFormChange} />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            Update Achievement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface AllocateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAchievement: Achievement | null;
  selectedUserId: string;
  achievements: Achievement[];
  users: UserWithAchievements[];
  onAchievementSelect: (achievement: Achievement) => void;
  onUserSelect: (userId: string) => void;
  onSubmit: () => void;
}

export const AllocateAchievementDialog: React.FC<AllocateDialogProps> = ({
  open,
  onOpenChange,
  selectedAchievement,
  selectedUserId,
  achievements,
  users,
  onAchievementSelect,
  onUserSelect,
  onSubmit
}) => {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  onClick={() => onAchievementSelect(achievement)}
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
            <Select value={selectedUserId} onValueChange={onUserSelect}>
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
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!selectedAchievement || !selectedUserId}
          >
            Allocate Achievement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
