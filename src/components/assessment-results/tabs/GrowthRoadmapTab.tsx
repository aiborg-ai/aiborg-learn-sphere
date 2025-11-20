import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { TrendingUp } from '@/components/ui/icons';

interface GrowthRoadmapTabProps {
  scorePercentage: number;
}

export function GrowthRoadmapTab({ scorePercentage }: GrowthRoadmapTabProps) {
  // Calculate potential growth based on current level
  const potentialGrowth =
    scorePercentage < 50 ? '30-40%' : scorePercentage < 75 ? '20-30%' : '10-20%';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your AI Growth Roadmap</CardTitle>
        <CardDescription>A personalized path to increase your AI augmentation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Week 1-2 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                1
              </div>
              <div className="w-0.5 h-full bg-muted mt-2" />
            </div>
            <div className="flex-1 pb-8">
              <h4 className="font-semibold mb-2">Week 1-2: Foundation</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Set up 2-3 basic AI tools from recommendations</li>
                <li>• Complete beginner tutorials for each tool</li>
                <li>• Practice daily with simple tasks</li>
              </ul>
            </div>
          </div>

          {/* Week 3-4 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary/80 text-white flex items-center justify-center font-semibold">
                2
              </div>
              <div className="w-0.5 h-full bg-muted mt-2" />
            </div>
            <div className="flex-1 pb-8">
              <h4 className="font-semibold mb-2">Week 3-4: Integration</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Integrate AI tools into your daily workflow</li>
                <li>• Explore advanced features</li>
                <li>• Join AI communities for tips and tricks</li>
              </ul>
            </div>
          </div>

          {/* Month 2 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary/60 text-white flex items-center justify-center font-semibold">
                3
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Month 2: Expansion</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Add specialized tools for your weak areas</li>
                <li>• Automate repetitive tasks</li>
                <li>• Retake assessment to track progress</li>
              </ul>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            Based on your current level, you could increase your AI augmentation score by
            <span className="font-semibold"> {potentialGrowth}</span> in the next 2 months with
            consistent practice.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
