import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LearningInsight {
  id: string;
  insight_type: 'strength' | 'weakness' | 'pattern' | 'achievement' | 'suggestion';
  category: string;
  title: string;
  description: string;
  confidence_score: number;
  created_at: string;
}

const insightIcons = {
  strength: { icon: TrendingUp, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950" },
  weakness: { icon: TrendingDown, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950" },
  pattern: { icon: Target, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950" },
  achievement: { icon: Award, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950" },
  suggestion: { icon: AlertCircle, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950" },
};

export function AIInsightsWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInsights();
    }
  }, [user]);

  const fetchInsights = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_learning_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setInsights(data || []);
    } catch (error) {
      logger.error('Error fetching AI insights:', error);
      toast({
        title: "Error",
        description: "Failed to load learning insights",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return <Badge variant="default" className="text-xs">High</Badge>;
    if (score >= 0.6) return <Badge variant="secondary" className="text-xs">Medium</Badge>;
    return <Badge variant="outline" className="text-xs">Low</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Learning Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          AI Learning Insights
        </CardTitle>
        <CardDescription>
          Personalized insights based on your learning patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Start studying to generate personalized insights!
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Our AI will analyze your learning patterns and provide helpful suggestions.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {insights.map((insight) => {
                const config = insightIcons[insight.insight_type];
                const Icon = config.icon;

                return (
                  <div
                    key={insight.id}
                    className={`p-3 rounded-lg border ${config.bg} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${config.bg}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate">
                            {insight.title}
                          </h4>
                          {getConfidenceBadge(insight.confidence_score)}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {insight.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {insight.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(insight.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {insights.length > 0 && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "Detailed insights view is under development"
              });
            }}
          >
            View All Insights
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
