/**
 * ReportingStage Component
 * Stage 4: Reporting & Presentation
 */

import { Card } from '@/components/ui/card';
import { Icon } from '@/utils/iconLoader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Workshop, WorkshopSession } from '@/services/workshop/types';

interface ReportingStageProps {
  session: WorkshopSession;
  workshop: Workshop;
  isFacilitator: boolean;
  isParticipant: boolean;
}

export function ReportingStage({ workshop }: ReportingStageProps) {
  return (
    <div className="space-y-6">
      <Alert>
        <Icon name="Presentation" size={20} />
        <AlertDescription>
          Final stage! Prepare your presentation and document your solution. This is your opportunity to
          showcase your team's work.
        </AlertDescription>
      </Alert>

      {/* Reporting Instructions */}
      {workshop.reporting_instructions && (
        <Card className="p-6 border-2 border-primary/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="BookOpen" size={20} />
            Reporting Instructions
          </h3>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{workshop.reporting_instructions}</p>
          </div>
        </Card>
      )}

      {/* Presentation Structure */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="Layout" size={20} />
          Recommended Presentation Structure
        </h3>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold text-sm mb-1">1. Problem Overview (2 min)</h4>
            <p className="text-sm text-muted-foreground">
              Recap the problem you were solving and why it matters
            </p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-semibold text-sm mb-1">2. Solution Approach (3 min)</h4>
            <p className="text-sm text-muted-foreground">
              Explain your methodology and key decisions
            </p>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-semibold text-sm mb-1">3. Solution Details (5 min)</h4>
            <p className="text-sm text-muted-foreground">
              Present your solution with diagrams, demos, or prototypes
            </p>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-semibold text-sm mb-1">4. Implementation & Impact (3 min)</h4>
            <p className="text-sm text-muted-foreground">
              Discuss how it would be implemented and expected outcomes
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-semibold text-sm mb-1">5. Q&A (2 min)</h4>
            <p className="text-sm text-muted-foreground">
              Answer questions and discuss alternative approaches
            </p>
          </div>
        </div>
      </Card>

      {/* Presentation Materials */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="FileText" size={20} />
          Presentation Materials
        </h3>
        <div className="space-y-3">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">Slides / Presentation</span>
              <Icon name="Upload" size={16} className="text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Upload your presentation slides (PDF, PPTX, Google Slides link)
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">Supporting Documents</span>
              <Icon name="Upload" size={16} className="text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Additional documentation, diagrams, or research materials
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">Demo / Prototype</span>
              <Icon name="Upload" size={16} className="text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Links to demos, prototypes, or working examples
            </p>
          </div>
        </div>
      </Card>

      {/* Evaluation Criteria */}
      <Card className="p-6 bg-primary/5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="Star" size={20} />
          Evaluation Criteria
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Icon name="CheckCircle" size={18} className="text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Innovation & Creativity</p>
              <p className="text-xs text-muted-foreground">
                How original and creative is your solution?
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Icon name="CheckCircle" size={18} className="text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Feasibility</p>
              <p className="text-xs text-muted-foreground">Can this solution be realistically implemented?</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Icon name="CheckCircle" size={18} className="text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Impact</p>
              <p className="text-xs text-muted-foreground">
                How effectively does it solve the problem?
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Icon name="CheckCircle" size={18} className="text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Presentation Quality</p>
              <p className="text-xs text-muted-foreground">
                How clear and engaging is your presentation?
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Icon name="CheckCircle" size={18} className="text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Teamwork</p>
              <p className="text-xs text-muted-foreground">
                How well did the team collaborate?
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Final Checklist */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="ListTodo" size={20} />
          Pre-Presentation Checklist
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 rounded hover:bg-muted">
            <input type="checkbox" className="w-4 h-4" />
            <label className="text-sm">Presentation slides prepared</label>
          </div>
          <div className="flex items-center gap-3 p-2 rounded hover:bg-muted">
            <input type="checkbox" className="w-4 h-4" />
            <label className="text-sm">All team members understand their role</label>
          </div>
          <div className="flex items-center gap-3 p-2 rounded hover:bg-muted">
            <input type="checkbox" className="w-4 h-4" />
            <label className="text-sm">Practiced the presentation timing</label>
          </div>
          <div className="flex items-center gap-3 p-2 rounded hover:bg-muted">
            <input type="checkbox" className="w-4 h-4" />
            <label className="text-sm">Demo/prototype ready (if applicable)</label>
          </div>
          <div className="flex items-center gap-3 p-2 rounded hover:bg-muted">
            <input type="checkbox" className="w-4 h-4" />
            <label className="text-sm">Prepared for Q&A session</label>
          </div>
        </div>
      </Card>

      <Alert className="bg-green-50 border-green-200">
        <Icon name="Trophy" size={20} className="text-green-600" />
        <AlertDescription className="text-green-900">
          <strong>You're almost done!</strong> Once your presentation is ready, the facilitator will move to
          the final stage and award your AIBORG points.
        </AlertDescription>
      </Alert>
    </div>
  );
}
