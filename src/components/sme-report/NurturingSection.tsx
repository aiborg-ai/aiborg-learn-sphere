/**
 * NurturingSection Component
 *
 * Admin-only section displaying lead nurturing campaign timeline
 * Shows email sequence, engagement metrics, and campaign status
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Eye, MousePointerClick, Calendar, Pause, Play } from 'lucide-react';
import DOMPurify from 'dompurify';
import type { SMENurturingCampaign } from '@/types/aiAssessment';

interface NurturingSectionProps {
  nurturingCampaign?: SMENurturingCampaign;
  isAdmin?: boolean;
}

export function NurturingSection({ nurturingCampaign, isAdmin = false }: NurturingSectionProps) {
  // Only visible to admins
  if (!isAdmin) {
    return null;
  }

  // If no campaign data, show placeholder
  if (!nurturingCampaign) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Lead Nurturing Campaign</h2>
          <p className="text-muted-foreground">
            Campaign setup in progress. Please refresh the page in a moment.
          </p>
        </div>
      </div>
    );
  }

  const emails = nurturingCampaign.sme_nurturing_emails || [];
  const engagementRate =
    nurturingCampaign.emails_sent > 0
      ? ((nurturingCampaign.emails_opened / nurturingCampaign.emails_sent) * 100).toFixed(0)
      : '0';

  return (
    <section className="space-y-6" aria-labelledby="nurturing-heading">
      <div>
        <h2 id="nurturing-heading" className="text-2xl font-bold mb-2">
          Lead Nurturing Campaign
        </h2>
        <p className="text-muted-foreground">
          Automated email sequence and engagement tracking (Admin Only)
        </p>
      </div>

      {/* Campaign Status */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Campaign Status</p>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  nurturingCampaign.campaign_status === 'active'
                    ? 'bg-green-500'
                    : nurturingCampaign.campaign_status === 'paused'
                      ? 'bg-yellow-500'
                      : nurturingCampaign.campaign_status === 'completed'
                        ? 'bg-blue-500'
                        : 'bg-gray-500'
                }
                aria-label={`Campaign status: ${nurturingCampaign.campaign_status}`}
              >
                {nurturingCampaign.campaign_status}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            aria-label={
              nurturingCampaign.campaign_status === 'active' ? 'Pause campaign' : 'Resume campaign'
            }
          >
            {nurturingCampaign.campaign_status === 'active' ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause Campaign
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume Campaign
              </>
            )}
          </Button>
        </div>

        <dl className="grid md:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <dt className="text-sm text-muted-foreground">Emails Sent</dt>
            </div>
            <dd className="text-2xl font-bold">{nurturingCampaign.emails_sent}/7</dd>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <dt className="text-sm text-muted-foreground">Open Rate</dt>
            </div>
            <dd className="text-2xl font-bold">{engagementRate}%</dd>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MousePointerClick className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <dt className="text-sm text-muted-foreground">Link Clicks</dt>
            </div>
            <dd className="text-2xl font-bold">{nurturingCampaign.links_clicked}</dd>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <dt className="text-sm text-muted-foreground">Next Email</dt>
            </div>
            <dd className="text-sm font-semibold">
              {nurturingCampaign.next_email_scheduled_at
                ? new Date(nurturingCampaign.next_email_scheduled_at).toLocaleDateString()
                : 'N/A'}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Email Timeline */}
      {emails.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Email Sequence Timeline</h3>
          <div className="space-y-4">
            {emails.map((email, index) => (
              <div
                key={email.id}
                className={`relative flex items-start gap-4 p-4 rounded-lg border-2 ${
                  email.status === 'sent' || email.status === 'opened' || email.status === 'clicked'
                    ? 'bg-green-50 border-green-200'
                    : email.status === 'pending'
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-red-50 border-red-200'
                }`}
              >
                {/* Timeline connector */}
                {index < emails.length - 1 && (
                  <div className="absolute left-6 top-14 w-0.5 h-8 bg-gray-300" />
                )}

                {/* Email number badge */}
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full font-bold flex-shrink-0 ${
                    email.status === 'sent' ||
                    email.status === 'opened' ||
                    email.status === 'clicked'
                      ? 'bg-green-500 text-white'
                      : email.status === 'pending'
                        ? 'bg-gray-300 text-gray-700'
                        : 'bg-red-500 text-white'
                  }`}
                >
                  {email.sequence_number}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div>
                      <h4 className="font-semibold text-lg">{email.subject_line}</h4>
                      <p className="text-sm text-muted-foreground">
                        {email.email_type.replace(/_/g, ' ')} • Day{' '}
                        {email.scheduled_days_after_start}
                      </p>
                    </div>
                    <Badge
                      variant={
                        email.status === 'clicked'
                          ? 'default'
                          : email.status === 'opened'
                            ? 'secondary'
                            : email.status === 'sent'
                              ? 'outline'
                              : 'destructive'
                      }
                      aria-label={`Email status: ${email.status}`}
                    >
                      {email.status}
                    </Badge>
                  </div>

                  {email.sent_at && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span>Sent: {new Date(email.sent_at).toLocaleString()}</span>
                      {email.opened_at && (
                        <span>Opened: {new Date(email.opened_at).toLocaleString()}</span>
                      )}
                      {email.clicked_at && (
                        <span>Clicked: {new Date(email.clicked_at).toLocaleString()}</span>
                      )}
                    </div>
                  )}

                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-primary">
                      View Email Content
                    </summary>
                    <div
                      className="mt-2 p-3 bg-white rounded border text-sm max-h-96 overflow-y-auto"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(email.email_body, {
                          ALLOWED_TAGS: ['h1', 'h2', 'p', 'a', 'ul', 'li', 'strong', 'br'],
                          ALLOWED_ATTR: ['href', 'target'],
                        }),
                      }}
                    />
                  </details>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Campaign Details */}
      <Card className="p-6">
        <h3 id="campaign-details-heading" className="text-xl font-bold mb-4">
          Campaign Details
        </h3>
        <dl className="grid md:grid-cols-2 gap-4" aria-labelledby="campaign-details-heading">
          <div>
            <dt className="text-sm text-muted-foreground mb-1">Recipient Email</dt>
            <dd className="font-semibold">{nurturingCampaign.company_email}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground mb-1">Start Date</dt>
            <dd className="font-semibold">
              {new Date(nurturingCampaign.start_date).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground mb-1">Assessment ID</dt>
            <dd className="font-mono text-sm">{nurturingCampaign.assessment_id}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground mb-1">Last Updated</dt>
            <dd className="font-semibold">
              {new Date(nurturingCampaign.updated_at).toLocaleString()}
            </dd>
          </div>
        </dl>
      </Card>
    </section>
  );
}
