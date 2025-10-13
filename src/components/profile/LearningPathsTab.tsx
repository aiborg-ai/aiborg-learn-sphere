import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Brain } from 'lucide-react';

interface LearningPathsTabProps {
  onGeneratePath: () => void;
  onBrowsePaths: () => void;
}

export function LearningPathsTab({ onGeneratePath, onBrowsePaths }: LearningPathsTabProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5" />
              Your Learning Paths
            </CardTitle>
            <CardDescription className="text-white/80">
              AI-powered personalized learning journeys
            </CardDescription>
          </div>
          <Button onClick={onGeneratePath} className="btn-hero">
            <Brain className="h-4 w-4 mr-2" />
            Create New Path
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Target className="h-16 w-16 text-white/50 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2 text-xl">Start Your Learning Journey</h3>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Create an AI-powered personalized learning path based on your assessment results and
            goals
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={onGeneratePath} className="btn-hero">
              <Brain className="h-4 w-4 mr-2" />
              Generate Learning Path
            </Button>
            <Button
              onClick={onBrowsePaths}
              variant="outline"
              className="text-white border-white/20 hover:bg-white/10"
            >
              Browse All Paths
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
