/**
 * StudioHome Component
 * Asset type selection screen for Studio
 */

import React from 'react';
import { BookOpen, Calendar, FileText, Megaphone, Plus, Edit } from '@/components/ui/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AssetType } from '@/types/studio.types';

interface AssetTypeCardData {
  type: AssetType;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  stats?: string;
}

const assetTypes: AssetTypeCardData[] = [
  {
    type: 'course',
    title: 'Course / Programme',
    description: 'Create training programs and courses with curriculum, pricing, and scheduling',
    icon: <BookOpen className="w-8 h-8" />,
    gradient: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
  },
  {
    type: 'event',
    title: 'Event',
    description: 'Create workshops, seminars, and webinars with date, time, and location',
    icon: <Calendar className="w-8 h-8" />,
    gradient: 'from-purple-500/10 to-pink-500/10 border-purple-500/20',
  },
  {
    type: 'blog',
    title: 'Blog Post',
    description: 'Write articles and content with SEO optimization and publishing schedule',
    icon: <FileText className="w-8 h-8" />,
    gradient: 'from-green-500/10 to-emerald-500/10 border-green-500/20',
  },
  {
    type: 'announcement',
    title: 'Announcement',
    description: 'Create platform-wide announcements with audience targeting and priority',
    icon: <Megaphone className="w-8 h-8" />,
    gradient: 'from-orange-500/10 to-red-500/10 border-orange-500/20',
  },
];

interface StudioHomeProps {
  onCreateNew: (assetType: AssetType) => void;
  onEditExisting: (assetType: AssetType) => void;
  className?: string;
}

export function StudioHome({ onCreateNew, onEditExisting, className }: StudioHomeProps) {
  return (
    <div className={cn('container max-w-7xl mx-auto p-6 space-y-8', className)}>
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">🎨 Admin Studio</h1>
        <p className="text-lg text-muted-foreground">What would you like to create today?</p>
      </div>

      {/* Asset Type Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {assetTypes.map(asset => (
          <Card
            key={asset.type}
            className={cn(
              'relative overflow-hidden transition-all hover:shadow-lg border-2',
              'bg-gradient-to-br',
              asset.gradient
            )}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-background/80 backdrop-blur">{asset.icon}</div>
                  <div>
                    <CardTitle className="text-xl">{asset.title}</CardTitle>
                    {asset.stats && (
                      <p className="text-sm text-muted-foreground mt-1">{asset.stats}</p>
                    )}
                  </div>
                </div>
              </div>
              <CardDescription className="text-base mt-2">{asset.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={() => onCreateNew(asset.type)} className="w-full" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Create New {asset.title}
              </Button>
              <Button
                onClick={() => onEditExisting(asset.type)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Existing
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>Studio provides a guided, step-by-step workflow for creating platform content.</p>
        <p>Your progress is automatically saved as you work.</p>
      </div>
    </div>
  );
}
