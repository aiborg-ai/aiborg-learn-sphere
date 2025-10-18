/**
 * ProblemStatementStage Component
 * Stage 2: Problem Statement
 */

import { Card } from '@/components/ui/card';
import { Icon } from '@/utils/iconLoader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Workshop, WorkshopSession } from '@/services/workshop/types';

interface ProblemStatementStageProps {
  session: WorkshopSession;
  workshop: Workshop;
  isFacilitator: boolean;
  isParticipant: boolean;
}

export function ProblemStatementStage({ workshop }: ProblemStatementStageProps) {
  return (
    <div className="space-y-6">
      <Alert>
        <Icon name="AlertCircle" size={20} />
        <AlertDescription>
          Now it's time to understand the problem. Carefully review the problem statement and discuss with your
          team to ensure everyone has a clear understanding.
        </AlertDescription>
      </Alert>

      {/* Problem Statement */}
      <Card className="p-6 border-2 border-primary">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Icon name="Target" size={24} className="text-primary" />
          Problem Statement
        </h3>
        <div className="prose prose-sm max-w-none">
          <p className="text-lg whitespace-pre-wrap">{workshop.problem_statement}</p>
        </div>
      </Card>

      {/* Objectives */}
      {workshop.objectives && workshop.objectives.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="ListChecks" size={20} />
            Key Objectives
          </h3>
          <ul className="space-y-3">
            {workshop.objectives.map((objective, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold mt-0.5">
                  {index + 1}
                </div>
                <span className="flex-1">{objective}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Discussion Prompts */}
      <Card className="p-6 bg-primary/5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="MessageSquare" size={20} />
          Discussion Prompts
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Icon name="HelpCircle" size={18} className="text-primary mt-0.5" />
            <div>
              <p className="font-medium">What is the core problem we need to solve?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Discuss and define the problem in your own words
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Icon name="HelpCircle" size={18} className="text-primary mt-0.5" />
            <div>
              <p className="font-medium">Who are the stakeholders affected by this problem?</p>
              <p className="text-sm text-muted-foreground mt-1">Identify all parties involved</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Icon name="HelpCircle" size={18} className="text-primary mt-0.5" />
            <div>
              <p className="font-medium">What constraints or limitations do we have?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Time, resources, technology, etc.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Takeaways */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="Lightbulb" size={20} />
          Capture Your Understanding
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Document your team's understanding of the problem. This will guide your solution in the next stage.
        </p>
        <div className="bg-muted p-4 rounded-lg min-h-32">
          <p className="text-sm text-muted-foreground italic">
            Team notes will appear here during the workshop session...
          </p>
        </div>
      </Card>
    </div>
  );
}
