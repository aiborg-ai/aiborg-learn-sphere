/**
 * Demo Mode Badge
 * Shows a floating badge when the app is in demo mode
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Play, X, LogOut, Info } from 'lucide-react';
import { useDemo } from '@/contexts/DemoContext';

export function DemoModeBadge() {
  const { isDemoMode, demoUser, exitDemo, isLoading } = useDemo();
  const [isOpen, setIsOpen] = useState(false);

  if (!isDemoMode || !demoUser) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="default"
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            <span className="font-medium">Demo Mode</span>
            <Badge variant="secondary" className="ml-1 bg-white/20 text-white text-xs">
              {demoUser.role}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Info className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Demo Mode Active</h4>
                  <p className="text-sm text-muted-foreground">
                    Logged in as {demoUser.displayName}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="mb-2">{demoUser.description}</p>
              <p className="text-xs">
                This is a demo account with sample data. Changes may not persist.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => exitDemo()}
                disabled={isLoading}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Exit Demo
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                Continue
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
