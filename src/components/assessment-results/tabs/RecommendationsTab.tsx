import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle, Sparkles } from 'lucide-react';
import type { CategoryInsight, Tool } from '../types';

interface RecommendationsTabProps {
  insights: CategoryInsight[];
  toolRecommendations: Tool[];
}

export function RecommendationsTab({ insights, toolRecommendations }: RecommendationsTabProps) {
  const weakAreas = insights.filter(
    i => i.strength_level === 'weak' || i.strength_level === 'developing'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalized Recommendations</CardTitle>
        <CardDescription>AI tools and resources to boost your augmentation level</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category-specific recommendations */}
        {weakAreas.map((insight, index) => (
          <div key={index} className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Improve {insight.category_name}
            </h4>
            <ul className="space-y-2">
              {insight.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Tool recommendations */}
        {toolRecommendations.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Recommended AI Tools to Get Started
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {toolRecommendations.map((tool, index) => (
                <Card key={index} className="p-4">
                  <h5 className="font-medium mb-1">{tool.name}</h5>
                  <p className="text-sm text-muted-foreground mb-2">{tool.description}</p>
                  <Badge variant="outline" className="text-xs">
                    {tool.difficulty_level}
                  </Badge>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
