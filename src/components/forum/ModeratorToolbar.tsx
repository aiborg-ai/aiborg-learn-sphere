/**
 * ModeratorToolbar Component
 * Quick moderation actions for threads and posts
 */

import { Pin, Lock, Trash2, MoveHorizontal, Edit, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ModeratorToolbarProps } from '@/types/forum';

export function ModeratorToolbar({
  threadId,
  postId,
  isPinned = false,
  isLocked = false,
  onPin,
  onLock,
  onDelete,
  onEdit,
  onMove,
}: ModeratorToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
      <Shield className="h-4 w-4 text-yellow-700" />
      <span className="text-sm font-medium text-yellow-900">Moderator Actions</span>

      <div className="flex-1" />

      {/* Thread Actions */}
      {threadId && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className={cn('text-yellow-700 hover:bg-yellow-100', isPinned && 'bg-yellow-200')}
            onClick={onPin}
          >
            <Pin className="h-4 w-4 mr-1" />
            {isPinned ? 'Unpin' : 'Pin'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn('text-yellow-700 hover:bg-yellow-100', isLocked && 'bg-yellow-200')}
            onClick={onLock}
          >
            <Lock className="h-4 w-4 mr-1" />
            {isLocked ? 'Unlock' : 'Lock'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-yellow-700 hover:bg-yellow-100"
            onClick={onMove}
          >
            <MoveHorizontal className="h-4 w-4 mr-1" />
            Move
          </Button>
        </>
      )}

      {/* Post Actions */}
      {postId && onEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="text-yellow-700 hover:bg-yellow-100"
          onClick={onEdit}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      )}

      {/* Delete (both thread and post) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-red-600" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Confirm Delete
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Cancel</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
