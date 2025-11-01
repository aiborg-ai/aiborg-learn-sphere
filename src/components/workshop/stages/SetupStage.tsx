/**
 * SetupStage Component
 * Stage 1: Setup & Preparation
 */

import { Card } from '@/components/ui/card';
import { Icon } from '@/utils/iconLoader';
import type { Workshop, WorkshopSession, WorkshopParticipant } from '@/services/workshop/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SetupStageProps {
  session: WorkshopSession;
  workshop: Workshop;
  participants: WorkshopParticipant[];
  isFacilitator: boolean;
  isParticipant: boolean;
}

export function SetupStage({ session, workshop, participants }: SetupStageProps) {
  return (
    <div className="space-y-6">
      <Alert>
        <Icon name="Info" size={20} />
        <AlertDescription>
          Welcome to the workshop! Please take time to review the instructions, materials, and get
          familiar with your team members.
        </AlertDescription>
      </Alert>

      {/* Setup Instructions */}
      {workshop.setup_instructions && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="BookOpen" size={20} />
            Setup Instructions
          </h3>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{workshop.setup_instructions}</p>
          </div>
        </Card>
      )}

      {/* Materials & Resources */}
      {workshop.materials && workshop.materials.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="FileText" size={20} />
            Materials & Resources
          </h3>
          <div className="space-y-2">
            {workshop.materials.map((material, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon name="Link" size={16} />
                  <div>
                    <p className="font-medium">{material.title}</p>
                    {material.description && (
                      <p className="text-sm text-muted-foreground">{material.description}</p>
                    )}
                  </div>
                </div>
                {material.url && (
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="text-sm">Open</span>
                    <Icon name="ExternalLink" size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tools Required */}
      {workshop.tools_required && workshop.tools_required.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="Wrench" size={20} />
            Tools Required
          </h3>
          <ul className="space-y-2">
            {workshop.tools_required.map((tool, index) => (
              <li key={index} className="flex items-center gap-2">
                <Icon name="CheckCircle" size={16} className="text-green-500" />
                <span>{tool}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Team Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="Users" size={20} />
          Your Team ({participants.length})
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          You'll be working with {participants.length} participant(s) during this workshop. Take a
          moment to introduce yourselves!
        </p>
        <div className="bg-primary/5 p-4 rounded-lg">
          <p className="text-sm font-medium">💡 Tip for Success</p>
          <p className="text-sm text-muted-foreground mt-1">
            Effective collaboration is key! Make sure everyone understands their role and the
            workshop goals.
          </p>
        </div>
      </Card>

      {/* Shared Notes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="FileEdit" size={20} />
          Shared Notes
        </h3>
        <div className="bg-muted p-4 rounded-lg min-h-32">
          <p className="text-sm text-muted-foreground">
            {session.shared_notes ||
              'No notes yet. Team members can add notes during the workshop.'}
          </p>
        </div>
      </Card>
    </div>
  );
}
