/**
 * SolvingStage Component
 * Stage 3: Problem Solving
 */

import { Card } from '@/components/ui/card';
import { Icon } from '@/utils/iconLoader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Workshop, WorkshopSession } from '@/services/workshop/types';

interface SolvingStageProps {
  session: WorkshopSession;
  workshop: Workshop;
  isFacilitator: boolean;
  isParticipant: boolean;
}

export function SolvingStage({ workshop }: SolvingStageProps) {
  return (
    <div className="space-y-6">
      <Alert>
        <Icon name="Sparkles" size={20} />
        <AlertDescription>
          This is the main phase! Work collaboratively with your team to develop a solution. Use the solving
          instructions as a guide.
        </AlertDescription>
      </Alert>

      {/* Solving Instructions */}
      {workshop.solving_instructions && (
        <Card className="p-6 border-2 border-primary/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="BookOpen" size={20} />
            Solving Instructions
          </h3>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{workshop.solving_instructions}</p>
          </div>
        </Card>
      )}

      {/* Collaborative Workspace */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="Users" size={20} />
          Collaborative Workspace
        </h3>
        <div className="space-y-4">
          {/* Ideation Area */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Icon name="Lightbulb" size={16} />
              Brainstorming & Ideas
            </h4>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg min-h-32">
              <p className="text-sm text-muted-foreground italic">
                Share all your ideas here - no idea is too small or too wild!
              </p>
            </div>
          </div>

          {/* Solution Development */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Icon name="Puzzle" size={16} />
              Solution Development
            </h4>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg min-h-32">
              <p className="text-sm text-muted-foreground italic">
                Document your solution approach, methodology, and key components
              </p>
            </div>
          </div>

          {/* Implementation Plan */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Icon name="ClipboardList" size={16} />
              Implementation Plan
            </h4>
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg min-h-32">
              <p className="text-sm text-muted-foreground italic">
                Outline the steps needed to implement your solution
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tips for Success */}
      <Card className="p-6 bg-primary/5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="Award" size={20} />
          Tips for Effective Problem Solving
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Icon name="CheckCircle" size={18} className="text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Think creatively</p>
              <p className="text-sm text-muted-foreground">
                Don't be afraid to explore unconventional approaches
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Icon name="CheckCircle" size={18} className="text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Build on each other's ideas</p>
              <p className="text-sm text-muted-foreground">Collaboration amplifies creativity</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Icon name="CheckCircle" size={18} className="text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Validate your assumptions</p>
              <p className="text-sm text-muted-foreground">
                Test your ideas before finalizing the solution
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Icon name="CheckCircle" size={18} className="text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Document your thinking</p>
              <p className="text-sm text-muted-foreground">
                Record why you made certain decisions - it helps during reporting
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Deliverables Checklist */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="ListTodo" size={20} />
          Deliverables Checklist
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 rounded hover:bg-muted">
            <input type="checkbox" className="w-4 h-4" />
            <label className="text-sm">Problem analysis completed</label>
          </div>
          <div className="flex items-center gap-3 p-2 rounded hover:bg-muted">
            <input type="checkbox" className="w-4 h-4" />
            <label className="text-sm">Solution approach defined</label>
          </div>
          <div className="flex items-center gap-3 p-2 rounded hover:bg-muted">
            <input type="checkbox" className="w-4 h-4" />
            <label className="text-sm">Key components identified</label>
          </div>
          <div className="flex items-center gap-3 p-2 rounded hover:bg-muted">
            <input type="checkbox" className="w-4 h-4" />
            <label className="text-sm">Implementation plan created</label>
          </div>
          <div className="flex items-center gap-3 p-2 rounded hover:bg-muted">
            <input type="checkbox" className="w-4 h-4" />
            <label className="text-sm">Solution validated with team</label>
          </div>
        </div>
      </Card>
    </div>
  );
}
