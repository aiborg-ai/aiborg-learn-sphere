import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Clock, FileText, Download, Eye } from 'lucide-react';
import type { Submission } from './SubmissionForm';

interface SubmissionHistoryProps {
  submissions: Submission[];
  onViewSubmission?: (submission: Submission) => void;
  onDownloadSubmission?: (submission: Submission) => void;
}

export function SubmissionHistory({
  submissions,
  onViewSubmission,
  onDownloadSubmission
}: SubmissionHistoryProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, icon: Clock },
      submitted: { variant: 'default' as const, icon: CheckCircle },
      graded: { variant: 'success' as const, icon: CheckCircle },
      returned: { variant: 'warning' as const, icon: FileText }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (submissions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission History</CardTitle>
        <CardDescription>
          View your previous submissions and drafts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {submissions.map((submission, index) => (
              <div
                key={submission.id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        Submission #{submissions.length - index}
                      </p>
                      {getStatusBadge(submission.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {submission.submitted_at
                        ? `Submitted: ${new Date(submission.submitted_at).toLocaleString()}`
                        : 'Not submitted yet'}
                    </p>
                    {submission.graded_at && (
                      <p className="text-sm text-muted-foreground">
                        Graded: {new Date(submission.graded_at).toLocaleString()}
                      </p>
                    )}
                    {submission.score !== null && (
                      <p className="text-sm font-medium">
                        Score: {submission.score} points
                      </p>
                    )}
                    {submission.feedback && (
                      <p className="text-sm text-muted-foreground italic">
                        "{submission.feedback}"
                      </p>
                    )}
                    {submission.file_urls && submission.file_urls.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {submission.file_urls.length} file(s) attached
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {onViewSubmission && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewSubmission(submission)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                    {onDownloadSubmission && submission.file_urls.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownloadSubmission(submission)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Files
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}