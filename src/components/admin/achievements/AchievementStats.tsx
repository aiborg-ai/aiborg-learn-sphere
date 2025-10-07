import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus } from 'lucide-react';
import type { UserWithAchievements } from './types';

interface AchievementStatsProps {
  users: UserWithAchievements[];
  onAllocateToUser: (userId: string) => void;
}

export const AchievementStats: React.FC<AchievementStatsProps> = ({ users, onAllocateToUser }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(
    user =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
          <Input
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white"
          />
        </div>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-3">
          {filteredUsers.map(user => (
            <Card key={user.user_id} className="bg-white/5 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{user.display_name || 'Unnamed User'}</p>
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
                  <Button size="sm" onClick={() => onAllocateToUser(user.user_id)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Badge
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
