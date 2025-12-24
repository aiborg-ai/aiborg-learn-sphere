/**
 * EmptyStateCard Component
 * Display friendly empty states with optional call-to-action
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { EmptyStateConfig } from '../types';

interface EmptyStateCardProps {
  config: EmptyStateConfig;
  className?: string;
}

export function EmptyStateCard({ config, className }: EmptyStateCardProps) {
  const { icon: Icon = TrendingUp, title, description, actionLabel, onAction } = config;

  return (
    <Card className={cn('text-center', className)}>
      <CardHeader>
        <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base mt-2">{description}</CardDescription>
      </CardHeader>

      {actionLabel && onAction && (
        <CardContent>
          <Button onClick={onAction} size="lg" className="gap-2">
            <Icon className="h-4 w-4" />
            {actionLabel}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
