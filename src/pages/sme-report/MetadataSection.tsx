import { Card, CardContent } from '@/components/ui/card';
import type { MetadataSectionProps } from './types';

export function MetadataSection({
  completedBy,
  completedAt,
  createdAt,
  assessmentId,
}: MetadataSectionProps) {
  return (
    <Card className="mb-6 print:mt-8">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div>
            <strong>Completed By:</strong> {completedBy || 'Not specified'}
          </div>
          <div>
            <strong>Completed On:</strong> {new Date(completedAt || createdAt).toLocaleDateString()}
          </div>
          <div>
            <strong>Assessment ID:</strong> {assessmentId.slice(0, 8)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
